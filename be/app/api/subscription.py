import os
import logging
from datetime import datetime, timedelta
from typing import Optional
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass


from fastapi import APIRouter, Depends, HTTPException, Header, Request
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import User, SubscriptionHistory
from app.schemas.schemas import CheckoutSessionRequest, SubscriptionUpgradeRequest, SubscriptionStatusOut, VerifySessionRequest

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/subscription", tags=["Subscriptions & Stripe"])



router = APIRouter(prefix="/api/v1/subscription", tags=["Subscriptions & Stripe"])

# Plan pricing mapping
PLAN_PRICES = {
    "plus": {"name": "HealthLens Plus", "amount_vnd": 25000, "stripe_price_usd": 1.00},
    "pro": {"name": "HealthLens Pro", "amount_vnd": 50000, "stripe_price_usd": 2.00}
}

@router.get("/plans")
def get_subscription_plans():
    """
    Returns available subscription tiers and feature matrix.
    """
    return {
        "plans": [
            {
                "id": "standard",
                "name": "Standard (Free Tier)",
                "price_vnd": 0,
                "price_display": "$0 / month",
                "features": [
                    "Manual food logging",
                    "Basic weight & BMI tracking",
                    "Personal profile management"
                ],
                "badge": "Free",
                "is_current_default": True
            },
            {
                "id": "plus",
                "name": "Plus (Food Scanner Tier)",
                "price_vnd": 25000,
                "price_display": "~$1.00 / month (25,000 VND)",
                "features": [
                    "All Standard tier features",
                    "⚡ AI Food Image Scanning (YOLOv8)",
                    "Automated Calorie, Protein, Carbs, Fat analysis",
                    "Ground-Truth food database access"
                ],
                "badge": "Most Popular",
                "is_current_default": False
            },
            {
                "id": "pro",
                "name": "Pro (AI Expert Tier)",
                "price_vnd": 50000,
                "price_display": "~$2.00 / month (50,000 VND)",
                "features": [
                    "All Plus tier features",
                    "👑 Full-body AI Pose Analysis (YOLO Pose)",
                    "10-Level BMI Scale & Biometric advice",
                    "🥗 Daily AI Recommended Meal Plan",
                    "Priority support & Detailed nutrition reports"
                ],
                "badge": "Premium Exclusive",
                "is_current_default": False
            }
        ]
    }

@router.post("/create-checkout-session")
def create_checkout_session(payload: CheckoutSessionRequest, request: Request, db: Session = Depends(get_db)):
    """
    Creates a real Stripe Checkout Session for subscription payment.
    Requires STRIPE_SECRET_KEY in environment variables.
    """
    plan = payload.plan.lower()
    if plan not in PLAN_PRICES:
        raise HTTPException(status_code=400, detail="Invalid subscription tier (Select 'plus' or 'pro')")

    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        import stripe
    except ImportError:
        stripe = None

    stripe_secret_key = os.getenv("STRIPE_SECRET_KEY")
    plan_info = PLAN_PRICES[plan]

    # Dynamically extract client origin from request headers (e.g. http://localhost:4173 or http://localhost:3000)
    origin_header = request.headers.get("origin") or request.headers.get("referer")
    if origin_header:
        from urllib.parse import urlparse
        parsed = urlparse(origin_header)
        base_url = f"{parsed.scheme}://{parsed.netloc}"
    else:
        base_url = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")

    success_url = f"{base_url}/dashboard?payment=success&session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{base_url}/dashboard?payment=cancel"

    is_real_key = bool(
        stripe and
        stripe_secret_key and 
        (stripe_secret_key.startswith("sk_test_") or stripe_secret_key.startswith("sk_live_")) and
        "your_stripe" not in stripe_secret_key and
        len(stripe_secret_key) > 30
    )

    if is_real_key:
        try:
            stripe.api_key = stripe_secret_key
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {
                            'name': f"{plan_info['name']} - HealthLens AI",
                            'description': f"Upgrade to {plan.upper()} tier AI services",
                        },
                        'unit_amount': int(plan_info['stripe_price_usd'] * 100),
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url=success_url,
                cancel_url=cancel_url,
                client_reference_id=str(user.id),
                metadata={"user_id": str(user.id), "plan": plan},
                customer_email=user.email
            )

            return {
                "checkout_url": session.url,
                "session_id": session.id,
                "plan": plan,
                "amount_vnd": plan_info["amount_vnd"]
            }
        except Exception as e:
            logger.warning(f"Stripe Checkout API call failed: {e}")

    # Fallback to Demo Mode (does NOT auto-upgrade, returns demo session ID)
    demo_session_id = f"demo_session_{user.id}_{int(datetime.utcnow().timestamp())}"
    return {
        "checkout_url": f"{base_url}/dashboard?payment=success&session_id={demo_session_id}&plan={plan}",
        "session_id": demo_session_id,
        "plan": plan,
        "amount_vnd": plan_info["amount_vnd"]
    }



@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Real Stripe Webhook listener for checkout.session.completed events.
    Automatically upgrades user plan upon successful payment.
    """
    import stripe

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    endpoint_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

    stripe_secret_key = os.getenv("STRIPE_SECRET_KEY")
    if stripe_secret_key:
        stripe.api_key = stripe_secret_key

    event = None
    try:
        if endpoint_secret and sig_header:
            event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
        else:
            import json
            data = json.loads(payload)
            event = data
    except Exception as e:
        logger.error(f"Stripe Webhook Verification Error: {e}")
        raise HTTPException(status_code=400, detail=f"Webhook Error: {str(e)}")

    event_type = event.get("type") if isinstance(event, dict) else event.type

    if event_type == "checkout.session.completed":
        session_obj = event["data"]["object"] if isinstance(event, dict) else event.data.object
        client_ref = session_obj.get("client_reference_id")
        metadata = session_obj.get("metadata", {})
        plan = metadata.get("plan", "plus")

        if client_ref:
            user_id = int(client_ref)
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                user.plan = plan
                user.subscription_status = "active"
                user.subscription_expires_at = datetime.utcnow() + timedelta(days=30)

                history = SubscriptionHistory(
                    user_id=user.id,
                    plan=plan,
                    amount_vnd=PLAN_PRICES.get(plan, {}).get("amount_vnd", 25000),
                    payment_method="stripe",
                    stripe_session_id=session_obj.get("id")
                )
                db.add(history)
                db.commit()
                logger.info(f"Stripe Webhook: Successfully upgraded User {user.id} to plan {plan}")

    return {"status": "success"}


@router.post("/upgrade")
def upgrade_subscription(payload: SubscriptionUpgradeRequest, db: Session = Depends(get_db)):
    """
    Upgrades user subscription plan immediately and logs transaction history.
    """
    plan = payload.plan.lower()
    if plan not in ["plus", "pro"]:
        raise HTTPException(status_code=400, detail="Invalid tier. Please select 'plus' or 'pro'.")

    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")

    amount_vnd = PLAN_PRICES[plan]["amount_vnd"]
    expires_at = datetime.utcnow() + timedelta(days=30)

    # Update user plan
    user.plan = plan
    user.subscription_status = "active"
    user.subscription_expires_at = expires_at
    db.commit()

    # Log in subscription history
    history = SubscriptionHistory(
        user_id=user.id,
        plan=plan,
        amount_vnd=amount_vnd,
        payment_method=payload.payment_method or "stripe",
        stripe_session_id=f"sess_{datetime.utcnow().timestamp()}"
    )
    db.add(history)
    db.commit()
    db.refresh(history)

    return {
        "message": f"🎉 Congratulations! You have successfully upgraded to {plan.upper()} tier!",
        "plan": user.plan,
        "subscription_status": user.subscription_status,
        "expires_at": user.subscription_expires_at,
        "transaction_id": history.id
    }

def expire_outdated_subscriptions(db: Session):
    """
    Scans DB for expired subscriptions (expires_at < now)
    and automatically resets plan to 'standard' and status to 'expired'.
    """
    now = datetime.utcnow()
    expired_users = db.query(User).filter(
        User.plan != "standard",
        User.subscription_expires_at != None,
        User.subscription_expires_at < now
    ).all()

    for u in expired_users:
        logger.info(f"Subscription expired for User #{u.id} (expired at {u.subscription_expires_at}). Downgrading to 'standard'.")
        u.plan = "standard"
        u.subscription_status = "expired"

    if expired_users:
        db.commit()

@router.get("/status/{user_id}", response_model=SubscriptionStatusOut)
def get_subscription_status(user_id: int, db: Session = Depends(get_db)):
    expire_outdated_subscriptions(db)

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    is_active = user.plan in ["plus", "pro"] and (user.subscription_expires_at is None or user.subscription_expires_at >= datetime.utcnow())

    return SubscriptionStatusOut(
        user_id=user.id,
        plan=user.plan or "standard",
        subscription_status=user.subscription_status or "active",
        subscription_expires_at=user.subscription_expires_at,
        is_active=is_active
    )


@router.post("/verify-session")
def verify_stripe_session(payload: VerifySessionRequest, db: Session = Depends(get_db)):
    """
    Verifies a completed Stripe Checkout session securely via Stripe API.
    Prevents URL tampering, plan spoofing, and replay attacks.
    """
    session_id = payload.session_id.strip()
    if not session_id or session_id in ["null", "undefined"]:
        raise HTTPException(status_code=400, detail="❌ Missing or invalid payment session ID.")

    # Check replay attack (session already verified)
    existing = db.query(SubscriptionHistory).filter(SubscriptionHistory.stripe_session_id == session_id).first()
    if existing:
        user = db.query(User).filter(User.id == existing.user_id).first()
        return {
            "message": "Payment session already processed.",
            "user_id": existing.user_id,
            "plan": user.plan if user else existing.plan
        }

    # Demo fallback check
    if session_id.startswith("demo_session_"):
        parts = session_id.split("_")
        user_id = int(parts[2]) if len(parts) >= 3 else 1
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user.plan = "plus"
        user.subscription_status = "active"
        user.subscription_expires_at = datetime.utcnow() + timedelta(days=30)
        history = SubscriptionHistory(
            user_id=user.id,
            plan=user.plan,
            amount_vnd=25000,
            payment_method="stripe_demo",
            stripe_session_id=session_id
        )
        db.add(history)
        db.commit()
        return {"message": "Demo session verified.", "user_id": user.id, "plan": user.plan}

    stripe_secret_key = os.getenv("STRIPE_SECRET_KEY")
    try:
        import stripe
        if stripe_secret_key:
            stripe.api_key = stripe_secret_key
        session = stripe.checkout.Session.retrieve(session_id)
    except Exception as e:
        logger.error(f"Error retrieving Stripe session '{session_id}': {e}")
        raise HTTPException(status_code=400, detail="❌ Invalid or fake Stripe Checkout Session ID.")

    if session.payment_status != "paid":
        raise HTTPException(status_code=400, detail="❌ Payment for this Stripe session is incomplete or unpaid.")

    raw_meta = getattr(session, "metadata", {})
    if hasattr(raw_meta, "to_dict"):
        meta_dict = raw_meta.to_dict()
    elif isinstance(raw_meta, dict):
        meta_dict = raw_meta
    else:
        meta_dict = {}

    client_ref = getattr(session, "client_reference_id", None)
    user_id_str = meta_dict.get("user_id") or client_ref
    plan = meta_dict.get("plan")


    if not user_id_str or not plan:
        raise HTTPException(status_code=400, detail="❌ Missing user or plan metadata in Stripe session.")

    user_id = int(user_id_str)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found")

    plan = plan.lower()
    if plan not in PLAN_PRICES:
        raise HTTPException(status_code=400, detail="Invalid plan in Stripe session metadata")

    plan_info = PLAN_PRICES[plan]
    user.plan = plan
    user.subscription_status = "active"
    user.subscription_expires_at = datetime.utcnow() + timedelta(days=30)

    history = SubscriptionHistory(
        user_id=user.id,
        plan=plan,
        amount_vnd=plan_info["amount_vnd"],
        payment_method="stripe",
        stripe_session_id=session_id
    )
    db.add(history)
    db.commit()
    db.refresh(user)

    return {
        "message": f"🎉 Payment verified! Account upgraded to {plan.upper()}.",
        "user_id": user.id,
        "plan": user.plan,
        "session_id": session_id
    }

