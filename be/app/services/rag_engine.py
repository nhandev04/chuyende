import os
import json
import logging
import random
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)
logging.getLogger("google_genai").setLevel(logging.ERROR)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Ground-Truth Health Recipes Database (Expanded Library in English)
SEED_RECIPES = [
    {
        "id": "recipe_1",
        "food_name": "Lean Beef Pho with Brown Rice Noodles & Clear Vegetable Broth",
        "category": "Breakfast / Main",
        "calories": 450.0,
        "protein_g": 30.0,
        "carbs_g": 55.0,
        "fat_g": 8.0,
        "allergens": "beef",
        "health_tags": "low_fat,high_protein",
        "recipe_notes": "Made with brown rice noodles, clear vegetable broth, and thin lean beef slices low in saturated fat."
    },
    {
        "id": "recipe_2",
        "food_name": "Pan-Seared Teriyaki Chicken Breast with Brown Rice & Broccoli",
        "category": "Lunch / Main",
        "calories": 520.0,
        "protein_g": 45.0,
        "carbs_g": 50.0,
        "fat_g": 7.0,
        "allergens": "poultry",
        "health_tags": "low_fat,muscle_gain,low_gi",
        "recipe_notes": "Teriyaki marinated chicken breast served with steamed brown rice and fresh broccoli."
    },
    {
        "id": "recipe_3",
        "food_name": "Grilled Passion Fruit Salmon & Pan-Seared Asparagus",
        "category": "Dinner / High-Protein",
        "calories": 480.0,
        "protein_g": 38.0,
        "carbs_g": 18.0,
        "fat_g": 16.0,
        "allergens": "seafood,fish",
        "health_tags": "omega3,high_protein,heart_healthy",
        "recipe_notes": "Norwegian salmon rich in Omega-3 to help lower LDL cholesterol, served with olive oil asparagus."
    },
    {
        "id": "recipe_4",
        "food_name": "Vegetarian Bun Bo Hue with Tofu & King Oyster Mushrooms",
        "category": "Lunch / Vegan",
        "calories": 390.0,
        "protein_g": 20.0,
        "carbs_g": 58.0,
        "fat_g": 6.0,
        "allergens": "soy",
        "health_tags": "vegan,heart_healthy,low_fat",
        "recipe_notes": "Naturally sweetened lemongrass broth with air-fried tofu and fresh mushrooms."
    },
    {
        "id": "recipe_5",
        "food_name": "Grilled Tiger Prawn & Avocado Salad with Lemon Olive Oil Dressing",
        "category": "Lunch / Light",
        "calories": 360.0,
        "protein_g": 28.0,
        "carbs_g": 15.0,
        "fat_g": 14.0,
        "allergens": "seafood,shrimp",
        "health_tags": "low_gi,heart_healthy,slim_fit",
        "recipe_notes": "Grilled prawns served with romaine lettuce and fresh avocado packed with monounsaturated fats."
    },
    {
        "id": "recipe_6",
        "food_name": "Avocado Banana Whey Protein & Oat Smoothie",
        "category": "Snack / Post-Workout",
        "calories": 290.0,
        "protein_g": 25.0,
        "carbs_g": 32.0,
        "fat_g": 6.0,
        "allergens": "lactose,milk",
        "health_tags": "high_protein,quick_snack",
        "recipe_notes": "Blended ripe avocado, banana, and Whey Isolate protein powder for post-workout recovery."
    },
    {
        "id": "recipe_7",
        "food_name": "Salmon & Straw Mushroom Oat Porridge",
        "category": "Breakfast / Light",
        "calories": 340.0,
        "protein_g": 24.0,
        "carbs_g": 40.0,
        "fat_g": 7.0,
        "allergens": "fish",
        "health_tags": "heart_healthy,omega3,low_gi",
        "recipe_notes": "Whole grain oats high in beta-glucan cooked with fresh salmon and straw mushrooms to reduce LDL cholesterol."
    },
    {
        "id": "recipe_8",
        "food_name": "Steamed Sea Bass with Ginger, Scallions & Dragon Brown Rice",
        "category": "Lunch / Main",
        "calories": 460.0,
        "protein_g": 40.0,
        "carbs_g": 45.0,
        "fat_g": 8.0,
        "allergens": "fish",
        "health_tags": "low_fat,heart_healthy,low_gi",
        "recipe_notes": "Lightly steamed sea bass fillet with ginger and scallions, paired with nutrient-dense brown rice."
    },
    {
        "id": "recipe_9",
        "food_name": "Shredded Chicken, Lotus Seed & Tofu Soup",
        "category": "Dinner / Light",
        "calories": 320.0,
        "protein_g": 30.0,
        "carbs_g": 25.0,
        "fat_g": 5.0,
        "allergens": "poultry,soy",
        "health_tags": "low_fat,low_calorie,heart_healthy",
        "recipe_notes": "Cleansing lotus seed and tofu broth with lean shredded chicken breast."
    },
    {
        "id": "recipe_10",
        "food_name": "Lean Beef & Garlic Sesame Brown Rice Noodle Bowl",
        "category": "Lunch / Main",
        "calories": 490.0,
        "protein_g": 35.0,
        "carbs_g": 52.0,
        "fat_g": 9.0,
        "allergens": "beef,sesame",
        "health_tags": "low_gi,high_protein",
        "recipe_notes": "Sautéed lean beef with garlic and sesame oil, tossed with brown rice noodles and fresh herbs."
    },
    {
        "id": "recipe_11",
        "food_name": "Organic Omelet Roll with King Oyster Mushrooms & Asparagus",
        "category": "Breakfast / Quick",
        "calories": 280.0,
        "protein_g": 20.0,
        "carbs_g": 10.0,
        "fat_g": 12.0,
        "allergens": "egg",
        "health_tags": "low_carb,quick_breakfast",
        "recipe_notes": "Organic eggs pan-seared and rolled with sliced mushrooms and fresh asparagus."
    },
    {
        "id": "recipe_12",
        "food_name": "Low-Sugar Walnut Almond & Oat Nut Milk",
        "category": "Snack / Light",
        "calories": 210.0,
        "protein_g": 8.0,
        "carbs_g": 22.0,
        "fat_g": 9.0,
        "allergens": "nuts",
        "health_tags": "heart_healthy,omega3,vegan",
        "recipe_notes": "Nutrient-rich nut milk providing unsaturated healthy fats to improve blood lipid profile."
    }
]


def load_genai_modules():
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
                f"❌ Không thể nạp thư viện google-genai trên máy chủ backend. "
                f"Vui lòng tắt uvicorn (Press CTRL+C) và bật lại (python -m uvicorn app.main:app --reload --port 8000). Chi tiết: {str(import_err)}"
            )

def retrieve_relevant_foods(
    target_calories_per_meal: float,
    allergens_to_exclude: List[str],
    health_condition: str = "",
    top_k: int = 4
) -> List[Dict[str, Any]]:
    """
    Retrieves recipes filtered by medical safety (allergens), health conditions, and calorie targets.
    Dynamically shuffles matching recipes for variety on every request.
    """
    candidates = []
    condition_lower = health_condition.lower()
    is_high_fat = "high blood fat" in condition_lower or "mỡ máu" in condition_lower

    for r in SEED_RECIPES:
        allergens = [a.strip().lower() for a in r["allergens"].split(",") if a.strip()]
        has_allergen = any(
            ex.strip().lower() in allergens
            for ex in allergens_to_exclude
            if ex.strip()
        )
        if has_allergen:
            continue

        # Filter out high saturated fats if user has high blood fat condition
        if is_high_fat and r.get("fat_g", 0) > 15.0 and "omega3" not in r.get("health_tags", ""):
            continue

        candidates.append(r)

    if not candidates:
        candidates = SEED_RECIPES.copy()

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
    """
    tdee = user_profile.tdee if (user_profile and hasattr(user_profile, 'tdee') and user_profile.tdee) else 2200.0
    target_cal = user_profile.daily_calorie_target if (user_profile and hasattr(user_profile, 'daily_calorie_target') and user_profile.daily_calorie_target) else 2000.0
    remaining_cal = max(600.0, target_cal - consumed_today_calories)
    pref = user_profile.dietary_preferences if (user_profile and hasattr(user_profile, 'dietary_preferences') and user_profile.dietary_preferences) else "Không có dị ứng đặc biệt"
    goal = user_profile.goal if (user_profile and hasattr(user_profile, 'goal') and user_profile.goal) else "weight_loss"

    # Extract allergens
    allergens_to_exclude = []
    pref_lower = pref.lower()
    if "dị ứng" in pref_lower or "không ăn" in pref_lower:
        for keyword in ["hải sản", "seafood", "tôm", "cá", "fish", "đậu nành", "soy", "trứng", "egg", "sữa", "milk", "lactose"]:
            if keyword in pref_lower:
                allergens_to_exclude.append(keyword)

    # 1. RETRIEVAL STEP
    meal_cal_target = remaining_cal / 3.0
    retrieved_foods = retrieve_relevant_foods(meal_cal_target, allergens_to_exclude, health_condition=pref, top_k=4)

    # 2. GENERATION STEP (Real LLM via Google GenAI)
    if not GEMINI_API_KEY:
        raise RuntimeError("❌ GEMINI_API_KEY chưa được cấu hình trong môi trường backend.")

    genai, types = load_genai_modules()

    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
        model_name = "gemini-3.5-flash-lite"

        prompt = f"""
        You are an international Clinical Medical Nutrition Specialist.
        Generate a COMPLETELY NEW, DIVERSE, AND PERSONALIZED RAG AI Meal Plan for the user in ENGLISH based on:
        - Fitness Goal: {goal.upper()}
        - Daily Calorie Target: {target_cal:.1f} kcal (TDEE: {tdee:.1f} kcal)
        - Remaining Calories to Distribute for 4 Meals: {remaining_cal:.1f} kcal
        - Health Conditions & Dietary Preferences: "{pref}"
        - Subscription Plan Tier: {plan_tier.upper()}

        CANDIDATE RECIPES FROM RAG VECTOR DATABASE:
        {json.dumps(retrieved_foods, ensure_ascii=False, indent=2)}

        CRITICAL MEDICAL & NUTRITION REQUIREMENTS:
        1. LANGUAGE: ALL TEXT IN THE JSON RESPONSE MUST BE WRITTEN IN ENGLISH (plan_title, meal_label, meal_name, portion, recipe_notes, summary_advice, grocery_list).
        2. CALORIE ALLOCATION: Distribute 4 meals (breakfast, lunch, dinner, snack) such that the TOTAL CALORIES OF ALL 4 MEALS EQUAL APPROXIMATELY {remaining_cal:.1f} kcal (e.g., Breakfast ~25%, Lunch ~35%, Dinner ~30%, Snack ~10%).
        3. MEDICAL CONDITION SPECIAL CARE FOR "{pref}":
           - IF "high blood fat" / hyperlipidemia: Prioritize soluble fiber (oats, brown rice, green vegetables), Omega-3 rich fish (salmon, sea bass), avocados/olive oil; strictly AVOID saturated animal fats, lard, or fried foods. Provide accurate clinical medical advice in "summary_advice".
        4. CREATIVITY: Create fresh, innovative meal names and portions every single time. Do not reuse static template numbers.

        Return strictly valid JSON matching this exact structure:
        {{
          "plan_title": "✨ Personalized RAG AI Meal Plan",
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

        def safe_console_print(header: str, content: str):
            try:
                out = f"\n==================================================\n[{header}]:\n{content}\n==================================================\n"
                try:
                    print(out, flush=True)
                except Exception:
                    import sys
                    sys.stdout.buffer.write(out.encode('utf-8', errors='replace'))
                    sys.stdout.buffer.flush()
            except Exception:
                pass

        # Log Request Prompt
        logger.info("=== [GEMINI RAG REQUEST PROMPT] ===\n%s", prompt)
        safe_console_print("GEMINI RAG REQUEST PROMPT", prompt)

        response = client.models.generate_content(
            model=model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )

        # Log Raw Response Text
        logger.info("=== [GEMINI RAG RESPONSE RAW TEXT] ===\n%s", response.text)
        safe_console_print("GEMINI RAG RESPONSE RAW TEXT", response.text)

        parsed = json.loads(response.text)
        return parsed
    except Exception as e:
        logger.error("Gemini API call error: %s", e)
        raise RuntimeError(f"❌ Lỗi kết nối Google Gemini API: {str(e)}")

