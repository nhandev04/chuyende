import os
import shutil
import logging
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
from app.db.database import get_db
from app.db.models import User, UserProfile
from app.schemas.schemas import UserProfileUpdate, UserProfileOut, BodyAnalysisResult
from app.services.vit_face_analyzer import predict_height_weight_with_vit
from app.services.analysis_engine import compute_body_metrics

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/profile", tags=["Profile"])

TEMP_BODY_DIR = "temp_body_uploads"
os.makedirs(TEMP_BODY_DIR, exist_ok=True)

@router.get("/{user_id}", response_model=UserProfileOut)
def get_profile(user_id: int, db: Session = Depends(get_db)):
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
    facial_image: Optional[UploadFile] = File(None)
):
    """
    ViT (Vision Transformer) Facial Analysis for Height & Weight Prediction:
    Analyzes facial features using fine-tuned ViT model to predict height and weight.
    Then computes body metrics (BMI, TDEE, Body Fat %) based on predictions.
    
    Returns:
        BodyAnalysisResult with predicted height, weight, BMI, TDEE, body fat %, and recommendation
    """
    temp_path = None
    pred_height = None
    pred_weight = None
    confidence = 0.0
    model_info = "No facial image provided"

    logger.info(f"Body analysis request: age={age}, gender={gender}, goal={goal}, has_facial_image={bool(facial_image and facial_image.filename)}")

    # If facial image is provided, use ViT to predict height/weight
    if facial_image and facial_image.filename:
        temp_path = os.path.join(TEMP_BODY_DIR, f"face_{facial_image.filename}")
        try:
            # Save uploaded file
            with open(temp_path, "wb") as buffer:
                shutil.copyfileobj(facial_image.file, buffer)

            logger.info(f"Saved uploaded facial image to {temp_path}")

            # Use ViT model to predict height and weight from facial features
            vit_result = predict_height_weight_with_vit(temp_path)
            logger.info(f"ViT result: {vit_result}")

            pred_height = vit_result.get("predicted_height_cm")
            pred_weight = vit_result.get("predicted_weight_kg")
            confidence = vit_result.get("confidence_score", 0.0)
            model_info = vit_result.get("model_info", "ViT Model")

            logger.info(f"Parsed ViT values: pred_height={pred_height}, pred_weight={pred_weight}, confidence={confidence}, model_info={model_info}")

            # Reject default/fallback results when the face cannot be analyzed confidently
            if pred_height is None or pred_weight is None or confidence <= 0.0:
                logger.warning("ViT face analysis returned invalid or empty prediction; raising error instead of defaulting to 170/70")
                raise HTTPException(
                    status_code=400,
                    detail="❌ Không nhận diện được khuôn mặt. Vui lòng gửi ảnh rõ ràng hơn, phơi sáng tốt hơn hoặc chụp trực diện."
                )

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error during ViT facial analysis: {e}")
            raise HTTPException(
                status_code=400,
                detail="❌ Không thể phân tích khuôn mặt từ ảnh này. Hãy thử ảnh rõ hơn hoặc chụp trực diện."
            )

    if pred_height is None or pred_weight is None or confidence <= 0.0:
        logger.warning("No valid ViT prediction available; refusing to compute body metrics from defaults")
        raise HTTPException(
            status_code=400,
            detail="❌ Không nhận diện được khuôn mặt. Vui lòng gửi ảnh rõ ràng hơn, phơi sáng tốt hơn hoặc chụp trực diện."
        )

    try:
        # Compute body metrics using predicted height and weight only when valid ViT output exists
        logger.info(f"Computing body metrics with pred_height={pred_height}, pred_weight={pred_weight}, age={age}, gender={gender}, goal={goal}")
        result = compute_body_metrics(pred_height, pred_weight, age, gender, goal)

        vit_note = f"\n[ViT Model: {model_info}, Confidence: {confidence}]" if confidence > 0 else ""

        return BodyAnalysisResult(
            body_shape=result["body_shape"],
            estimated_body_fat_pct=result["estimated_body_fat_pct"],
            bmi=result["bmi"],
            tdee=result["tdee"],
            recommendation=result["recommendation"] + vit_note,
            height_cm=pred_height,
            weight_kg=pred_weight
        )
    finally:
        # Clean up temporary file
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass
