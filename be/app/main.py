import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import engine, Base, ensure_database_schema_migrated
from app.db.seed import seed_initial_db
from app.api import auth, profile, food_logs, weight_logs, ai, admin, subscription

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(name)s - %(message)s"
)

# Create tables automatically, migrate schema & seed initial database
Base.metadata.create_all(bind=engine)
ensure_database_schema_migrated()
seed_initial_db()



app = FastAPI(
    title="AI Personalized Health & Calorie Tracking API",
    description="Backend API supporting food image recognition, calorie quantification, and health tracking.",
    version="1.0.0"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex=r"https?://.*",
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
app.include_router(subscription.router)


import asyncio
from app.services.subscription_cron import start_subscription_expiration_cron

@app.on_event("startup")
async def on_startup():
    # Spawn subscription expiration cronjob task (scans every 1 hour / 3600 seconds)
    asyncio.create_task(start_subscription_expiration_cron(3600))

@app.get("/")
def root():
    return {
        "status": "online",
        "message": "AI Health Care & Calorie Quantification API is running",
        "docs_url": "/docs"
    }

