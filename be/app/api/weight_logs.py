from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.db.database import get_db
from app.db.models import WeightLog, UserProfile
from app.schemas.schemas import WeightLogCreate, WeightLogOut

from app.services.analysis_engine import compute_body_metrics

router = APIRouter(prefix="/api/v1/weight-logs", tags=["Weight Logs"])

@router.post("/{user_id}", response_model=WeightLogOut)
def record_weight(user_id: int, weight_in: WeightLogCreate, db: Session = Depends(get_db)):
    log = WeightLog(
        user_id=user_id,
        weight_kg=weight_in.weight_kg,
        recorded_at=datetime.utcnow()
    )
    db.add(log)

    # Update profile current weight and recalculate metrics
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if profile:
        profile.current_weight_kg = weight_in.weight_kg
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
        if profile.goal == "weight_loss":
            profile.daily_calorie_target = round(profile.tdee - 400, 0)
        elif profile.goal == "muscle_gain":
            profile.daily_calorie_target = round(profile.tdee + 300, 0)
        else:
            profile.daily_calorie_target = profile.tdee

    db.commit()
    db.refresh(log)
    return log


@router.get("/{user_id}", response_model=List[WeightLogOut])
def get_weight_history(user_id: int, db: Session = Depends(get_db)):
    logs = db.query(WeightLog).filter(WeightLog.user_id == user_id).order_by(WeightLog.recorded_at.desc()).all()
    if not logs:
        # Return mock initial baseline if empty
        profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
        base_w = profile.current_weight_kg if profile else 65.0
        return [
            WeightLog(id=1, user_id=user_id, weight_kg=base_w, recorded_at=datetime.utcnow())
        ]
    return logs
