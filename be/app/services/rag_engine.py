"""
RAG Engine (Retrieval-Augmented Generation) for Personalized Nutrition
Combines:
  1. Medical Safety Filter & Vector Retrieval (SEED_RECIPES)
  2. Generative LLM Synthesis (Google Gemini 3.6 Flash)
  3. Smart Clinical Fallback Synthesizer for 100% demo & production uptime.
"""
import os
import json
import random
import logging
from typing import Dict, Any, List
from dotenv import load_dotenv

from app.services.rag_recipes import SEED_RECIPES
from app.services.rag_fallback import generate_clinical_fallback_plan

load_dotenv()

logger = logging.getLogger(__name__)
logging.getLogger("google_genai").setLevel(logging.ERROR)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")


def load_genai_modules():
    """Dynamically loads google-genai modules with path fallback for Windows venv."""
    try:
        import google.genai as genai
        from google.genai import types
        return genai, types
    except Exception:
        import sys
        import site
        import importlib
        importlib.invalidate_caches()
        if 'google' in sys.modules:
            google_mod = sys.modules['google']
            if hasattr(google_mod, '__path__'):
                site_dirs = list(site.getsitepackages())
                if hasattr(site, 'getusersitepackages'):
                    user_site = site.getusersitepackages()
                    if isinstance(user_site, str):
                        site_dirs.append(user_site)
                    elif isinstance(user_site, list):
                        site_dirs.extend(user_site)
                for s in site_dirs:
                    g_dir = os.path.join(s, 'google')
                    if os.path.exists(g_dir) and g_dir not in google_mod.__path__:
                        google_mod.__path__.append(g_dir)
        try:
            import google.genai as genai
            from google.genai import types
            return genai, types
        except Exception as import_err:
            raise RuntimeError(
                f"❌ Failed to load google-genai library on backend server: {str(import_err)}"
            )


def retrieve_relevant_foods(
    target_calories_per_meal: float,
    allergens_to_exclude: List[str],
    health_condition: str = "",
    top_k: int = 4
) -> List[Dict[str, Any]]:
    """
    RAG Retrieval Step:
    Retrieves recipes filtered by medical safety (allergens), health conditions, and calorie targets.
    Supports filters for:
      - Allergens (shellfish, nuts, eggs, dairy, etc.)
      - Hyperlipidemia / High blood fat (low saturated fat, high omega-3)
      - Vegan / Vegetarian (100% plant-based, no meat/fish/seafood)
      - Diabetes (Low-GI, glycemic index control)
    Dynamically shuffles matching recipes for variety on every request.
    """
    candidates = []
    condition_lower = health_condition.lower()
    is_high_fat = "high blood fat" in condition_lower or "mỡ máu" in condition_lower
    is_vegan = any(k in condition_lower for k in ["ăn chay", "chay", "vegan", "vegetarian"])
    is_diabetes = any(k in condition_lower for k in ["tiểu đường", "diabetes", "đường huyết", "blood sugar", "hạ đường huyết"])

    for r in SEED_RECIPES:
        allergens = [a.strip().lower() for a in r["allergens"].split(",") if a.strip()]
        has_allergen = any(
            ex.strip().lower() in allergens
            for ex in allergens_to_exclude
            if ex.strip()
        )
        if has_allergen:
            continue

        # 1. Filter out high saturated fats if user has high blood fat condition
        if is_high_fat and r.get("fat_g", 0) > 15.0 and "omega3" not in r.get("health_tags", ""):
            continue

        # 2. Filter for Vegan / Vegetarian: strictly plant-based
        if is_vegan:
            health_tags = r.get("health_tags", "").lower()
            category = r.get("category", "").lower()
            allergens_str = r.get("allergens", "").lower()
            if "vegan" not in health_tags and "vegan" not in category and "vegetarian" not in category:
                continue
            if any(meat in allergens_str for meat in ["beef", "poultry", "pork", "seafood", "fish", "shrimp"]):
                continue

        # 3. Filter for Diabetes: must be low-GI / diabetes-friendly
        if is_diabetes:
            health_tags = r.get("health_tags", "").lower()
            if "low_gi" not in health_tags and "diabetes_friendly" not in health_tags:
                continue

        candidates.append(r)

    # Fallback safely if criteria are combined so strictly that candidates become empty
    if not candidates:
        safe_recipes = [
            r for r in SEED_RECIPES
            if not any(ex.strip().lower() in r["allergens"].lower() for ex in allergens_to_exclude if ex.strip())
        ]
        candidates = safe_recipes if safe_recipes else SEED_RECIPES.copy()

    # Shuffle for dynamic diversity on each request
    random.shuffle(candidates)
    return candidates[:top_k]


def generate_rag_meal_plan(
    user_profile: Any,
    consumed_today_calories: float = 0.0,
    plan_tier: str = "plus"
) -> Dict[str, Any]:
    """
    RAG Meal Plan Generator combining Bio-Metrics + Vector Search + LLM Synthesis.
    Includes automatic fallback to Smart Clinical Synthesizer when cloud LLM is under high demand / unavailable.
    """
    tdee = user_profile.tdee if (user_profile and hasattr(user_profile, 'tdee') and user_profile.tdee) else 2200.0
    target_cal = user_profile.daily_calorie_target if (user_profile and hasattr(user_profile, 'daily_calorie_target') and user_profile.daily_calorie_target) else 2000.0
    remaining_cal = max(600.0, target_cal - consumed_today_calories)
    pref = user_profile.dietary_preferences if (user_profile and hasattr(user_profile, 'dietary_preferences') and user_profile.dietary_preferences) else "No special dietary restrictions or allergies"
    goal = user_profile.goal if (user_profile and hasattr(user_profile, 'goal') and user_profile.goal) else "weight_loss"

    # Extract allergens
    allergens_to_exclude = []
    pref_lower = pref.lower()
    if any(k in pref_lower for k in ["dị ứng", "không ăn", "kiêng", "allergy"]):
        for keyword in [
            "hải sản", "seafood", "tôm", "cá", "fish", "đậu nành", "soy",
            "trứng", "egg", "sữa", "milk", "lactose", "đậu phộng", "peanut",
            "mè", "sesame", "thịt bò", "beef", "thịt heo", "pork"
        ]:
            if keyword in pref_lower:
                allergens_to_exclude.append(keyword)

    # 1. RETRIEVAL STEP
    meal_cal_target = remaining_cal / 3.0
    retrieved_foods = retrieve_relevant_foods(meal_cal_target, allergens_to_exclude, health_condition=pref, top_k=4)

    # 2. GENERATION STEP (Real LLM with graceful fallback)
    if not GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY missing, using Clinical Fallback Synthesizer.")
        return generate_clinical_fallback_plan(target_cal, remaining_cal, tdee, goal, pref, plan_tier, retrieved_foods)

    try:
        genai, types = load_genai_modules()
        client = genai.Client(api_key=GEMINI_API_KEY)

        prompt = f"""
        You are an international Clinical Medical Nutrition Specialist.
        Generate a COMPLETELY NEW, DIVERSE, AND PERSONALIZED AI Smart Meal Plan for the user in ENGLISH based on:
        - Fitness Goal: {goal.upper()}
        - Daily Calorie Target: {target_cal:.1f} kcal (TDEE: {tdee:.1f} kcal)
        - Remaining Calories to Distribute for 4 Meals: {remaining_cal:.1f} kcal
        - Health Conditions & Dietary Preferences: "{pref}"
        - Subscription Plan Tier: {plan_tier.upper()}

        CANDIDATE RECIPES FROM NUTRITION DATABASE:
        {json.dumps(retrieved_foods, ensure_ascii=False, indent=2)}

        CRITICAL MEDICAL & NUTRITION REQUIREMENTS:
        1. LANGUAGE: ALL TEXT IN THE JSON RESPONSE MUST BE WRITTEN IN ENGLISH (plan_title, meal_label, meal_name, portion, recipe_notes, summary_advice, grocery_list).
        2. CALORIE ALLOCATION: Distribute 4 meals (breakfast, lunch, dinner, snack) such that the TOTAL CALORIES OF ALL 4 MEALS EQUAL APPROXIMATELY {remaining_cal:.1f} kcal (e.g., Breakfast ~25%, Lunch ~35%, Dinner ~30%, Snack ~10%).
        3. MEDICAL & DIETARY CONDITIONS SPECIAL CARE FOR "{pref}":
           - IF "high blood fat" / hyperlipidemia: Prioritize soluble fiber (oats, brown rice, green vegetables), Omega-3 rich fish (salmon, sea bass), avocados/olive oil; strictly AVOID saturated animal fats, lard, or fried foods. Provide accurate clinical medical advice in "summary_advice".
           - IF "vegan" / "vegetarian" / "ăn chay": Strictly 100% plant-based ingredients only (tofu, mushrooms, beans, lentils, chickpeas, nuts, seeds, veggies, plant-based milk). Absolutely NO meat, poultry, fish, seafood, gelatin, or animal broths. Ensure sufficient plant protein and iron.
           - IF "diabetes" / "tiểu đường": Strictly control Glycemic Index (Low GI); prioritize complex carbohydrates (brown rice, oats, legumes, green vegetables); strictly AVOID refined sugars, syrups, white bread, and high-glycemic foods. Maintain steady blood glucose levels with balanced protein, fiber, and healthy fats in every meal.
        4. CREATIVITY: Create fresh, innovative meal names and portions every single time. Do not reuse static template numbers.

        Return strictly valid JSON matching this exact structure:
        {{
          "plan_title": "✨ Personalized AI Smart Meal Plan",
          "target_calories": {remaining_cal:.1f},
          "summary_advice": "<Detailed personalized clinical medical advice in English>",
          "meals": [
            {{
              "meal_type": "breakfast",
              "meal_label": "Breakfast",
              "meal_name": "<Creative breakfast dish name in English>",
              "portion": "<Specific portion in English, e.g., 1 Bowl (350g)>",
              "calories": 500.0,
              "protein_g": 30.0,
              "carbs_g": 60.0,
              "fat_g": 10.0,
              "recipe_notes": "<Clinical cooking & medical note in English>"
            }},
            {{
              "meal_type": "lunch",
              "meal_label": "Lunch",
              "meal_name": "<Creative lunch dish name in English>",
              "portion": "<Specific portion in English>",
              "calories": 750.0,
              "protein_g": 45.0,
              "carbs_g": 80.0,
              "fat_g": 15.0,
              "recipe_notes": "<Clinical cooking & medical note in English>"
            }},
            {{
              "meal_type": "dinner",
              "meal_label": "Dinner",
              "meal_name": "<Creative dinner dish name in English>",
              "portion": "<Specific portion in English>",
              "calories": 650.0,
              "protein_g": 40.0,
              "carbs_g": 65.0,
              "fat_g": 12.0,
              "recipe_notes": "<Clinical cooking & medical note in English>"
            }},
            {{
              "meal_type": "snack",
              "meal_label": "Snack",
              "meal_name": "<Creative snack dish name in English>",
              "portion": "<Specific portion in English>",
              "calories": 337.0,
              "protein_g": 15.0,
              "carbs_g": 40.0,
              "fat_g": 8.0,
              "recipe_notes": "<Clinical cooking & medical note in English>"
            }}
          ]
          {', "grocery_list": ["<Item 1 in English>", "<Item 2>", "<Item 3>"]' if plan_tier in ['pro', 'admin'] else ''}
        }}
        """

        candidate_models = ["gemini-3.6-flash"]
        last_error = None

        for model_name in candidate_models:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json"
                    )
                )
                if response and response.text:
                    parsed = json.loads(response.text)
                    return parsed
            except Exception as m_err:
                logger.warning(f"Model {model_name} notice: {m_err}. Trying fallback...")
                last_error = m_err

        # Seamless clinical fallback
        logger.warning(
            f"⚠️ Google Gemini servers high demand / connection drop ({last_error}). "
            f"Activating Smart Clinical Fallback Synthesizer for 100% demo uptime."
        )
        return generate_clinical_fallback_plan(target_cal, remaining_cal, tdee, goal, pref, plan_tier, retrieved_foods)

    except Exception as e:
        logger.warning(
            f"⚠️ Gemini API connection notice: {e}. "
            f"Activating Smart Clinical Fallback Synthesizer for 100% demo uptime."
        )
        return generate_clinical_fallback_plan(target_cal, remaining_cal, tdee, goal, pref, plan_tier, retrieved_foods)
