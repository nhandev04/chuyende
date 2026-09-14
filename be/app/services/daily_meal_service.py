import random
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.db.models import UserProfile, FoodDatabase

from app.services.rag_engine import generate_rag_meal_plan

def generate_pro_daily_meal_plan(profile: UserProfile, db: Session) -> Dict[str, Any]:
    """
    Generates a personalized RAG AI daily meal plan for Pro users using Vector Search & Gemini LLM.
    """
    target_cal = profile.daily_calorie_target if (profile and hasattr(profile, 'daily_calorie_target') and profile.daily_calorie_target) else 2000.0
    bmi = profile.bmi if (profile and hasattr(profile, 'bmi') and profile.bmi) else 22.0
    body_shape = profile.body_shape if (profile and hasattr(profile, 'body_shape') and profile.body_shape) else "Average"
    goal = profile.goal if (profile and hasattr(profile, 'goal') and profile.goal) else "weight_loss"


    # Call RAG Engine
    rag_res = generate_rag_meal_plan(profile, consumed_today_calories=0.0, plan_tier="pro")

    meals_formatted = []
    meal_labels = {
        "breakfast": "🌅 Breakfast",
        "lunch": "☀️ Lunch",
        "dinner": "🌙 Dinner",
        "snack": "🍓 Snack"
    }

    for m in rag_res.get("meals", []):
        m_type = m.get("meal_type", "lunch")
        meals_formatted.append({
            "meal_type": m_type,
            "meal_label": m.get("meal_label") or meal_labels.get(m_type, "🍽️ Meal"),
            "name": m.get("meal_name", "Healthy Meal Portion"),
            "portion": m.get("portion", "1 Serving (350g)"),
            "calories": m.get("calories", 450),
            "protein_g": m.get("protein_g", 30),
            "carbs_g": m.get("carbs_g", 40),
            "fat_g": m.get("fat_g", 12),
            "advice": m.get("recipe_notes") or rag_res.get("summary_advice", "Balanced macro distribution.")
        })

    return {
        "title": "✨ Daily AI Recommended Meal Plan (Pro Tier Exclusive)",
        "target_daily_calories": target_cal,
        "planned_total_calories": sum(m["calories"] for m in meals_formatted),
        "macros_summary": {
            "protein_g": sum(m["protein_g"] for m in meals_formatted),
            "carbs_g": sum(m["carbs_g"] for m in meals_formatted),
            "fat_g": sum(m["fat_g"] for m in meals_formatted)
        },
        "bmi_context": {
            "bmi": bmi,
            "body_shape": body_shape,
            "goal": goal
        },
        "meals": meals_formatted,
        "grocery_list": rag_res.get("grocery_list", [])
    }

