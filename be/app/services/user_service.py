import os
import shutil
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status, UploadFile

from app.db.models import User, UserProfile, WeightLog
from app.schemas.schemas import UserProfileUpdate, WeightLogCreate
from app.repositories.user_repo import UserRepository
from app.repositories.weight_log_repo import WeightLogRepository
from app.services.analysis_engine import compute_body_metrics
from app.services.cloudinary_service import upload_image_to_cloudinary

TEMP_BODY_DIR = "temp_body_uploads"
os.makedirs(TEMP_BODY_DIR, exist_ok=True)


class UserService:
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)
        self.weight_repo = WeightLogRepository(db)

    def get_profile(self, user_id: int) -> UserProfile:
        profile = self.user_repo.get_profile(user_id)
        if not profile:
            # Create default profile if missing
            initial_metrics = compute_body_metrics(170.0, 65.0, 22, "male", "weight_loss")
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
                bmi=initial_metrics["bmi"],
                tdee=initial_metrics["tdee"],
                body_shape=initial_metrics["body_shape"]
            )
            profile = self.user_repo.create_profile(profile)
        return profile

    def update_profile(self, user_id: int, payload: UserProfileUpdate) -> UserProfile:
        profile = self.get_profile(user_id)
        update_data = payload.model_dump(exclude_unset=True)

        for key, value in update_data.items():
            setattr(profile, key, value)

        # Recalculate metrics when relevant fields change
        metrics = compute_body_metrics(
            height_cm=profile.height_cm,
            weight_kg=profile.current_weight_kg,
            age=profile.age,
            gender=profile.gender or "male",
            goal=profile.goal or "weight_loss"
        )
        profile.bmi = metrics["bmi"]
        profile.tdee = metrics["tdee"]
        profile.body_shape = metrics["body_shape"]

        if profile.goal == "weight_loss":
            profile.daily_calorie_target = round(profile.tdee - 400, 0)
        elif profile.goal == "muscle_gain":
            profile.daily_calorie_target = round(profile.tdee + 300, 0)
        else:
            profile.daily_calorie_target = profile.tdee

        return self.user_repo.update_profile(profile)

    def record_weight(self, user_id: int, weight_in: WeightLogCreate) -> WeightLog:
        log = WeightLog(
            user_id=user_id,
            weight_kg=weight_in.weight_kg,
            recorded_at=datetime.now(timezone.utc)
        )
        saved_log = self.weight_repo.create(log)

        # Update profile current weight and re-evaluate body metrics
        profile = self.user_repo.get_profile(user_id)
        if profile:
            profile.current_weight_kg = weight_in.weight_kg
            metrics = compute_body_metrics(
                height_cm=profile.height_cm,
                weight_kg=profile.current_weight_kg,
                age=profile.age,
                gender=profile.gender or "male",
                goal=profile.goal or "weight_loss"
            )
            profile.bmi = metrics["bmi"]
            profile.tdee = metrics["tdee"]
            profile.body_shape = metrics["body_shape"]

            if profile.goal == "weight_loss":
                profile.daily_calorie_target = round(profile.tdee - 400, 0)
            elif profile.goal == "muscle_gain":
                profile.daily_calorie_target = round(profile.tdee + 300, 0)
            else:
                profile.daily_calorie_target = profile.tdee

            self.user_repo.update_profile(profile)

        return saved_log

    def get_weight_history(self, user_id: int) -> List[WeightLog]:
        logs = self.weight_repo.get_by_user(user_id)
        if not logs:
            profile = self.user_repo.get_profile(user_id)
            base_w = profile.current_weight_kg if profile else 65.0
            return [WeightLog(id=1, user_id=user_id, weight_kg=base_w, recorded_at=datetime.utcnow())]
        return logs

    def upload_avatar(self, user_id: int, avatar_file: UploadFile) -> str:
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

        temp_path = os.path.join(TEMP_BODY_DIR, f"avatar_{user_id}_{avatar_file.filename}")
        try:
            with open(temp_path, "wb") as buffer:
                shutil.copyfileobj(avatar_file.file, buffer)

            cloudinary_url = upload_image_to_cloudinary(temp_path, folder="health_lens_ai/avatars")
            if not cloudinary_url:
                cloudinary_url = f"/temp_body_uploads/avatar_{user_id}_{avatar_file.filename}"

            user.avatar_url = cloudinary_url
            profile = self.user_repo.get_profile(user_id)
            if profile:
                profile.avatar_url = cloudinary_url

            self.db.commit()
            self.db.refresh(user)
            return user.avatar_url
        finally:
            if temp_path and os.path.exists(temp_path) and "temp_body_uploads" not in (user.avatar_url or ""):
                try:
                    os.remove(temp_path)
                except Exception:
                    pass
