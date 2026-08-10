from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# Auth Schemas
class UserRegister(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    email: str
    full_name: Optional[str] = None
    role: str

# Profile Schemas
class UserProfileUpdate(BaseModel):
    height_cm: Optional[float] = None
    current_weight_kg: Optional[float] = None
    target_weight_kg: Optional[float] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    activity_level: Optional[str] = None
    goal: Optional[str] = None
    daily_calorie_target: Optional[float] = None
    dietary_preferences: Optional[str] = None

class UserProfileOut(BaseModel):
    id: int
    user_id: int
    height_cm: float
    current_weight_kg: float
    target_weight_kg: float
    age: int
    gender: str
    activity_level: str
    goal: str
    daily_calorie_target: float
    bmi: float
    tdee: float
    body_shape: str
    dietary_preferences: Optional[str] = None

    class Config:
        from_attributes = True

# Food Log Schemas
class FoodLogCreate(BaseModel):
    meal_type: str # breakfast, lunch, dinner, snack
    food_name: str
    weight_g: float
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    image_url: Optional[str] = None

class FoodLogOut(BaseModel):
    id: int
    user_id: int
    meal_type: str
    food_name: str
    weight_g: float
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    image_url: Optional[str] = None
    confidence_score: float
    logged_at: datetime

    class Config:
        from_attributes = True

# Weight Log Schemas
class WeightLogCreate(BaseModel):
    weight_kg: float

class WeightLogOut(BaseModel):
    id: int
    user_id: int
    weight_kg: float
    recorded_at: datetime

    class Config:
        from_attributes = True

# AI Analysis & Recommendation Schemas
class AIAnalysisResult(BaseModel):
    food_name: str
    estimated_weight_g: float
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    confidence_score: float
    detected_items: List[str]
    advice: Optional[str] = None

class BodyAnalysisResult(BaseModel):
    body_shape: str # Skinny, Fat, Muscular, Fit, Average
    estimated_body_fat_pct: float
    bmi: float
    tdee: float
    recommendation: str

class AIReportCreate(BaseModel):
    food_log_id: Optional[int] = None
    original_prediction: str
    user_correction: str
