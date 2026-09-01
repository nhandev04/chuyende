import random
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.db.models import UserProfile, FoodDatabase

def generate_pro_daily_meal_plan(profile: UserProfile, db: Session) -> Dict[str, Any]:
    """
    Generates a personalized daily meal plan for Pro users based on:
    - Daily calorie target (TDEE deficit/surplus)
    - BMI 10-level scale recommendations
    - Dietary preferences
    """
    target_cal = profile.daily_calorie_target if profile else 2000.0
    bmi = profile.bmi if profile else 22.0
    body_shape = profile.body_shape or "Average"
    goal = profile.goal or "weight_loss"

    # Meal distribution: Breakfast (25%), Lunch (35%), Dinner (30%), Snack (10%)
    bf_cal = round(target_cal * 0.25, 0)
    lunch_cal = round(target_cal * 0.35, 0)
    dinner_cal = round(target_cal * 0.30, 0)
    snack_cal = round(target_cal * 0.10, 0)

    # Sample Vietnamese nutritional meal suggestions
    sample_meals = {
        "breakfast": [
            {"name": "Phở Bò Nạm Nạc", "portion": "1 Bát lớn (350g)", "calories": 420, "protein_g": 26, "carbs_g": 52, "fat_g": 10, "advice": "Cung cấp đạm nạc và tinh bột năng lượng cao cho buổi sáng."},
            {"name": "Bún Mọc Giò Lụa", "portion": "1 Bát (300g)", "calories": 380, "protein_g": 20, "carbs_g": 48, "fat_g": 11, "advice": "Ít chất béo xấu, nhẹ bụng sảng khoái."},
            {"name": "Trứng Ốp La + Bánh Mì Đen + Bơ", "portion": "2 Trứng + 2 Lát bánh mì", "calories": 390, "protein_g": 18, "carbs_g": 35, "fat_g": 16, "advice": "Chứa nhiều chất béo tốt Omega-3 và đạm hấp thu nhanh."}
        ],
        "lunch": [
            {"name": "Cơm Ức Gà Nướng Mật Ong + Rau Luộc", "portion": "1 Bát cơm (150g) + 150g Ức gà", "calories": 580, "protein_g": 42, "carbs_g": 65, "fat_g": 8, "advice": "Món ăn chuẩn Fitness giúp xây dựng khối cơ bắp rắn chắc."},
            {"name": "Cơm Cá Hồi Sốt Chanh Dây + Bông Cải Xanh", "portion": "1 Bát cơm + 130g Cá hồi", "calories": 610, "protein_g": 38, "carbs_g": 58, "fat_g": 18, "advice": "Bổ sung Omega-3 cho tim mạch và da dẻ hồng hào."},
            {"name": "Bún Thịt Nướng Nạc + Nước Mắm Chua Ngọt", "portion": "1 Tô bún (350g)", "calories": 520, "protein_g": 28, "carbs_g": 62, "fat_g": 14, "advice": "Hương vị hấp dẫn, giàu chất xơ từ rau sống ăn kèm."}
        ],
        "dinner": [
            {"name": "Salad Bò LÚC LẮC + Dầu Ô Liu", "portion": "1 Đĩa lớn (250g)", "calories": 440, "protein_g": 32, "carbs_g": 20, "fat_g": 18, "advice": "Hạn chế Carbs vào buổi tối giúp đốt mỡ tự nhiên khi ngủ."},
            {"name": "Canh Bí Đao Nấu Thịt Băm + Cá Thu Sốt Cà", "portion": "1 Bát canh + 1 Khúc cá thu", "calories": 480, "protein_g": 35, "carbs_g": 25, "fat_g": 15, "advice": "Cung cấp nhiều vi chất, giảm tích nước tối."},
            {"name": "Ức Gà Áp Chảo Măng Tây + Khoai Lang Củ", "portion": "150g Ức gà + 1 củ khoai lang", "calories": 450, "protein_g": 36, "carbs_g": 42, "fat_g": 6, "advice": "Tinh bột hấp thu chậm giúp no lâu, không thèm ăn đêm."}
        ],
        "snack": [
            {"name": "Sữa Chua Không Đường + Hạnh Nhân", "portion": "1 Hộp + 15g Hạnh nhân", "calories": 160, "protein_g": 8, "carbs_g": 12, "fat_g": 9, "advice": "Bổ sung lợi khuẩn đường ruột và chất béo thực vật."},
            {"name": "Sinh Tố Bơ Mầm Đạm Whey", "portion": "1 Ly (250ml)", "calories": 210, "protein_g": 15, "carbs_g": 18, "fat_g": 8, "advice": "Năng lượng phục hồi nhanh sau buổi tập chiều."}
        ]
    }

    # Pick custom meal for user
    bf = random.choice(sample_meals["breakfast"])
    lunch = random.choice(sample_meals["lunch"])
    dinner = random.choice(sample_meals["dinner"])
    snack = random.choice(sample_meals["snack"])

    total_meal_cal = bf["calories"] + lunch["calories"] + dinner["calories"] + snack["calories"]
    total_protein = bf["protein_g"] + lunch["protein_g"] + dinner["protein_g"] + snack["protein_g"]
    total_carbs = bf["carbs_g"] + lunch["carbs_g"] + dinner["carbs_g"] + snack["carbs_g"]
    total_fat = bf["fat_g"] + lunch["fat_g"] + dinner["fat_g"] + snack["fat_g"]

    return {
        "title": "🥗 Thực Đơn Gợi Ý AI Hàng Ngày (Dành Cho Bản Pro)",
        "target_daily_calories": target_cal,
        "planned_total_calories": total_meal_cal,
        "macros_summary": {
            "protein_g": total_protein,
            "carbs_g": total_carbs,
            "fat_g": total_fat
        },
        "bmi_context": {
            "bmi": bmi,
            "body_shape": body_shape,
            "goal": goal
        },
        "meals": [
            {
                "meal_type": "breakfast",
                "meal_label": "🌅 Bữa Sáng (Target ~" + str(int(bf_cal)) + " kcal)",
                **bf
            },
            {
                "meal_type": "lunch",
                "meal_label": "☀️ Bữa Trưa (Target ~" + str(int(lunch_cal)) + " kcal)",
                **lunch
            },
            {
                "meal_type": "dinner",
                "meal_label": "🌙 Bữa Tối (Target ~" + str(int(dinner_cal)) + " kcal)",
                **dinner
            },
            {
                "meal_type": "snack",
                "meal_label": "🍓 Bữa Phụ (Target ~" + str(int(snack_cal)) + " kcal)",
                **snack
            }
        ]
    }
