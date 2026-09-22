from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.db.models import FoodDatabase, AIReport, User, UserProfile
from app.schemas.schemas import FoodDatabaseCreate, AIReportUpdate, AdminUserUpdate

router = APIRouter(prefix="/api/v1/admin", tags=["Admin System Hub"])

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

# --- Ground-Truth Food Library CRUD ---
@router.get("/foods")
def get_food_database(db: Session = Depends(get_db)):
    return db.query(FoodDatabase).order_by(FoodDatabase.id.desc()).all()

@router.post("/foods")
def add_food_to_db(payload: FoodDatabaseCreate, db: Session = Depends(get_db)):
    item = FoodDatabase(
        food_name=payload.food_name,
        category=payload.category,
        calories_per_100g=payload.calories_per_100g,
        protein_per_100g=payload.protein_per_100g,
        carbs_per_100g=payload.carbs_per_100g,
        fat_per_100g=payload.fat_per_100g,
        image_url=payload.image_url
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.delete("/foods/{food_id}")
def delete_food_from_db(food_id: int, db: Session = Depends(get_db)):
    item = db.query(FoodDatabase).filter(FoodDatabase.id == food_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Food item not found in standard food library")
    db.delete(item)
    db.commit()
    return {"message": f"Successfully deleted food item #{food_id} ({item.food_name})"}

from app.db.models import FoodDatabase, AIReport, User, UserProfile, FoodLog

# --- AI Feedback Reports Management ---
@router.get("/reports")
def get_ai_reports(db: Session = Depends(get_db)):
    reports = db.query(AIReport).order_by(AIReport.created_at.desc()).all()
    result = []
    for r in reports:
        image_url = r.image_url
        if not image_url and r.food_log_id:
            flog = db.query(FoodLog).filter(FoodLog.id == r.food_log_id).first()
            if flog:
                image_url = flog.image_url
        result.append({
            "id": r.id,
            "user_id": r.user_id,
            "food_log_id": r.food_log_id,
            "original_prediction": r.original_prediction,
            "user_correction": r.user_correction,
            "status": r.status,
            "created_at": r.created_at,
            "image_url": image_url
        })
    return result


@router.put("/reports/{report_id}")
def update_ai_report(report_id: int, payload: AIReportUpdate, db: Session = Depends(get_db)):
    report = db.query(AIReport).filter(AIReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="AI Report not found")

    report.status = payload.status
    
    # If resolving and adding to Ground-Truth DB
    if payload.status == "resolved" and payload.add_to_ground_truth:
        existing = db.query(FoodDatabase).filter(FoodDatabase.food_name.ilike(f"%{report.user_correction}%")).first()
        if not existing:
            new_item = FoodDatabase(
                food_name=report.user_correction,
                category="AI User Feedback",
                calories_per_100g=150.0,
                protein_per_100g=10.0,
                carbs_per_100g=18.0,
                fat_per_100g=5.0
            )
            db.add(new_item)
    
    db.commit()
    db.refresh(report)
    return report

# --- User Accounts Management ---
@router.get("/users")
def get_all_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    result = []
    for user in users:
        profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
        result.append({
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "plan": user.plan or "standard",
            "auth_provider": user.auth_provider or "local",
            "created_at": user.created_at,
            "height_cm": profile.height_cm if profile else None,
            "current_weight_kg": profile.current_weight_kg if profile else None,
            "bmi": profile.bmi if profile else None,
            "body_shape": profile.body_shape if profile else None
        })
    return result

@router.put("/users/{user_id}")
def update_user_account(user_id: int, payload: AdminUserUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.role:
        user.role = payload.role
    if payload.plan:
        user.plan = payload.plan
    
    db.commit()
    db.refresh(user)
    return {
        "message": f"Successfully updated User #{user.id}",
        "user_id": user.id,
        "role": user.role,
        "plan": user.plan
    }

