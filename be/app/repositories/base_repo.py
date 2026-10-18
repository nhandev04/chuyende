from typing import Generic, TypeVar, Type, Optional, List, Any
from sqlalchemy.orm import Session
from app.db.database import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    """
    Generic Base Repository providing standard CRUD operations.
    """

    def __init__(self, model: Type[ModelType], db: Session):
        self.model = model
        self.db = db

    def get_by_id(self, item_id: Any) -> Optional[ModelType]:
        return self.db.query(self.model).filter(self.model.id == item_id).first()

    def get_all(self, limit: int = 100, offset: int = 0) -> List[ModelType]:
        return self.db.query(self.model).offset(offset).limit(limit).all()

    def create(self, instance: ModelType) -> ModelType:
        self.db.add(instance)
        self.db.commit()
        self.db.refresh(instance)
        return instance

    def update(self, instance: ModelType) -> ModelType:
        self.db.commit()
        self.db.refresh(instance)
        return instance

    def delete(self, instance: ModelType) -> None:
        self.db.delete(instance)
        self.db.commit()
