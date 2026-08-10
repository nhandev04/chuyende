from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.db.database import get_db
from app.db.models import WeightLog, UserProfile
from app.schemas.schemas import WeightLogCreate, WeightLogOut

router = APIRouter(prefix="/api/v1/weight-logs", tags=["Weight Logs"])

@router.post("/{user_id}", response_model=WeightLogOut)
def record_weight(user_id: int, weight_in: WeightLogCreate, db: Session = Depends(get_db)):
    log = WeightLog(
        user_id=user_id,
        weight_kg=weight_in.weight_kg,
        recorded_at=datetime.utcnow()
    )
    db.add(log)

    # Update profile current weight
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    if profile:
        profile.current_weight_kg = weight_in.weight_kg

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
