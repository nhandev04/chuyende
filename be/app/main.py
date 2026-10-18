import logging
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import engine, Base, ensure_database_schema_migrated
from app.db.seed import seed_initial_db
from app.api import auth, profile, food_logs, weight_logs, ai, admin, subscription
from app.services.subscription_cron import start_subscription_expiration_cron

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(name)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Modern FastAPI lifespan context manager for startup and shutdown lifecycle management.
    """
    # 1. Startup phase: initialize tables, run migrations, and seed demo accounts
    logger.info("Starting up: initializing database tables and schema migrations...")
    Base.metadata.create_all(bind=engine)
    ensure_database_schema_migrated()
    seed_initial_db()

    # 2. Spawn background subscription expiration worker (1 hour intervals)
    cron_task = asyncio.create_task(start_subscription_expiration_cron(3600))
    logger.info("Subscription expiration background worker started.")

    yield

    # 3. Shutdown phase: cancel and clean up background tasks
    logger.info("Shutting down: canceling background tasks...")
    cron_task.cancel()
    try:
        await cron_task
    except (asyncio.CancelledError, Exception) as e:
        logger.debug(f"Cron task cleanly terminated: {e}")
    logger.info("Application shutdown complete.")


app = FastAPI(
    title="AI Personalized Health & Calorie Tracking API",
    description="Production-grade Backend API supporting food image recognition, calorie quantification, and health tracking.",
    version="2.0.0",
    lifespan=lifespan
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


@app.get("/")
def root():
    return {
        "status": "online",
        "message": "AI Health Care & Calorie Quantification API is running",
        "docs_url": "/docs",
        "version": "2.0.0"
    }
