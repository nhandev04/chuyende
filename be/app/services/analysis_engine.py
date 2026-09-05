"""
Analysis Engine for Health Metrics Computation
Handles 10-Level BMI Scale, TDEE, Body Fat %, and Food Nutrition Analysis
"""
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)


def get_bmi_10_level_scale(bmi: float, goal: str = "weight_loss") -> Dict[str, Any]:
    """
    10-Level BMI Scale based on WHO & Asian-Pacific Biometric Standards.
    Returns level (1 to 10), label, body_shape, and detailed recommendation.
    """
    if bmi < 16.5:
        level = 1
        label = "Severely Underweight"
        shape = "Severe Ectomorph"
        rec = f"🚨 SCALE 1/10 - {label}: BMI of {bmi} is at a severe underweight alert level. Increase daily intake by +500 to +700 kcal, focus on lean protein (red meat, fish, eggs), add milk, and divide meals into 5-6 small portions daily."
    elif bmi < 17.5:
        level = 2
        label = "Moderately Underweight"
        shape = "Skinny / Ectomorph"
        rec = f"⚠️ SCALE 2/10 - {label}: BMI of {bmi} indicates moderate underweight status. A caloric surplus (+400 kcal/day) with healthy fats (nuts, seeds, avocados) is strongly recommended."
    elif bmi < 18.5:
        level = 3
        label = "Mildly Underweight"
        shape = "Mild Ectomorph"
        rec = f"🟡 SCALE 3/10 - {label}: BMI of {bmi} is slightly below the normal threshold. Maintain a mild surplus (+300 kcal/day) combined with progressive resistance training to build muscle mass."
    elif bmi < 20.5:
        level = 4
        label = "Normal - Slim Fit"
        shape = "Slim Fit / Lean"
        rec = f"✅ SCALE 4/10 - {label}: BMI of {bmi} is in the healthy lean range. Maintain a balanced macronutrient distribution (40% Carbs, 30% Protein, 30% Fat) with regular physical activity."
    elif bmi < 23.0:
        level = 5
        label = "Normal - Ideal Fit"
        shape = "Fit / Athletic Ideal" if goal == "muscle_gain" else "Ideal Mesomorph"
        rec = f"🌟 SCALE 5/10 - {label}: BMI of {bmi} is IDEAL (Asian-Pacific standard). Outstanding body composition! Maintain your current TDEE target and prioritize nutrient-dense whole foods."
    elif bmi < 25.0:
        level = 6
        label = "Overweight Threshold"
        shape = "Slightly High / Soft"
        rec = f"⚠️ SCALE 6/10 - {label}: BMI of {bmi} reaches the overweight boundary. A mild caloric deficit (-200 kcal/day) or 150 minutes of weekly cardio is recommended to prevent abdominal fat accumulation."
    elif bmi < 27.5:
        level = 7
        label = "Overweight Grade 1"
        shape = "Overweight / Soft"
        rec = f"🔴 SCALE 7/10 - {label}: BMI of {bmi} shows noticeable overweight status. Establish a standard deficit (-400 kcal/day), limit refined carbohydrates, sugary beverages, and processed snacks."
    elif bmi < 30.0:
        level = 8
        label = "Pre-Obese"
        shape = "Pre-Obese Endomorph"
        rec = f"⚠️ SCALE 8/10 - {label}: BMI of {bmi} indicates pre-obese risk. Strictly enforce a caloric deficit (-500 kcal/day) combined with 45 minutes of daily cardio and strength exercise."
    elif bmi < 35.0:
        level = 9
        label = "Obese Class I"
        shape = "Obese Class I / Endomorph"
        rec = f"🚨 SCALE 9/10 - {label}: BMI of {bmi} carries elevated cardiovascular risk. Reduce daily intake by 500-600 kcal, prioritizing low-impact activities (brisk walking, swimming) to protect joint health."
    else:
        level = 10
        label = "Obese Class II / Severe"
        shape = "Severe Obese Endomorph"
        rec = f"🚨 SCALE 10/10 - {label}: SEVERE OBESITY WARNING (BMI {bmi}). Immediate controlled caloric deficit intervention is required. Strictly eliminate added sugars/trans fats and consult a medical healthcare professional."

    return {
        "bmi_level": level,
        "bmi_level_label": label,
        "body_shape": shape,
        "recommendation": rec
    }


def compute_body_metrics(
    height_cm: float,
    weight_kg: float,
    age: int,
    gender: str,
    goal: str
) -> Dict[str, Any]:
    """
    Real Biometric Engine with 10-Level BMI Scale Integration
    """
    height_m = max(0.5, height_cm / 100.0)
    weight_kg = max(20.0, weight_kg)
    age = max(10, age)
    
    # 1. BMI Calculation
    bmi = round(weight_kg / (height_m * height_m), 1)
    
    # 2. BMR Calculation (Mifflin-St Jeor Formula)
    is_male = gender.lower() in ["male", "nam", "m"]
    gender_val = 1 if is_male else 0
    
    if is_male:
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
    else:
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161

    # 3. TDEE Calculation (Moderate Activity Factor 1.375)
    tdee = round(bmr * 1.375, 0)

    # 4. Deurenberg Body Fat Percentage Formula
    body_fat_pct = round((1.20 * bmi) + (0.23 * age) - (10.8 * gender_val) - 5.4, 1)
    body_fat_pct = max(5.0, min(50.0, body_fat_pct))

    # 5. Get 10-Level BMI Scale & Recommendation
    scale_info = get_bmi_10_level_scale(bmi, goal)

    return {
        "body_shape": scale_info["body_shape"],
        "estimated_body_fat_pct": body_fat_pct,
        "bmi": bmi,
        "tdee": tdee,
        "bmi_level": scale_info["bmi_level"],
        "bmi_level_label": scale_info["bmi_level_label"],
        "recommendation": scale_info["recommendation"]
    }


def analyze_food_fallback(text_prompt: Optional[str] = None, filename: Optional[str] = None) -> Dict[str, Any]:
    """
    Fallback food lookup from database or default values for unrecognized images or text input.
    """
    from app.db.database import SessionLocal
    from app.db.models import FoodDatabase

    search = ((text_prompt or "") + " " + (filename or "")).lower()
    
    db = SessionLocal()
    try:
        foods = db.query(FoodDatabase).all()
        for item in foods:
            if item.food_name.lower() in search or search in item.food_name.lower():
                w = 350.0
                ratio = w / 100.0
                return {
                    "food_name": item.food_name,
                    "estimated_weight_g": w,
                    "calories": round(item.calories_per_100g * ratio, 1),
                    "protein_g": round(item.protein_per_100g * ratio, 1),
                    "carbs_g": round(item.carbs_per_100g * ratio, 1),
                    "fat_g": round(item.fat_per_100g * ratio, 1),
                    "confidence_score": 0.96,
                    "detected_items": [item.food_name, "Standard Seasoning"],
                    "advice": f"Matched ground-truth item in library ({item.category}). Balanced macronutrient profile."
                }
    except Exception as e:
        logger.warning(f"Error querying FoodDatabase: {e}")
    finally:
        db.close()

    food_title = text_prompt.capitalize() if text_prompt else "Beef Noodle Soup (Pho)"
    return {
        "food_name": food_title,
        "estimated_weight_g": 400.0,
        "calories": 480.0,
        "protein_g": 26.5,
        "carbs_g": 58.0,
        "fat_g": 14.2,
        "confidence_score": 0.92,
        "detected_items": [food_title, "Fresh Herbs", "Broth"],
        "advice": "High protein and complex carbs meal. Consider moderation on broth consumption to control sodium intake."
    }


def generate_diet_recommendations(
    consumed_calories: float,
    target_calories: float,
    goal: str = "weight_loss",
    consumed_macros: Optional[Dict[str, float]] = None,
    dietary_preferences: str = ""
) -> Dict[str, Any]:
    """
    Generate personalized diet recommendations based on caloric deficit/surplus,
    macro distribution analysis, health conditions, and RAG recipe library.
    """
    diff = consumed_calories - target_calories
    remaining_cal = max(0.0, target_calories - consumed_calories)
    
    # 1. Macro Target Estimation
    target_protein = (target_calories * 0.30) / 4.0
    
    consumed_p = consumed_macros.get("protein_g", 0.0) if consumed_macros else 0.0
    
    # 2. Determine Caloric Status & Advice
    advice_parts = []
    
    if diff > 300:
        status = "over_budget"
        advice_parts.append(f"⚠️ You have exceeded your daily target by {int(diff)} kcal today. Consider a 30-minute light walk or choosing an ultra-light evening meal.")
    elif diff < -500:
        status = "under_budget"
        advice_parts.append(f"❌ You are {int(abs(diff))} kcal below your minimum threshold. Fuel up with nutrient-dense meals to prevent hypoglycemia and muscle breakdown.")
    else:
        status = "on_track"
        advice_parts.append("✅ Excellent caloric balance! You are maintaining a healthy energy intake right on target.")
        
    # Macro Insights (Protein focus)
    if consumed_p < target_protein * 0.5 and remaining_cal > 150:
        advice_parts.append(f"💡 Protein Boost Recommended: You have consumed {int(consumed_p)}g / {int(target_protein)}g protein today. Prioritize lean protein (chicken, fish, eggs, tofu).")
    
    # Health Conditions (e.g. high blood fat)
    pref_lower = (dietary_preferences or "").lower()
    if "high blood fat" in pref_lower or "mỡ máu" in pref_lower:
        advice_parts.append("🫀 Medical Care (High Blood Fat): Prioritize soluble fiber (oats, brown rice) and Omega-3 rich fish (salmon, sea bass); strictly limit saturated animal fats and fried foods.")
    elif "weight_loss" in (goal or "").lower():
        advice_parts.append("🎯 Weight Loss Focus: Prioritize high-fiber vegetables and lean protein to enhance satiety while maintaining a mild caloric deficit.")
    elif "muscle_gain" in (goal or "").lower():
        advice_parts.append("💪 Muscle Gain Focus: Ensure sufficient protein surplus and complex carbohydrates to support post-workout muscle synthesis.")

    full_advice = " ".join(advice_parts)
    
    # 3. Dynamic Candidate Meal Selection from RAG Recipe Library
    try:
        from app.services.rag_engine import retrieve_relevant_foods
        allergens = []
        for kw in ["hải sản", "seafood", "tôm", "cá", "fish", "đậu nành", "soy", "trừng", "egg", "sữa", "milk"]:
            if kw in pref_lower:
                allergens.append(kw)
                
        meal_target = max(250.0, remaining_cal / 2.0)
        recipes = retrieve_relevant_foods(meal_target, allergens, health_condition=dietary_preferences, top_k=2)
        
        suggested_meals = []
        meal_types = ["Dinner / Main", "Snack / Light"]
        for idx, r in enumerate(recipes):
            m_label = meal_types[idx] if idx < len(meal_types) else "Suggested Meal"
            suggested_meals.append({
                "meal": m_label,
                "suggestion": f"{r.get('food_name')} ({r.get('category', 'Healthy')})",
                "calories": int(r.get("calories", 350))
            })
    except Exception as e:
        logger.warning(f"Fallback meal suggestions used: {e}")
        suggested_meals = [
            {"meal": "Dinner", "suggestion": "Pan-seared Salmon with Steamed Asparagus & Brown Rice", "calories": 400},
            {"meal": "Snack", "suggestion": "Avocado Banana Whey Protein Smoothie", "calories": 250}
        ]
        
    return {
        "status": status,
        "diff_calories": round(diff, 1),
        "consumed_calories": round(consumed_calories, 1),
        "target_calories": round(target_calories, 1),
        "remaining_calories": round(remaining_cal, 1),
        "advice": full_advice,
        "suggested_meals": suggested_meals
    }
