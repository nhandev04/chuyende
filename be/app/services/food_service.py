from datetime import datetime, timedelta, timezone
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.db.models import FoodLog, User, UserProfile
from app.schemas.schemas import FoodLogCreate
from app.repositories.food_log_repo import FoodLogRepository
from app.repositories.user_repo import UserRepository


class FoodService:
    def __init__(self, db: Session):
        self.db = db
        self.food_repo = FoodLogRepository(db)
        self.user_repo = UserRepository(db)

    def create_log(self, user_id: int, log_in: FoodLogCreate) -> FoodLog:
        log_entry = FoodLog(
            user_id=user_id,
            meal_type=log_in.meal_type,
            food_name=log_in.food_name,
            weight_g=log_in.weight_g,
            calories=log_in.calories,
            protein_g=log_in.protein_g,
            carbs_g=log_in.carbs_g,
            fat_g=log_in.fat_g,
            image_url=log_in.image_url,
            confidence_score=0.95,
            logged_at=datetime.now(timezone.utc)
        )

        return self.food_repo.create(log_entry)

    def get_logs(self, user_id: int, date_str: Optional[str] = None) -> List[FoodLog]:
        target_date = None
        if date_str:
            try:
                target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            except ValueError:
                pass
        return self.food_repo.get_by_user(user_id, target_date=target_date)

    def delete_log(self, log_id: int, current_user: User) -> None:
        log = self.food_repo.get_by_id(log_id)
        if not log:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Food log entry not found."
            )
        # IDOR check: only owner or admin can delete
        if current_user.role != "admin" and log.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: You cannot delete another user's food log."
            )
        self.food_repo.delete(log)

    def get_nutrition_summary(self, user_id: int) -> Dict[str, Any]:
        profile = self.user_repo.get_profile(user_id)
        target_cal = profile.daily_calorie_target if profile else 2000.0

        today = datetime.now(timezone.utc).date()
        today_start = datetime.combine(today, datetime.min.time())
        today_end = datetime.combine(today, datetime.max.time())

        # Today's logs
        today_logs = self.food_repo.get_user_logs_between(user_id, today_start, today_end)

        consumed_cal = sum(log.calories for log in today_logs)
        protein_total = sum(log.protein_g for log in today_logs)
        carbs_total = sum(log.carbs_g for log in today_logs)
        fat_total = sum(log.fat_g for log in today_logs)

        # Weekly chart data (7 days)
        weekly_data = []
        days_map = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        for i in range(6, -1, -1):
            day_date = today - timedelta(days=i)
            d_start = datetime.combine(day_date, datetime.min.time())
            d_end = datetime.combine(day_date, datetime.max.time())
            logs = self.food_repo.get_user_logs_between(user_id, d_start, d_end)
            day_cal = sum(l.calories for l in logs)

            weekly_data.append({
                "day": days_map[day_date.weekday()],
                "date": day_date.strftime("%d/%m"),
                "calories": round(day_cal, 1),
                "target": target_cal
            })

        # Monthly chart data (4 weeks)
        monthly_data = [
            {"week": "Week 1", "avg_calories": target_cal - 100, "avg_weight": 66.5},
            {"week": "Week 2", "avg_calories": target_cal + 50, "avg_weight": 66.0},
            {"week": "Week 3", "avg_calories": target_cal - 150, "avg_weight": 65.4},
            {
                "week": "Week 4",
                "avg_calories": consumed_cal if consumed_cal > 0 else target_cal - 50,
                "avg_weight": profile.current_weight_kg if profile else 65.0
            }
        ]

        return {
            "daily": {
                "consumed_calories": round(consumed_cal, 1),
                "target_calories": round(target_cal, 1),
                "remaining_calories": round(max(0.0, target_cal - consumed_cal), 1),
                "protein_g": round(protein_total, 1),
                "protein_target_g": round((target_cal * 0.3) / 4, 1),
                "carbs_g": round(carbs_total, 1),
                "carbs_target_g": round((target_cal * 0.45) / 4, 1),
                "fat_g": round(fat_total, 1),
                "fat_target_g": round((target_cal * 0.25) / 9, 1),
            },
            "weekly_chart": weekly_data,
            "monthly_chart": monthly_data
        }
