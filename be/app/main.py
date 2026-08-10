from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import engine, Base, SessionLocal
from app.db.models import FoodDatabase
from app.api import auth, profile, food_logs, weight_logs, ai, admin

# Create tables automatically
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Personalized Health & Calorie Tracking API",
    description="Backend API supporting food image recognition, calorie quantification, and health tracking.",
    version="1.0.0"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for dev flexibility
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(food_logs.router)
app.include_router(weight_logs.router)
app.include_router(ai.router)
app.include_router(admin.router)

@app.on_event("startup")
def seed_ground_truth_database():
    """Seed initial ground truth food database for Vietnamese dishes if empty"""
    db = SessionLocal()
    try:
        if db.query(FoodDatabase).count() == 0:
            initial_foods = [
                FoodDatabase(food_name="Phở Bò Tái Sách", category="Món Nước", calories_per_100g=106.0, protein_per_100g=5.8, carbs_per_100g=12.8, fat_per_100g=3.1),
                FoodDatabase(food_name="Cơm Tấm Sườn Bì Chả", category="Cơm", calories_per_100g=144.0, protein_per_100g=7.6, carbs_per_100g=15.0, fat_per_100g=5.6),
                FoodDatabase(food_name="Salad Ức Gà Sốt Chanh Dây", category="Healthy", calories_per_100g=91.4, protein_per_100g=10.0, carbs_per_100g=5.1, fat_per_100g=3.0),
                FoodDatabase(food_name="Bún Chả Hà Nội", category="Món Nước", calories_per_100g=140.0, protein_per_100g=7.6, carbs_per_100g=14.7, fat_per_100g=5.2),
                FoodDatabase(food_name="Bánh Mi Thịt Nướng", category="Bánh Mì", calories_per_100g=210.0, protein_per_100g=8.5, carbs_per_100g=28.0, fat_per_100g=7.0),
                FoodDatabase(food_name="Trà Sữa Trân Châu Đường Đen", category="Đồ Uống", calories_per_100g=112.5, protein_per_100g=0.75, carbs_per_100g=19.5, fat_per_100g=3.75)
            ]
            db.add_all(initial_foods)
            db.commit()
    finally:
        db.close()

@app.get("/")
def root():
    return {
        "status": "online",
        "message": "AI Health Care & Calorie Quantification API is running",
        "docs_url": "/docs"
    }
