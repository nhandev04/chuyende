import os
import shutil
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User
from app.schemas.schemas import UserProfileUpdate, UserProfileOut, BodyAnalysisResult
from app.core.security import get_current_user, get_optional_current_user, verify_user_access
from app.services.user_service import UserService, TEMP_BODY_DIR
from app.services.body_pose_analyzer import predict_height_weight_from_body
from app.services.analysis_engine import compute_body_metrics
from app.services.cloudinary_service import upload_image_to_cloudinary
from app.api.subscription import expire_outdated_subscriptions

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/profile", tags=["Profile"])


@router.post("/upload-avatar/{user_id}")
def upload_avatar(
    user_id: int,
    avatar_file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Uploads user avatar, pushes to Cloudinary, and saves URL.
    Guarded against IDOR.
    """
    verify_user_access(current_user, user_id)
    service = UserService(db)
    avatar_url = service.upload_avatar(user_id, avatar_file)
    return {
        "message": "Avatar uploaded and updated successfully!",
        "avatar_url": avatar_url,
        "user_id": user_id
    }


@router.get("/{user_id}", response_model=UserProfileOut)
def get_profile(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves user profile and body metrics.
    Guarded against IDOR.
    """
    verify_user_access(current_user, user_id)
    expire_outdated_subscriptions(db)
    service = UserService(db)
    return service.get_profile(user_id)


@router.put("/{user_id}", response_model=UserProfileOut)
def update_profile(
    user_id: int,
    profile_in: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Updates user personal metrics and recalculates daily targets.
    Guarded against IDOR.
    """
    verify_user_access(current_user, user_id)
    service = UserService(db)
    return service.update_profile(user_id, profile_in)


@router.post("/body-analysis", response_model=BodyAnalysisResult)
def analyze_body_pose(
    age: int = Form(22),
    gender: str = Form("male"),
    goal: str = Form("weight_loss"),
    user_id: Optional[int] = Form(None),
    body_image: Optional[UploadFile] = File(None),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Full-body analysis based on YOLOv8 pose estimation.
    Applies dynamic BMI computation and 10-Level BMI scale classification.
    Requires user to have 'pro' plan or 'admin' role.
    """
    eval_user = current_user
    if not eval_user and user_id:
        eval_user = db.query(User).filter(User.id == user_id).first()

    if eval_user and eval_user.role != "admin" and eval_user.plan != "pro":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Smart Full-Body Photo Analysis is exclusive to Pro tier users. Please upgrade to unlock."
        )

    temp_path = None
    pred_height = None
    pred_weight = None
    confidence = 0.0

    if body_image and body_image.filename:
        temp_path = os.path.join(TEMP_BODY_DIR, f"body_{body_image.filename}")
        try:
            with open(temp_path, "wb") as buffer:
                shutil.copyfileobj(body_image.file, buffer)

            pose_result = predict_height_weight_from_body(temp_path)
            pred_height = pose_result.get("predicted_height_cm")
            pred_weight = pose_result.get("predicted_weight_kg")
            confidence = pose_result.get("confidence_score", 0.0)

            if pred_height is None or pred_weight is None or confidence <= 0.0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Unable to detect full-body posture from this photo. Please upload a well-lit, uncropped head-to-toe photo."
                )

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error during body pose analysis: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unable to process body analysis. Please try a clearer head-to-toe photo with adequate lighting."
            )

    if pred_height is None or pred_weight is None or confidence <= 0.0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to detect full-body posture from this photo. Please upload a well-lit, uncropped head-to-toe photo."
        )

    try:
        result = compute_body_metrics(pred_height, pred_weight, age, gender, goal)
        pose_note = f"\n[AI Confidence: {int(confidence * 100)}%]" if confidence > 0 else ""
        cloudinary_url = None
        if temp_path:
            cloudinary_url = upload_image_to_cloudinary(temp_path, folder="health_lens_ai/body_scans")

        return BodyAnalysisResult(
            body_shape=result["body_shape"],
            estimated_body_fat_pct=result["estimated_body_fat_pct"],
            bmi=result["bmi"],
            tdee=result["tdee"],
            recommendation=result["recommendation"] + pose_note,
            height_cm=pred_height,
            weight_kg=pred_weight,
            bmi_level=result["bmi_level"],
            bmi_level_label=result["bmi_level_label"],
            image_url=cloudinary_url
        )
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass
