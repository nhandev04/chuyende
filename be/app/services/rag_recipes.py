"""
RAG Recipes Database
Contains clinical ground-truth nutritional recipes library.
Each recipe includes detailed macros (calories, protein, carbs, fat), allergens, and clinical tags.
"""
from typing import List, Dict, Any

SEED_RECIPES: List[Dict[str, Any]] = [
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
    },
    {
        "id": "recipe_13",
        "food_name": "Tofu & Edamame Quinoa Buddha Bowl with Steamed Bok Choy",
        "category": "Lunch / Vegan",
        "calories": 420.0,
        "protein_g": 26.0,
        "carbs_g": 48.0,
        "fat_g": 10.0,
        "allergens": "soy,sesame",
        "health_tags": "vegan,diabetes_friendly,low_gi,heart_healthy",
        "recipe_notes": "Rich in plant protein and slow-digesting complex carbs, perfect for steady blood glucose levels."
    },
    {
        "id": "recipe_14",
        "food_name": "Steamed Pumpkin, Chickpea & Spinach Coconut Curry Broth",
        "category": "Dinner / Vegan",
        "calories": 380.0,
        "protein_g": 18.0,
        "carbs_g": 52.0,
        "fat_g": 8.0,
        "allergens": "",
        "health_tags": "vegan,diabetes_friendly,low_gi,heart_healthy",
        "recipe_notes": "High fiber chickpeas and fresh pumpkin simmered in light coconut broth with minimal glycemic impact."
    },
    {
        "id": "recipe_15",
        "food_name": "Chia Seed & Unsweetened Soy Milk Pudding with Wild Blueberries",
        "category": "Breakfast / Light",
        "calories": 260.0,
        "protein_g": 16.0,
        "carbs_g": 24.0,
        "fat_g": 9.0,
        "allergens": "soy",
        "health_tags": "vegan,diabetes_friendly,low_gi,omega3",
        "recipe_notes": "Soluble fiber and antioxidant-rich breakfast ideal for low-glycemic blood sugar control."
    },
    {
        "id": "recipe_16",
        "food_name": "Bitter Melon & King Oyster Mushroom Stir-Fry with Brown Rice",
        "category": "Lunch / Main",
        "calories": 350.0,
        "protein_g": 15.0,
        "carbs_g": 50.0,
        "fat_g": 6.0,
        "allergens": "soy",
        "health_tags": "vegan,diabetes_friendly,low_gi,heart_healthy",
        "recipe_notes": "Bitter melon is clinically known for natural bioactive compounds supporting insulin sensitivity."
    }
]
