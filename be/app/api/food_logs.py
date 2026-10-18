from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User
from app.schemas.schemas import FoodLogCreate, FoodLogOut
from app.core.security import get_current_user, verify_user_access
from app.services.food_service import FoodService

router = APIRouter(prefix="/api/v1/food-logs", tags=["Food Logs"])


@router.post("/{user_id}", response_model=FoodLogOut)
def create_food_log(
    user_id: int,
    log_in: FoodLogCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Creates a new meal entry for the user.
    Enforces IDOR prevention: only the owner or an admin can log meals.
    """
    verify_user_access(current_user, user_id)
    service = FoodService(db)
    return service.create_log(user_id, log_in)


@router.get("/{user_id}", response_model=List[FoodLogOut])
def get_user_food_logs(
    user_id: int,
    date_str: Optional[str] = Query(None, description="Format YYYY-MM-DD"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetches food logs for a specified user and optional date.
    Enforces IDOR prevention: only the owner or an admin can view logs.
    """
    verify_user_access(current_user, user_id)
    service = FoodService(db)
    return service.get_logs(user_id, date_str)


@router.get("/{user_id}/summary")
def get_nutrition_summary(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Computes daily consumed macros, calories, remaining allowances, and historical charts.
    """
    verify_user_access(current_user, user_id)
    service = FoodService(db)
    return service.get_nutrition_summary(user_id)


@router.delete("/{log_id}")
def delete_food_log(
    log_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Deletes a specific food log item.
    Enforces ownership validation: only the item owner or an admin can delete it.
    """
    service = FoodService(db)
    service.delete_log(log_id, current_user)
    return {"message": "Food log deleted successfully"}
