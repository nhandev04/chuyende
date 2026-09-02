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
    goal: str
) -> Dict[str, Any]:
    """
    Generate personalized diet recommendations based on caloric deficit/surplus.
    """
    diff = consumed_calories - target_calories
    
    if diff > 300:
        status = "over_budget"
        advice = f"⚠️ You have exceeded your daily target by {int(diff)} kcal today. Consider a 30-minute walk or reducing evening dinner portions."
        suggested_meals = [
            {"meal": "Dinner", "suggestion": "Grilled Chicken Salad without heavy dressing or 1 Whey Protein Shake", "calories": 200},
            {"meal": "Snack", "suggestion": "Warm Green Tea or Pure Water", "calories": 0}
        ]
    elif diff < -500:
        status = "under_budget"
        advice = f"❌ You are {int(abs(diff))} kcal below your minimum threshold. Fuel up with nutrient-dense foods to prevent hypoglycemia."
        suggested_meals = [
            {"meal": "Dinner", "suggestion": "Pan-seared chicken breast with brown rice + 1 bowl of lean beef soup", "calories": 480},
            {"meal": "Snack", "suggestion": "1 Banana + 30g Almonds", "calories": 180}
        ]
    else:
        status = "on_track"
        advice = "✅ Excellent caloric balance! Maintain this habit to achieve your fitness goals right on schedule."
        suggested_meals = [
            {"meal": "Dinner", "suggestion": "Pan-seared Salmon + Steamed Asparagus + 1/2 bowl of brown rice", "calories": 400}
        ]
        
    return {
        "status": status,
        "diff_calories": round(diff, 1),
        "consumed_calories": round(consumed_calories, 1),
        "target_calories": round(target_calories, 1),
        "remaining_calories": round(target_calories - consumed_calories, 1),
        "advice": advice,
        "suggested_meals": suggested_meals
    }
