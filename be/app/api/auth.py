from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Optional
from jose import jwt, JWTError
from app.db.database import get_db
from app.db.models import User, UserProfile
from app.schemas.schemas import UserRegister, UserLogin, TokenResponse, ClerkSyncRequest
from app.core.security import hash_password, verify_password, create_access_token
from app.core.config import SECRET_KEY, ALGORITHM
from app.services.analysis_engine import compute_body_metrics

router = APIRouter(prefix="/api/v1/auth", tags=["Auth"])

@router.post("/clerk-sync", response_model=TokenResponse)
def clerk_sync(payload: ClerkSyncRequest, db: Session = Depends(get_db)):
    """
    Syncs Clerk OAuth authenticated user with local SQLAlchemy database.
    Creates user and default profile if first time signing in via Clerk.
    """
    user = db.query(User).filter(
        (User.clerk_user_id == payload.clerk_user_id) | (User.email == payload.email)
    ).first()

    if not user:
        user_role = "admin" if "admin" in payload.email.lower() else "user"
        user = User(
            email=payload.email,
            full_name=payload.full_name or payload.email.split("@")[0],
            clerk_user_id=payload.clerk_user_id,
            auth_provider="clerk",
            role=user_role,
            plan="standard"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # Initialize default body profile
        initial_body = compute_body_metrics(170.0, 65.0, 22, "male", "weight_loss")
        profile = UserProfile(
            user_id=user.id,
            height_cm=170.0,
            current_weight_kg=65.0,
            target_weight_kg=60.0,
            age=22,
            gender="male",
            activity_level="moderate",
            goal="weight_loss",
            daily_calorie_target=2000.0,
            bmi=initial_body["bmi"],
            tdee=initial_body["tdee"],
            body_shape=initial_body["body_shape"]
        )
        db.add(profile)
        db.commit()
    else:
        # Update existing user's clerk_user_id if not linked yet
        if not user.clerk_user_id:
            user.clerk_user_id = payload.clerk_user_id
            user.auth_provider = "clerk"
        if payload.full_name and not user.full_name:
            user.full_name = payload.full_name
        db.commit()

    token = create_access_token({"sub": str(user.id), "email": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "plan": user.plan or "standard",
        "auth_provider": user.auth_provider or "clerk"
    }

@router.post("/register", response_model=TokenResponse)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="This email is already registered on the system")

    hashed_pw = hash_password(user_in.password)
    user_role = "admin" if "admin" in user_in.email.lower() else "user"
    
    new_user = User(
        email=user_in.email,
        hashed_password=hashed_pw,
        full_name=user_in.full_name or user_in.email.split("@")[0],
        role=user_role,
        auth_provider="local",
        plan="standard"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Initialize default body profile
    initial_body = compute_body_metrics(170.0, 65.0, 22, "male", "weight_loss")
    profile = UserProfile(
        user_id=new_user.id,
        height_cm=170.0,
        current_weight_kg=65.0,
        target_weight_kg=60.0,
        age=22,
        gender="male",
        activity_level="moderate",
        goal="weight_loss",
        daily_calorie_target=2000.0,
        bmi=initial_body["bmi"],
        tdee=initial_body["tdee"],
        body_shape=initial_body["body_shape"]
    )
    db.add(profile)
    db.commit()

    token = create_access_token({"sub": str(new_user.id), "email": new_user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": new_user.id,
        "email": new_user.email,
        "full_name": new_user.full_name,
        "role": new_user.role,
        "plan": new_user.plan or "standard",
        "auth_provider": "local"
    }

@router.post("/login", response_model=TokenResponse)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user or not user.hashed_password or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": str(user.id), "email": user.email})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "plan": user.plan or "standard",
        "auth_provider": user.auth_provider or "local"
    }

@router.get("/me")
def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized / Not logged in")

    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
    except (JWTError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid or expired authentication token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")


    return {
        "user_id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "plan": user.plan or "standard",
        "auth_provider": user.auth_provider or "local",
        "clerk_user_id": user.clerk_user_id
    }
