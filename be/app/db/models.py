from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    role = Column(String, default="user") # "user" or "admin"
    created_at = Column(DateTime, default=datetime.utcnow)

    profile = relationship("UserProfile", back_populates="user", uselist=False)
    food_logs = relationship("FoodLog", back_populates="user")
    weight_logs = relationship("WeightLog", back_populates="user")

class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    height_cm = Column(Float, default=170.0)
    current_weight_kg = Column(Float, default=65.0)
    target_weight_kg = Column(Float, default=60.0)
    age = Column(Integer, default=22)
    gender = Column(String, default="male")
    activity_level = Column(String, default="moderate") # sedentary, light, moderate, active
    goal = Column(String, default="weight_loss") # weight_loss, muscle_gain, maintain
    daily_calorie_target = Column(Float, default=2000.0)
    bmi = Column(Float, default=22.5)
    tdee = Column(Float, default=2200.0)
    body_shape = Column(String, default="Average") # Skinny, Fat, Muscular, Fit, Average
    dietary_preferences = Column(String, nullable=True) # e.g. "Dị ứng hải sản, Ngân sách 100k/ngày"

    user = relationship("User", back_populates="profile")

class FoodLog(Base):
    __tablename__ = "food_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    meal_type = Column(String, nullable=False) # breakfast, lunch, dinner, snack
    food_name = Column(String, nullable=False)
    weight_g = Column(Float, default=300.0)
    calories = Column(Float, nullable=False)
    protein_g = Column(Float, default=0.0)
    carbs_g = Column(Float, default=0.0)
    fat_g = Column(Float, default=0.0)
    image_url = Column(String, nullable=True)
    confidence_score = Column(Float, default=0.95)
    logged_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="food_logs")

class WeightLog(Base):
    __tablename__ = "weight_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    weight_kg = Column(Float, nullable=False)
    recorded_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="weight_logs")

class FoodDatabase(Base):
    __tablename__ = "food_database"

    id = Column(Integer, primary_key=True, index=True)
    food_name = Column(String, unique=True, index=True, nullable=False)
    category = Column(String, default="General")
    calories_per_100g = Column(Float, nullable=False)
    protein_per_100g = Column(Float, default=0.0)
    carbs_per_100g = Column(Float, default=0.0)
    fat_per_100g = Column(Float, default=0.0)
    image_url = Column(String, nullable=True)

class AIReport(Base):
    __tablename__ = "ai_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    food_log_id = Column(Integer, ForeignKey("food_logs.id"), nullable=True)
    original_prediction = Column(String, nullable=False)
    user_correction = Column(String, nullable=False)
    status = Column(String, default="pending") # pending, resolved
    created_at = Column(DateTime, default=datetime.utcnow)
