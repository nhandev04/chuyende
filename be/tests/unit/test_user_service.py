from unittest.mock import MagicMock
from app.db.models import UserProfile, WeightLog
from app.schemas.schemas import UserProfileUpdate, WeightLogCreate
from app.services.user_service import UserService


def test_user_service_get_profile_existing():
    mock_db = MagicMock()
    service = UserService(mock_db)

    existing = UserProfile(user_id=1, height_cm=175.0, current_weight_kg=70.0)
    service.user_repo.get_profile = MagicMock(return_value=existing)

    profile = service.get_profile(1)
    assert profile.user_id == 1
    assert profile.height_cm == 175.0


def test_user_service_get_profile_creates_default_when_missing():
    mock_db = MagicMock()
    service = UserService(mock_db)

    service.user_repo.get_profile = MagicMock(return_value=None)
    service.user_repo.create_profile = MagicMock(side_effect=lambda p: p)

    profile = service.get_profile(2)
    assert profile.user_id == 2
    assert profile.height_cm == 170.0
    assert profile.current_weight_kg == 65.0
    assert profile.daily_calorie_target > 0


def test_user_service_update_profile_recalculates_metrics():
    mock_db = MagicMock()
    service = UserService(mock_db)

    current_profile = UserProfile(
        user_id=3,
        height_cm=170.0,
        current_weight_kg=70.0,
        age=25,
        gender="male",
        goal="weight_loss"
    )
    service.user_repo.get_profile = MagicMock(return_value=current_profile)
    service.user_repo.update_profile = MagicMock(side_effect=lambda p: p)

    # User updates weight to 65kg with muscle_gain goal
    update_payload = UserProfileUpdate(
        current_weight_kg=65.0,
        goal="muscle_gain"
    )

    updated = service.update_profile(3, update_payload)
    assert updated.current_weight_kg == 65.0
    assert updated.goal == "muscle_gain"
    # For muscle gain, calorie target is surplus (TDEE + 300)
    assert updated.daily_calorie_target == round(updated.tdee + 300, 0)


def test_user_service_record_weight_updates_profile():
    mock_db = MagicMock()
    service = UserService(mock_db)

    current_profile = UserProfile(
        user_id=4,
        height_cm=175.0,
        current_weight_kg=80.0,
        age=30,
        gender="male",
        goal="weight_loss"
    )
    service.user_repo.get_profile = MagicMock(return_value=current_profile)
    service.user_repo.update_profile = MagicMock(side_effect=lambda p: p)
    service.weight_repo.create = MagicMock(side_effect=lambda w: w)

    weight_in = WeightLogCreate(weight_kg=78.5)
    log = service.record_weight(4, weight_in)

    assert log.weight_kg == 78.5
    assert current_profile.current_weight_kg == 78.5
    # Recalculated BMI should reflect 78.5kg
    expected_bmi = round(78.5 / (1.75 * 1.75), 1)
    assert current_profile.bmi == expected_bmi
    # Weight loss calorie target = TDEE - 400
    assert current_profile.daily_calorie_target == round(current_profile.tdee - 400, 0)
