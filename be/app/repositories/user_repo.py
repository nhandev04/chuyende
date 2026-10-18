from typing import List, Optional
from sqlalchemy.orm import Session
from app.db.models import User, UserProfile
from app.repositories.base_repo import BaseRepository


class UserRepository(BaseRepository[User]):
    def __init__(self, db: Session):
        super().__init__(User, db)

    def get_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email).first()

    def get_by_clerk_or_email(self, clerk_id: str, email: str) -> Optional[User]:
        return (
            self.db.query(User)
            .filter((User.clerk_user_id == clerk_id) | (User.email == email))
            .first()
        )

    def get_profile(self, user_id: int) -> Optional[UserProfile]:
        return self.db.query(UserProfile).filter(UserProfile.user_id == user_id).first()

    def create_profile(self, profile: UserProfile) -> UserProfile:
        self.db.add(profile)
        self.db.commit()
        self.db.refresh(profile)
        return profile

    def update_profile(self, profile: UserProfile) -> UserProfile:
        self.db.commit()
        self.db.refresh(profile)
        return profile

    def get_all_users_with_profile(self) -> List[User]:
        return self.db.query(User).order_by(User.id.asc()).all()
