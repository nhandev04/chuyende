from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User
from app.schemas.schemas import WeightLogCreate, WeightLogOut
from app.core.security import get_current_user, verify_user_access
from app.services.user_service import UserService

router = APIRouter(prefix="/api/v1/weight-logs", tags=["Weight Logs"])


@router.post("/{user_id}", response_model=WeightLogOut)
def record_weight(
    user_id: int,
    weight_in: WeightLogCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Records a new weight measurement and recalculates TDEE / BMI / daily targets.
    Guarded against IDOR.
    """
    verify_user_access(current_user, user_id)
    service = UserService(db)
    return service.record_weight(user_id, weight_in)


@router.get("/{user_id}", response_model=List[WeightLogOut])
def get_weight_history(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves chronological weight progression history for a user.
    Guarded against IDOR.
    """
    verify_user_access(current_user, user_id)
    service = UserService(db)
    return service.get_weight_history(user_id)
