from datetime import datetime, date, timezone, timedelta
from unittest.mock import MagicMock
import pytest
from fastapi import HTTPException

from app.db.models import FoodLog, User, UserProfile, WeightLog
from app.schemas.schemas import FoodLogCreate
from app.services.food_service import FoodService


def test_food_service_create_log():
    mock_db = MagicMock()
    service = FoodService(mock_db)

    # Mock food_repo.create
    created_log = FoodLog(
        id=1,
        user_id=5,
        meal_type="lunch",
        food_name="Grilled Salmon Salad",
        weight_g=250.0,
        calories=350.0,
        protein_g=35.0,
        carbs_g=10.0,
        fat_g=15.0,
        confidence_score=0.95,
        logged_at=datetime.now(timezone.utc)
    )

    service.food_repo.create = MagicMock(return_value=created_log)

    payload = FoodLogCreate(
        meal_type="lunch",
        food_name="Grilled Salmon Salad",
        weight_g=250.0,
        calories=350.0,
        protein_g=35.0,
        carbs_g=10.0,
        fat_g=15.0
    )

    result = service.create_log(user_id=5, log_in=payload)
    assert result.id == 1
    assert result.user_id == 5
    assert result.calories == 350.0
    service.food_repo.create.assert_called_once()


def test_food_service_delete_log_owner_success():
    mock_db = MagicMock()
    service = FoodService(mock_db)

    existing_log = FoodLog(id=10, user_id=5)
    service.food_repo.get_by_id = MagicMock(return_value=existing_log)
    service.food_repo.delete = MagicMock()

    owner = User(id=5, role="user")
    service.delete_log(log_id=10, current_user=owner)
    service.food_repo.delete.assert_called_once_with(existing_log)


def test_food_service_delete_log_admin_success():
    mock_db = MagicMock()
    service = FoodService(mock_db)

    existing_log = FoodLog(id=10, user_id=5)
    service.food_repo.get_by_id = MagicMock(return_value=existing_log)
    service.food_repo.delete = MagicMock()

    admin = User(id=99, role="admin")
    service.delete_log(log_id=10, current_user=admin)
    service.food_repo.delete.assert_called_once_with(existing_log)


def test_food_service_delete_log_unauthorized_raises_403():
    mock_db = MagicMock()
    service = FoodService(mock_db)

    existing_log = FoodLog(id=10, user_id=5)
    service.food_repo.get_by_id = MagicMock(return_value=existing_log)

    other_user = User(id=77, role="user")
    with pytest.raises(HTTPException) as exc_info:
        service.delete_log(log_id=10, current_user=other_user)
    assert exc_info.value.status_code == 403


def test_food_service_delete_log_not_found_raises_404():
    mock_db = MagicMock()
    service = FoodService(mock_db)

    service.food_repo.get_by_id = MagicMock(return_value=None)
    owner = User(id=5, role="user")
    with pytest.raises(HTTPException) as exc_info:
        service.delete_log(log_id=999, current_user=owner)
    assert exc_info.value.status_code == 404


def test_food_service_nutrition_summary():
    mock_db = MagicMock()
    service = FoodService(mock_db)

    # Mock user profile
    profile = UserProfile(user_id=5, daily_calorie_target=2200.0, current_weight_kg=68.0)
    service.user_repo.get_profile = MagicMock(return_value=profile)

    # Mock today's logs: 2 meals (total 1000 kcal, 60g protein, 100g carbs, 30g fat)
    today_logs = [
        FoodLog(calories=400.0, protein_g=25.0, carbs_g=50.0, fat_g=10.0),
        FoodLog(calories=600.0, protein_g=35.0, carbs_g=50.0, fat_g=20.0),
    ]
    service.food_repo.get_user_logs_between = MagicMock(return_value=today_logs)

    summary = service.get_nutrition_summary(user_id=5)

    assert summary["daily"]["consumed_calories"] == 1000.0
    assert summary["daily"]["target_calories"] == 2200.0
    assert summary["daily"]["remaining_calories"] == 1200.0
    assert summary["daily"]["protein_g"] == 60.0
    assert summary["daily"]["carbs_g"] == 100.0
    assert summary["daily"]["fat_g"] == 30.0

    # Weekly chart has 7 days
    assert len(summary["weekly_chart"]) == 7
    # Monthly chart has 4 weeks
    assert len(summary["monthly_chart"]) == 4


def test_food_service_monthly_chart_real_calculation():
    mock_db = MagicMock()
    service = FoodService(mock_db)

    # Mock user profile
    profile = UserProfile(user_id=1, daily_calorie_target=2000.0, current_weight_kg=70.0)
    service.user_repo.get_profile = MagicMock(return_value=profile)

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    # Mock weight logs: 72kg 25 days ago (Week 1), 69kg 3 days ago (Week 4)
    w1 = WeightLog(weight_kg=72.0, recorded_at=now - timedelta(days=25))
    w4 = WeightLog(weight_kg=69.0, recorded_at=now - timedelta(days=3))
    service.weight_repo.get_by_user = MagicMock(return_value=[w4, w1])

    # Mock food logs per interval:
    def fake_logs_between(user_id, start_dt, end_dt):
        # If in Week 4 (last 6 days)
        if start_dt <= (now - timedelta(days=2)) <= end_dt:
            return [
                FoodLog(calories=1800.0, logged_at=now - timedelta(days=2)),
                FoodLog(calories=2200.0, logged_at=now - timedelta(days=1)),
            ]
        # If in Week 1 (27..21 days ago)
        if start_dt <= (now - timedelta(days=24)) <= end_dt:
            return [
                FoodLog(calories=2100.0, logged_at=now - timedelta(days=24))
            ]
        return []

    service.food_repo.get_user_logs_between = MagicMock(side_effect=fake_logs_between)

    summary = service.get_nutrition_summary(user_id=1)
    monthly = summary["monthly_chart"]

    assert len(monthly) == 4
    # Week 1
    assert monthly[0]["week"] == "Week 1"
    assert monthly[0]["avg_calories"] == 2100.0
    assert monthly[0]["avg_weight"] == 72.0

    # Week 2 (no food logs, carries over week 1 weight of 72.0)
    assert monthly[1]["week"] == "Week 2"
    assert monthly[1]["avg_calories"] == 0.0
    assert monthly[1]["avg_weight"] == 72.0

    # Week 3 (no food logs, carries over week 1 weight of 72.0)
    assert monthly[2]["week"] == "Week 3"
    assert monthly[2]["avg_calories"] == 0.0
    assert monthly[2]["avg_weight"] == 72.0

    # Week 4 (2 days logged: 1800 + 2200 => average 2000.0, weight logged in Week 4 is 69.0)
    assert monthly[3]["week"] == "Week 4"
    assert monthly[3]["avg_calories"] == 2000.0
    assert monthly[3]["avg_weight"] == 69.0
