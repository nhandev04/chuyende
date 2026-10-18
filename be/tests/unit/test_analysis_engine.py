import pytest
from app.services.analysis_engine import (
    get_bmi_10_level_scale,
    compute_body_metrics,
    generate_diet_recommendations
)


def test_get_bmi_10_level_scale_levels():
    # Level 1: < 16.5 (Severely Underweight)
    res1 = get_bmi_10_level_scale(15.5)
    assert res1["bmi_level"] == 1
    assert "Severely Underweight" in res1["bmi_level_label"]

    # Level 3: 17.5 - 18.5 (Mildly Underweight)
    res3 = get_bmi_10_level_scale(18.0)
    assert res3["bmi_level"] == 3

    # Level 4: 18.5 - 20.5 (Normal - Slim Fit)
    res4 = get_bmi_10_level_scale(19.5)
    assert res4["bmi_level"] == 4
    assert res4["body_shape"] == "Slim Fit / Lean"

    # Level 5: 20.5 - 23.0 (Normal - Ideal Fit)
    res5_cut = get_bmi_10_level_scale(21.5, goal="weight_loss")
    assert res5_cut["bmi_level"] == 5
    assert res5_cut["body_shape"] == "Ideal Mesomorph"

    res5_bulk = get_bmi_10_level_scale(21.5, goal="muscle_gain")
    assert res5_bulk["bmi_level"] == 5
    assert res5_bulk["body_shape"] == "Fit / Athletic Ideal"

    # Level 8: 27.5 - 30.0 (Pre-Obese)
    res8 = get_bmi_10_level_scale(29.0)
    assert res8["bmi_level"] == 8

    # Level 10: >= 35.0 (Obese Class II / Severe)
    res10 = get_bmi_10_level_scale(38.0)
    assert res10["bmi_level"] == 10
    assert "Severe" in res10["bmi_level_label"]


def test_compute_body_metrics_male_vs_female():
    # 175cm, 70kg, 25 years old
    male = compute_body_metrics(
        height_cm=175.0,
        weight_kg=70.0,
        age=25,
        gender="male",
        goal="maintain"
    )
    female = compute_body_metrics(
        height_cm=175.0,
        weight_kg=70.0,
        age=25,
        gender="female",
        goal="maintain"
    )

    # Both have the same BMI = 70 / (1.75^2) = 22.9
    assert male["bmi"] == 22.9
    assert female["bmi"] == 22.9

    # Male BMR and TDEE should be higher than female for identical height/weight/age
    assert male["tdee"] > female["tdee"]

    # Female estimated body fat percentage should be higher than male
    assert female["estimated_body_fat_pct"] > male["estimated_body_fat_pct"]


def test_compute_body_metrics_clamping_limits():
    # Extremely small inputs should be clamped safely to prevent division by zero or negative values
    metrics = compute_body_metrics(
        height_cm=10.0,  # Below 50cm -> clamped to 50cm
        weight_kg=5.0,   # Below 20kg -> clamped to 20kg
        age=2,           # Below 10 -> clamped to 10
        gender="male",
        goal="weight_loss"
    )
    assert metrics["bmi"] > 0
    assert metrics["tdee"] > 0
    assert 5.0 <= metrics["estimated_body_fat_pct"] <= 50.0


def test_generate_diet_recommendations():
    rec = generate_diet_recommendations(
        consumed_calories=1500.0,
        target_calories=2000.0,
        goal="weight_loss",
        consumed_macros={"protein_g": 100.0, "carbs_g": 150.0, "fat_g": 40.0},
        dietary_preferences="No seafood"
    )
    assert rec["status"] == "on_track"
    assert rec["consumed_calories"] == 1500.0
    assert rec["target_calories"] == 2000.0
    assert rec["remaining_calories"] == 500.0
    assert "advice" in rec
    assert "suggested_meals" in rec
    assert len(rec["suggested_meals"]) > 0
