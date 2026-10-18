from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Security & Auth
    SECRET_KEY: str = "health_ai_secret_key_super_secure_change_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Database
    DATABASE_URL: str = "sqlite:///./health_app.db"

    # Stripe
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_PUBLISHABLE_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None

    # Clerk
    CLERK_SECRET_KEY: Optional[str] = None

    # Cloudinary
    CLOUDINARY_CLOUD_NAME: str = "rohl7aqf"
    CLOUDINARY_API_KEY: str = "396177385619527"
    CLOUDINARY_API_SECRET: str = ""
    CLOUDINARY_URL: Optional[str] = None

    # Google Gemini AI
    GEMINI_API_KEY: str = ""

    # Frontend URL
    FRONTEND_URL: str = "http://localhost:3000"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()

# Automatically convert legacy "postgres://" to "postgresql://" for SQLAlchemy compatibility
raw_db_url = settings.DATABASE_URL
if raw_db_url.startswith("postgres://"):
    DATABASE_URL = raw_db_url.replace("postgres://", "postgresql://", 1)
else:
    DATABASE_URL = raw_db_url

# Backward-compatible exports
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES
