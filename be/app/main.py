import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import engine, Base
from app.api import auth, profile, food_logs, weight_logs, ai, admin

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(name)s - %(message)s"
)

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

@app.get("/")
def root():
    return {
        "status": "online",
        "message": "AI Health Care & Calorie Quantification API is running",
        "docs_url": "/docs"
    }
