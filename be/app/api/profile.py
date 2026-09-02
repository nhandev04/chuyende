import os
import shutil
import logging
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
from app.db.database import get_db
from app.db.models import User, UserProfile
from app.schemas.schemas import UserProfileUpdate, UserProfileOut, BodyAnalysisResult
from app.services.body_pose_analyzer import predict_height_weight_from_body
from app.services.analysis_engine import compute_body_metrics

from app.api.subscription import expire_outdated_subscriptions

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/profile", tags=["Profile"])

TEMP_BODY_DIR = "temp_body_uploads"
os.makedirs(TEMP_BODY_DIR, exist_ok=True)

@router.get("/{user_id}", response_model=UserProfileOut)
def get_profile(user_id: int, db: Session = Depends(get_db)):
    expire_outdated_subscriptions(db)

    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()

    if not profile:
        initial_body = compute_body_metrics(170.0, 65.0, 22, "male", "weight_loss")
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

    analysis = compute_body_metrics(
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
    age: int = Form(22),
    gender: str = Form("male"),
    goal: str = Form("weight_loss"),
    user_id: Optional[int] = Form(None),
    body_image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """
    Full-body body analysis based on YOLOv8 pose estimation.
    Applies dynamic BMI computation and 10-Level BMI scale classification.
    Requires user to have 'pro' plan or 'admin' role.
    """
    if user_id:
        user = db.query(User).filter(User.id == user_id).first()
        if user and user.role != "admin" and user.plan != "pro":
            raise HTTPException(
                status_code=403,
                detail="🔒 Full-body AI body analysis (YOLO Pose) is exclusive to Pro tier users. Please upgrade to Pro tier to unlock."
            )

    temp_path = None
    pred_height = None
    pred_weight = None
    confidence = 0.0
    model_info = "No body image provided"


    logger.info(f"Body analysis request: age={age}, gender={gender}, goal={goal}, has_body_image={bool(body_image and body_image.filename)}")

    if body_image and body_image.filename:
        temp_path = os.path.join(TEMP_BODY_DIR, f"body_{body_image.filename}")
        try:
            with open(temp_path, "wb") as buffer:
                shutil.copyfileobj(body_image.file, buffer)

            logger.info(f"Saved uploaded body image to {temp_path}")

            pose_result = predict_height_weight_from_body(temp_path)
            logger.info(f"Pose analysis result: {pose_result}")

            pred_height = pose_result.get("predicted_height_cm")
            pred_weight = pose_result.get("predicted_weight_kg")
            confidence = pose_result.get("confidence_score", 0.0)
            model_info = pose_result.get("model_info", "YOLO Pose")

            if pred_height is None or pred_weight is None or confidence <= 0.0:
                raise HTTPException(
                    status_code=400,
                    detail="❌ Unable to detect body keypoints from this photo. Please upload a well-lit, uncropped full-body photo."
                )

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error during body pose analysis: {e}")
            raise HTTPException(
                status_code=400,
                detail="❌ Unable to process body pose analysis. Please try a clearer head-to-toe photo with adequate lighting."
            )

    if pred_height is None or pred_weight is None or confidence <= 0.0:
        raise HTTPException(
            status_code=400,
            detail="❌ Unable to detect body keypoints from this photo. Please upload a well-lit, uncropped full-body photo."
        )


    try:
        result = compute_body_metrics(pred_height, pred_weight, age, gender, goal)
        pose_note = f"\n[YOLO Pose Model: {model_info}, Confidence: {confidence}]" if confidence > 0 else ""

        return BodyAnalysisResult(
            body_shape=result["body_shape"],
            estimated_body_fat_pct=result["estimated_body_fat_pct"],
            bmi=result["bmi"],
            tdee=result["tdee"],
            recommendation=result["recommendation"] + pose_note,
            height_cm=pred_height,
            weight_kg=pred_weight,
            bmi_level=result["bmi_level"],
            bmi_level_label=result["bmi_level_label"]
        )
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass
