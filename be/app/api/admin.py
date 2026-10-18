from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.schemas import FoodDatabaseCreate, AIReportUpdate, AdminUserUpdate
from app.core.security import require_admin
from app.services.admin_service import AdminService

# Entire Admin Hub is protected by require_admin RBAC dependency
router = APIRouter(
    prefix="/api/v1/admin",
    tags=["Admin System Hub"],
    dependencies=[Depends(require_admin)]
)


# --- System Analytics & Health ---
@router.get("/stats")
def get_admin_stats(db: Session = Depends(get_db)):
    service = AdminService(db)
    return service.get_stats()


# --- Ground-Truth Food Library CRUD ---
@router.get("/foods")
def get_food_database(db: Session = Depends(get_db)):
    service = AdminService(db)
    return service.get_food_database()


@router.post("/foods")
def add_food_to_db(payload: FoodDatabaseCreate, db: Session = Depends(get_db)):
    service = AdminService(db)
    return service.add_food_item(payload)


@router.delete("/foods/{food_id}")
def delete_food_from_db(food_id: int, db: Session = Depends(get_db)):
    service = AdminService(db)
    return service.delete_food_item(food_id)


# --- AI Feedback Reports Management ---
@router.get("/reports")
def get_ai_reports(db: Session = Depends(get_db)):
    service = AdminService(db)
    return service.get_ai_reports()


@router.put("/reports/{report_id}")
def update_ai_report(report_id: int, payload: AIReportUpdate, db: Session = Depends(get_db)):
    service = AdminService(db)
    return service.update_ai_report(report_id, payload)


# --- User Accounts Management ---
@router.get("/users")
def get_all_users(db: Session = Depends(get_db)):
    service = AdminService(db)
    return service.get_all_users()


@router.put("/users/{user_id}")
def update_user_account(user_id: int, payload: AdminUserUpdate, db: Session = Depends(get_db)):
    service = AdminService(db)
    return service.update_user_account(user_id, payload)
