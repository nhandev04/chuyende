import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
from app.db.database import get_db
from app.db.models import User, UserProfile
from app.schemas.schemas import UserProfileUpdate, UserProfileOut, BodyAnalysisResult
from app.services.real_ai import analyze_body_photo_cv
from app.services.mock_ai import mock_analyze_body

router = APIRouter(prefix="/api/v1/profile", tags=["Profile"])

TEMP_BODY_DIR = "temp_body_uploads"
os.makedirs(TEMP_BODY_DIR, exist_ok=True)

@router.get("/{user_id}", response_model=UserProfileOut)
def get_profile(user_id: int, db: Session = Depends(get_db)):
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if not profile:
        initial_body = mock_analyze_body(170.0, 65.0, 22, "male", "weight_loss")
        profile = UserProfile(
            user_id=user_id,
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
        db.refresh(profile)
    return profile

@router.put("/{user_id}", response_model=UserProfileOut)
def update_profile(user_id: int, profile_in: UserProfileUpdate, db: Session = Depends(get_db)):
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if not profile:
        profile = UserProfile(user_id=user_id)
        db.add(profile)

    update_data = profile_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            setattr(profile, field, value)

    # Recalculate BMI, TDEE, Body Shape based on updated physical parameters
    analysis = mock_analyze_body(
        height_cm=profile.height_cm,
        weight_kg=profile.current_weight_kg,
        age=profile.age,
        gender=profile.gender or "male",
        goal=profile.goal or "weight_loss"
    )
    profile.bmi = analysis["bmi"]
    profile.tdee = analysis["tdee"]
    profile.body_shape = analysis["body_shape"]

    if not profile_in.daily_calorie_target:
        if profile.goal == "weight_loss":
            profile.daily_calorie_target = round(profile.tdee - 400, 0)
        elif profile.goal == "muscle_gain":
            profile.daily_calorie_target = round(profile.tdee + 300, 0)
        else:
            profile.daily_calorie_target = profile.tdee

    db.commit()
    db.refresh(profile)
    return profile

@router.post("/body-analysis", response_model=BodyAnalysisResult)
def analyze_body_pose(
    height_cm: float = Form(...),
    weight_kg: float = Form(...),
    age: int = Form(22),
    gender: str = Form("male"),
    goal: str = Form("weight_loss"),
    body_image: Optional[UploadFile] = File(None)
):
    """
    Real Computer Vision AI Pose / Body Shape Analysis:
    Extracts body silhouette contours, shoulder-to-waist ratio, BMI, TDEE, and Deurenberg body fat %.
    """
    temp_path = None
    if body_image and body_image.filename:
        temp_path = os.path.join(TEMP_BODY_DIR, f"body_{body_image.filename}")
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(body_image.file, buffer)

    try:
        result = analyze_body_photo_cv(temp_path, height_cm, weight_kg, age, gender, goal)
        return BodyAnalysisResult(
            body_shape=result["body_shape"],
            estimated_body_fat_pct=result["estimated_body_fat_pct"],
            bmi=result["bmi"],
            tdee=result["tdee"],
            recommendation=result["recommendation"]
        )
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass
