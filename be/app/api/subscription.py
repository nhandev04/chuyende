import os
import logging
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header, Request
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import User, SubscriptionHistory
from app.schemas.schemas import CheckoutSessionRequest, SubscriptionUpgradeRequest, SubscriptionStatusOut

logger = logging.getLogger(__name__)

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
                "name": "Standard (Gói Cơ Bản)",
                "price_vnd": 0,
                "price_display": "0 VNĐ / tháng",
                "features": [
                    "Nhập nhật ký bữa ăn thủ công",
                    "Theo dõi chỉ số cân nặng & BMI cơ bản",
                    "Quản lý hồ sơ cá nhân"
                ],
                "badge": "Miễn phí",
                "is_current_default": True
            },
            {
                "id": "plus",
                "name": "Plus (Gói Phân Tích Thực Phẩm)",
                "price_vnd": 25000,
                "price_display": "25.000 VNĐ / tháng",
                "features": [
                    "Tất cả tính năng bản Standard",
                    "AI Quét ảnh món ăn tự động (YOLOv8)",
                    "Phân tích hàm lượng Calo, Protein, Carbs, Fat từ ảnh",
                    "Cơ sở dữ liệu thực phẩm chuẩn Ground-Truth"
                ],
                "badge": "Phổ biến nhất",
                "is_current_default": False
            },
            {
                "id": "pro",
                "name": "Pro (Gói Chuyên Gia AI)",
                "price_vnd": 50000,
                "price_display": "50.000 VNĐ / tháng",
                "features": [
                    "Tất cả tính năng bản Plus",
                    "AI Phân tích vóc dáng toàn thân (YOLO Pose 17 Keypoints)",
                    "Thang đo BMI 10 Cấp độ & Khuyên năng lượng sinh học",
                    "Gợi ý bữa ăn cá nhân hóa AI hàng ngày (Daily Meal Plan)",
                    "Ưu tiên hỗ trợ & Xuất báo cáo dinh dưỡng chi tiết"
                ],
                "badge": "Cao cấp nhất",
                "is_current_default": False
            }
        ]
    }

@router.post("/create-checkout-session")
def create_checkout_session(payload: CheckoutSessionRequest, db: Session = Depends(get_db)):
    """
    Creates a real Stripe Checkout Session for subscription payment.
    Requires STRIPE_SECRET_KEY in environment variables.
    """
    import stripe

    plan = payload.plan.lower()
    if plan not in PLAN_PRICES:
        raise HTTPException(status_code=400, detail="Gói dịch vụ không hợp lệ (Chỉ chọn 'plus' hoặc 'pro')")

    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")

    stripe_secret_key = os.getenv("STRIPE_SECRET_KEY")
    if not stripe_secret_key:
        raise HTTPException(
            status_code=500,
            detail="⚠️ Chưa cấu hình STRIPE_SECRET_KEY trong file be/.env. Vui lòng thêm STRIPE_SECRET_KEY=sk_test_... để tạo link Stripe Checkout thật."
        )

    stripe.api_key = stripe_secret_key
    plan_info = PLAN_PRICES[plan]

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': f"{plan_info['name']} - HealthLens AI",
                        'description': f"Nâng cấp gói {plan.upper()} sử dụng dịch vụ AI",
                    },
                    'unit_amount': int(plan_info['stripe_price_usd'] * 100),
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=f"http://localhost:3000/dashboard?payment=success&plan={plan}",
            cancel_url="http://localhost:3000/dashboard?payment=cancel",
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
        logger.error(f"Stripe Checkout error: {e}")
        raise HTTPException(status_code=500, detail=f"Lỗi khởi tạo Stripe Checkout: {str(e)}")

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
        raise HTTPException(status_code=400, detail="Gói không hợp lệ. Vui lòng chọn 'plus' hoặc 'pro'.")

    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản người dùng.")

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
        "message": f"🎉 Chúc mừng bạn đã nâng cấp thành công lên gói {plan.upper()}!",
        "plan": user.plan,
        "subscription_status": user.subscription_status,
        "expires_at": user.subscription_expires_at,
        "transaction_id": history.id
    }

@router.get("/status/{user_id}", response_model=SubscriptionStatusOut)
def get_subscription_status(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")

    is_active = True
    if user.subscription_expires_at and user.subscription_expires_at < datetime.utcnow():
        is_active = False

    return SubscriptionStatusOut(
        user_id=user.id,
        plan=user.plan or "standard",
        subscription_status=user.subscription_status or "active",
        subscription_expires_at=user.subscription_expires_at,
        is_active=is_active
    )
