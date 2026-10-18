from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_fe_login_and_auth_me_schema():
    # 1. Login
    res = client.post("/api/v1/auth/login", json={
        "email": "demouser@uit.edu.vn",
        "password": "123456"
    })
    assert res.status_code == 200
    user = res.json()
    # Ensure keys required by FE User interface
    assert "user_id" in user
    assert "email" in user
    assert "full_name" in user
    assert "role" in user
    assert "plan" in user
    assert "access_token" in user
    assert "auth_provider" in user

    token = user["access_token"]
    user_id = user["user_id"]

    # 2. GET /auth/me
    res_me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res_me.status_code == 200
    me = res_me.json()
    assert me["user_id"] == user_id
    assert "email" in me
    assert "full_name" in me
    assert "role" in me
    assert "plan" in me


def test_fe_nutrition_summary_contract():
    # Log in
    res = client.post("/api/v1/auth/login", json={
        "email": "demouser@uit.edu.vn",
        "password": "123456"
    })
    token = res.json()["access_token"]
    user_id = res.json()["user_id"]

    # GET /food-logs/{userId}/summary
    res_summary = client.get(f"/api/v1/food-logs/{user_id}/summary", headers={"Authorization": f"Bearer {token}"})
    assert res_summary.status_code == 200
    summary = res_summary.json()

    # Verify Frontend NutritionSummary structure
    assert "daily" in summary
    assert "weekly_chart" in summary
    assert "monthly_chart" in summary

    daily = summary["daily"]
    expected_daily_keys = [
        "consumed_calories", "target_calories", "remaining_calories",
        "protein_g", "protein_target_g", "carbs_g", "carbs_target_g", "fat_g", "fat_target_g"
    ]
    for key in expected_daily_keys:
        assert key in daily, f"Missing key '{key}' in daily summary"

    assert len(summary["weekly_chart"]) == 7
    for item in summary["weekly_chart"]:
        assert "day" in item
        assert "date" in item
        assert "calories" in item
        assert "target" in item

    assert len(summary["monthly_chart"]) == 4
    for item in summary["monthly_chart"]:
        assert "week" in item
        assert "avg_calories" in item
        assert "avg_weight" in item


def test_fe_profile_contract():
    # Log in
    res = client.post("/api/v1/auth/login", json={
        "email": "demouser@uit.edu.vn",
        "password": "123456"
    })
    token = res.json()["access_token"]
    user_id = res.json()["user_id"]

    # GET /profile/{userId}
    res_prof = client.get(f"/api/v1/profile/{user_id}", headers={"Authorization": f"Bearer {token}"})
    assert res_prof.status_code == 200
    prof = res_prof.json()

    # Verify Frontend UserProfile structure
    expected_profile_keys = [
        "user_id", "height_cm", "current_weight_kg", "target_weight_kg",
        "age", "gender", "activity_level", "goal", "daily_calorie_target",
        "bmi", "tdee", "body_shape"
    ]
    for key in expected_profile_keys:
        assert key in prof, f"Missing key '{key}' in profile"


def test_fe_admin_stats_and_foods_contract():
    # Log in as admin
    res = client.post("/api/v1/auth/login", json={
        "email": "admin@uit.edu.vn",
        "password": "admin123"
    })
    token = res.json()["access_token"]

    # 1. Admin Stats
    res_stats = client.get("/api/v1/admin/stats", headers={"Authorization": f"Bearer {token}"})
    assert res_stats.status_code == 200
    stats = res_stats.json()
    assert "total_users" in stats
    assert "alert_users_count" in stats
    assert "pending_ai_reports" in stats
    assert "total_food_items" in stats

    # 2. Admin Foods
    res_foods = client.get("/api/v1/admin/foods", headers={"Authorization": f"Bearer {token}"})
    assert res_foods.status_code == 200
    foods = res_foods.json()
    assert isinstance(foods, list)
    if foods:
        sample = foods[0]
        assert "id" in sample
        assert "food_name" in sample
        assert "category" in sample
        assert "calories_per_100g" in sample
        assert "protein_per_100g" in sample
        assert "carbs_per_100g" in sample
        assert "fat_per_100g" in sample
