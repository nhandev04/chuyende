import os

SECRET_KEY = "health_ai_secret_key_super_secure_change_in_production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

DATABASE_URL = "sqlite:///./health_app.db"
