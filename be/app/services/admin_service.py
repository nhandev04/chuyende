from typing import List, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.db.models import FoodDatabase, AIReport, User, UserProfile
from app.schemas.schemas import FoodDatabaseCreate, AIReportUpdate, AdminUserUpdate
from app.repositories.admin_repo import AdminRepository
from app.repositories.user_repo import UserRepository


class AdminService:
    def __init__(self, db: Session):
        self.db = db
        self.admin_repo = AdminRepository(db)
        self.user_repo = UserRepository(db)

    def get_stats(self) -> Dict[str, Any]:
        return self.admin_repo.get_stats()

    def get_food_database(self) -> List[FoodDatabase]:
        return self.admin_repo.get_all_foods()

    def add_food_item(self, payload: FoodDatabaseCreate) -> FoodDatabase:
        item = FoodDatabase(
            food_name=payload.food_name,
            category=payload.category,
            calories_per_100g=payload.calories_per_100g,
            protein_per_100g=payload.protein_per_100g,
            carbs_per_100g=payload.carbs_per_100g,
            fat_per_100g=payload.fat_per_100g,
            image_url=payload.image_url
        )
        return self.admin_repo.food_repo.create(item)

    def delete_food_item(self, food_id: int) -> Dict[str, str]:
        item = self.admin_repo.food_repo.get_by_id(food_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Food item #{food_id} not found in ground-truth library."
            )
        name = item.food_name
        self.admin_repo.food_repo.delete(item)
        return {"message": f"Successfully deleted food item #{food_id} ({name})"}

    def get_ai_reports(self) -> List[Dict[str, Any]]:
        return self.admin_repo.get_all_reports()

    def update_ai_report(self, report_id: int, payload: AIReportUpdate) -> AIReport:
        report = self.admin_repo.report_repo.get_by_id(report_id)
        if not report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"AI Report #{report_id} not found."
            )

        report.status = payload.status
        if payload.status == "resolved" and payload.add_to_ground_truth:
            existing = self.db.query(FoodDatabase).filter(
                FoodDatabase.food_name.ilike(f"%{report.user_correction}%")
            ).first()
            if not existing:
                new_item = FoodDatabase(
                    food_name=report.user_correction,
                    category="AI User Feedback",
                    calories_per_100g=150.0,
                    protein_per_100g=10.0,
                    carbs_per_100g=18.0,
                    fat_per_100g=5.0
                )
                self.admin_repo.food_repo.create(new_item)

        return self.admin_repo.report_repo.update(report)

    def get_all_users(self) -> List[Dict[str, Any]]:
        users = self.user_repo.get_all_users_with_profile()
        result = []
        for user in users:
            profile = self.user_repo.get_profile(user.id)
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

    def update_user_account(self, user_id: int, payload: AdminUserUpdate) -> Dict[str, Any]:
        user = self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User #{user_id} not found."
            )

        if payload.role:
            user.role = payload.role
        if payload.plan:
            user.plan = payload.plan

        self.user_repo.update(user)
        return {
            "message": f"Successfully updated User #{user.id}",
            "user_id": user.id,
            "role": user.role,
            "plan": user.plan
        }
