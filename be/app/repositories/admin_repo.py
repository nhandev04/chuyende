from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.db.models import FoodDatabase, AIReport, User, UserProfile, FoodLog
from app.repositories.base_repo import BaseRepository


class AdminRepository:
    def __init__(self, db: Session):
        self.db = db
        self.food_repo = BaseRepository[FoodDatabase](FoodDatabase, db)
        self.report_repo = BaseRepository[AIReport](AIReport, db)

    def get_stats(self) -> Dict[str, Any]:
        total_users = self.db.query(User).count()
        alert_users = self.db.query(UserProfile).filter(
            (UserProfile.bmi < 16.0) | (UserProfile.bmi > 30.0)
        ).all()
        pending_reports = self.db.query(AIReport).filter(AIReport.status == "pending").count()
        total_foods = self.db.query(FoodDatabase).count()

        return {
            "total_users": total_users,
            "alert_users_count": len(alert_users),
            "pending_ai_reports": pending_reports,
            "total_food_items": total_foods
        }

    def get_all_foods(self) -> List[FoodDatabase]:
        return self.db.query(FoodDatabase).order_by(FoodDatabase.id.desc()).all()

    def get_all_reports(self) -> List[Dict[str, Any]]:
        reports = self.db.query(AIReport).order_by(AIReport.created_at.desc()).all()
        result = []
        for r in reports:
            image_url = r.image_url
            if not image_url and r.food_log_id:
                flog = self.db.query(FoodLog).filter(FoodLog.id == r.food_log_id).first()
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
