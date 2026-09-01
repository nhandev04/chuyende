import logging
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.db.models import User, UserProfile, FoodDatabase
from app.core.security import hash_password

logger = logging.getLogger(__name__)

def seed_initial_db():
    db: Session = SessionLocal()
    try:
        # 1. Seed Admin User
        admin_user = db.query(User).filter(User.email == "admin@uit.edu.vn").first()
        if not admin_user:
            admin_user = User(
                email="admin@uit.edu.vn",
                hashed_password=hash_password("admin123"),
                full_name="Quản Trị Viên (Admin)",
                role="admin",
                auth_provider="local",
                plan="pro"
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)

            admin_profile = UserProfile(
                user_id=admin_user.id,
                height_cm=175.0,
                current_weight_kg=70.0,
                target_weight_kg=68.0,
                age=25,
                gender="male",
                activity_level="active",
                goal="maintain",
                daily_calorie_target=2400.0,
                bmi=22.8,
                tdee=2400.0,
                body_shape="Fit"
            )
            db.add(admin_profile)
            db.commit()
            logger.info("Seeded Admin user: admin@uit.edu.vn")

        # 2. Seed Default Regular User
        demo_user = db.query(User).filter(User.email == "demouser@uit.edu.vn").first()
        if not demo_user:
            demo_user = User(
                email="demouser@uit.edu.vn",
                hashed_password=hash_password("123456"),
                full_name="Nguyễn Trọng Nhân",
                role="user",
                auth_provider="local",
                plan="standard"
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)

            demo_profile = UserProfile(
                user_id=demo_user.id,
                height_cm=172.0,
                current_weight_kg=68.0,
                target_weight_kg=63.0,
                age=22,
                gender="male",
                activity_level="moderate",
                goal="weight_loss",
                daily_calorie_target=1950.0,
                bmi=23.0,
                tdee=2350.0,
                body_shape="Average"
            )
            db.add(demo_profile)
            db.commit()
            logger.info("Seeded Demo user: demouser@uit.edu.vn")

        # 3. Seed Ground-Truth Food Database
        initial_foods = [
            {"food_name": "Phở Bò Tái Sách", "category": "Món Nước", "calories_per_100g": 106.0, "protein_per_100g": 5.8, "carbs_per_100g": 12.8, "fat_per_100g": 3.1},
            {"food_name": "Cơm Tấm Sườn Bì Chả", "category": "Cơm", "calories_per_100g": 144.0, "protein_per_100g": 7.6, "carbs_per_100g": 15.0, "fat_per_100g": 5.6},
            {"food_name": "Salad Ức Gà Sốt Chanh Dây", "category": "Healthy", "calories_per_100g": 91.4, "protein_per_100g": 10.0, "carbs_per_100g": 5.1, "fat_per_100g": 3.0},
            {"food_name": "Bánh Mì Thịt Nạc", "category": "Bánh Mì", "calories_per_100g": 250.0, "protein_per_100g": 9.5, "carbs_per_100g": 38.0, "fat_per_100g": 6.8},
            {"food_name": "Bún Thịt Nướng", "category": "Món Khô", "calories_per_100g": 148.0, "protein_per_100g": 8.0, "carbs_per_100g": 17.5, "fat_per_100g": 4.0},
            {"food_name": "Gỏi Cuốn Tôm Thịt", "category": "Khai Vị", "calories_per_100g": 120.0, "protein_per_100g": 7.0, "carbs_per_100g": 18.0, "fat_per_100g": 2.2},
            {"food_name": "Sữa Chua Không Đường", "category": "Tráng Miệng", "calories_per_100g": 63.0, "protein_per_100g": 5.3, "carbs_per_100g": 7.0, "fat_per_100g": 1.5}
        ]

        for item in initial_foods:
            existing_food = db.query(FoodDatabase).filter(FoodDatabase.food_name == item["food_name"]).first()
            if not existing_food:
                food = FoodDatabase(**item)
                db.add(food)
        db.commit()
        logger.info("Seeded initial Ground-Truth Food Database")

    except Exception as e:
        logger.error(f"Error seeding initial database: {e}")
        db.rollback()
    finally:
        db.close()
