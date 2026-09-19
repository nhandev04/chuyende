import os
from dotenv import load_dotenv

# Load .env file from be/ directory
load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "health_ai_secret_key_super_secure_change_in_production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

raw_db_url = os.getenv("DATABASE_URL", "sqlite:///./health_app.db")

# Automatically convert legacy "postgres://" to "postgresql://" for SQLAlchemy compatibility
if raw_db_url.startswith("postgres://"):
    DATABASE_URL = raw_db_url.replace("postgres://", "postgresql://", 1)
else:
    DATABASE_URL = raw_db_url
