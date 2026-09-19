from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import DATABASE_URL

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    # PostgreSQL / Supabase Engine Configuration
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def ensure_database_schema_migrated():
    from sqlalchemy import text
    try:
        if DATABASE_URL.startswith("sqlite"):
            with engine.connect() as conn:
                # Migration for users table
                res = conn.execute(text("PRAGMA table_info(users)")).fetchall()
                user_cols = [r[1] for r in res]
                if "avatar_url" not in user_cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN avatar_url TEXT"))
                    conn.commit()

                # Migration for user_profiles table
                res_p = conn.execute(text("PRAGMA table_info(user_profiles)")).fetchall()
                profile_cols = [r[1] for r in res_p]
                if "avatar_url" not in profile_cols:
                    conn.execute(text("ALTER TABLE user_profiles ADD COLUMN avatar_url TEXT"))
                    conn.commit()

        # Create all missing tables for SQLite or PostgreSQL (users, user_profiles, food_logs, weight_logs, food_database, ai_reports, subscription_history, rag_meal_plans)
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"Migration check notice: {e}")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
