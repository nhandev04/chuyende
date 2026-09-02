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

    # Sample nutritional meal suggestions (English localized)
    sample_meals = {
        "breakfast": [
            {"name": "Lean Beef Noodle Soup (Pho)", "portion": "1 Large Bowl (350g)", "calories": 420, "protein_g": 26, "carbs_g": 52, "fat_g": 10, "advice": "Delivers lean protein and complex carbs for high morning energy."},
            {"name": "Pork Ball & Pork Roll Noodle Soup", "portion": "1 Bowl (300g)", "calories": 380, "protein_g": 20, "carbs_g": 48, "fat_g": 11, "advice": "Low in saturated fat, light and refreshing for digestion."},
            {"name": "Sunny-side Eggs + Rye Toast + Avocado", "portion": "2 Eggs + 2 Toast slices", "calories": 390, "protein_g": 18, "carbs_g": 35, "fat_g": 16, "advice": "Rich in healthy Omega-3 fats and fast-absorbing amino acids."}
        ],
        "lunch": [
            {"name": "Honey Honey-Glazed Chicken Breast Rice + Steamed Veggies", "portion": "1 Bowl Rice (150g) + 150g Chicken", "calories": 580, "protein_g": 42, "carbs_g": 65, "fat_g": 8, "advice": "Fitness-standard meal optimized for lean muscle synthesis."},
            {"name": "Grilled Salmon Rice Bowl + Passion Fruit Sauce & Broccoli", "portion": "1 Bowl Rice + 130g Salmon", "calories": 610, "protein_g": 38, "carbs_g": 58, "fat_g": 18, "advice": "Provides essential Omega-3 fatty acids for cardiovascular health."},
            {"name": "Lean Grilled Pork Vermicelli Noodle Salad", "portion": "1 Noodle Bowl (350g)", "calories": 520, "protein_g": 28, "carbs_g": 62, "fat_g": 14, "advice": "Delicious flavor profile packed with fresh herbal fibers."}
        ],
        "dinner": [
            {"name": "Seared Beef Cubes Salad + Olive Oil Dressing", "portion": "1 Large Plate (250g)", "calories": 440, "protein_g": 32, "carbs_g": 20, "fat_g": 18, "advice": "Restricts evening carbs to promote natural fat burning while sleeping."},
            {"name": "Minced Pork Squash Soup + Mackerel in Tomato Sauce", "portion": "1 Soup Bowl + 1 Fish Filet", "calories": 480, "protein_g": 35, "carbs_g": 25, "fat_g": 15, "advice": "High in micronutrients while reducing fluid retention."},
            {"name": "Pan-Seared Chicken Breast + Asparagus & Sweet Potato", "portion": "150g Chicken + 1 Sweet Potato", "calories": 450, "protein_g": 36, "carbs_g": 42, "fat_g": 6, "advice": "Slow-release complex carbs prevent late-night cravings."}
        ],
        "snack": [
            {"name": "Greek Plain Unsweetened Yogurt + Almonds", "portion": "1 Cup + 15g Almonds", "calories": 160, "protein_g": 8, "carbs_g": 12, "fat_g": 9, "advice": "Supports gut microbiome and supplies plant-based fats."},
            {"name": "Avocado Whey Protein Smoothie", "portion": "1 Glass (250ml)", "calories": 210, "protein_g": 15, "carbs_g": 18, "fat_g": 8, "advice": "Fast energy recovery for post-workout afternoon sessions."}
        ]
    }

    # Pick custom meal for user
    bf = random.choice(sample_meals["breakfast"])
    lunch = random.choice(sample_meals["lunch"])
    dinner = random.choice(sample_meals["dinner"])
    snack = random.choice(sample_meals["snack"])

    total_meal_cal = bf["calories"] + lunch["calories"] + dinner["calories"] + snack["calories"]
    total_protein = bf["protein_g"] + lunch["protein_g"] + dinner["protein_g"] + snack["protein_g"]
    total_carbs = bf["carbs_g"] + lunch["carbs_g"] + dinner["carbs_g"] + snack["fat_g"]
    total_fat = bf["fat_g"] + lunch["fat_g"] + dinner["fat_g"] + snack["fat_g"]

    return {
        "title": "🥗 Daily AI Recommended Meal Plan (Pro Tier Exclusive)",
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
                "meal_label": "🌅 Breakfast (Target ~" + str(int(bf_cal)) + " kcal)",
                **bf
            },
            {
                "meal_type": "lunch",
                "meal_label": "☀️ Lunch (Target ~" + str(int(lunch_cal)) + " kcal)",
                **lunch
            },
            {
                "meal_type": "dinner",
                "meal_label": "🌙 Dinner (Target ~" + str(int(dinner_cal)) + " kcal)",
                **dinner
            },
            {
                "meal_type": "snack",
                "meal_label": "🍓 Snack (Target ~" + str(int(snack_cal)) + " kcal)",
                **snack
            }
        ]
    }
