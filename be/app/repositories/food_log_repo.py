from typing import List, Optional
from datetime import datetime, date, time
from sqlalchemy.orm import Session
from app.db.models import FoodLog
from app.repositories.base_repo import BaseRepository


class FoodLogRepository(BaseRepository[FoodLog]):
    def __init__(self, db: Session):
        super().__init__(FoodLog, db)

    def get_by_user(self, user_id: int, target_date: Optional[date] = None) -> List[FoodLog]:
        query = self.db.query(FoodLog).filter(FoodLog.user_id == user_id)
        if target_date:
            start_dt = datetime.combine(target_date, time.min)
            end_dt = datetime.combine(target_date, time.max)
            query = query.filter(FoodLog.logged_at >= start_dt, FoodLog.logged_at <= end_dt)
        return query.order_by(FoodLog.logged_at.desc()).all()

    def get_user_logs_between(self, user_id: int, start_dt: datetime, end_dt: datetime) -> List[FoodLog]:
        return (
            self.db.query(FoodLog)
            .filter(
                FoodLog.user_id == user_id,
                FoodLog.logged_at >= start_dt,
                FoodLog.logged_at <= end_dt
            )
            .order_by(FoodLog.logged_at.desc())
            .all()
        )
