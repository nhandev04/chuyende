from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.db.models import FoodDatabase, AIReport, User, UserProfile

router = APIRouter(prefix="/api/v1/admin", tags=["Admin"])

@router.get("/stats")
def get_admin_stats(db: Session = Depends(get_db)):
    total_users = db.query(User).count()
    alert_users = db.query(UserProfile).filter(
        (UserProfile.bmi < 16.0) | (UserProfile.bmi > 30.0)
    ).all()
    pending_reports = db.query(AIReport).filter(AIReport.status == "pending").count()
    total_foods = db.query(FoodDatabase).count()

    return {
        "total_users": total_users,
        "alert_users_count": len(alert_users),
        "pending_ai_reports": pending_reports,
        "total_food_items": total_foods
    }

@router.get("/foods")
def get_food_database(db: Session = Depends(get_db)):
    return db.query(FoodDatabase).all()

@router.post("/foods")
def add_food_to_db(
    food_name: str,
    category: str,
    calories_per_100g: float,
    protein_per_100g: float,
    carbs_per_100g: float,
    fat_per_100g: float,
    image_url: Optional[str] = None,
    db: Session = Depends(get_db)
):
    item = FoodDatabase(
        food_name=food_name,
        category=category,
        calories_per_100g=calories_per_100g,
        protein_per_100g=protein_per_100g,
        carbs_per_100g=carbs_per_100g,
        fat_per_100g=fat_per_100g,
        image_url=image_url
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.get("/reports")
def get_ai_reports(db: Session = Depends(get_db)):
    return db.query(AIReport).order_by(AIReport.created_at.desc()).all()
