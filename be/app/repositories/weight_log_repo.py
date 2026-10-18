from typing import List, Optional
from sqlalchemy.orm import Session
from app.db.models import WeightLog
from app.repositories.base_repo import BaseRepository


class WeightLogRepository(BaseRepository[WeightLog]):
    def __init__(self, db: Session):
        super().__init__(WeightLog, db)

    def get_by_user(self, user_id: int, limit: int = 100) -> List[WeightLog]:
        return (
            self.db.query(WeightLog)
            .filter(WeightLog.user_id == user_id)
            .order_by(WeightLog.recorded_at.desc())
            .limit(limit)
            .all()
        )

    def get_latest_by_user(self, user_id: int) -> Optional[WeightLog]:
        return (
            self.db.query(WeightLog)
            .filter(WeightLog.user_id == user_id)
            .order_by(WeightLog.recorded_at.desc())
            .first()
        )
