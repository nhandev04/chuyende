import os
import shutil
import json
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form

from sqlalchemy.orm import Session
from typing import Optional
from app.db.database import get_db
from app.db.models import User, UserProfile, FoodLog, AIReport
from app.schemas.schemas import AIAnalysisResult, AIReportCreate
from app.services.real_ai import analyze_food_with_best_pt
from app.services.analysis_engine import generate_diet_recommendations
from app.services.daily_meal_service import generate_pro_daily_meal_plan

router = APIRouter(prefix="/api/v1/ai", tags=["AI Engine"])

TEMP_DIR = "temp_uploads"
os.makedirs(TEMP_DIR, exist_ok=True)

@router.post("/analyze-food", response_model=AIAnalysisResult)
def analyze_food(
    text_prompt: Optional[str] = Form(None),
    user_id: Optional[int] = Form(None),
    food_image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """
    AI Food Analyzer endpoint:
    Processes uploaded food image via YOLO (app/models/best.pt) or natural text prompt.
    Requires user to have 'plus' or 'pro' plan or 'admin' role.
    """
    # Plan validation
    if user_id:
        user = db.query(User).filter(User.id == user_id).first()
        if user and user.role != "admin" and user.plan not in ["plus", "pro"]:
            raise HTTPException(
                status_code=403,
                detail="🔒 AI Food Image Scanning requires Plus or Pro tier. Please upgrade your subscription to unlock."
            )

    # Validate input
    if not food_image and not text_prompt:
        raise HTTPException(
            status_code=400,
            detail="Please provide a food image or describe the food name"
        )
    
    temp_path = None
    try:
        if food_image and food_image.filename:
            temp_path = os.path.join(TEMP_DIR, f"scan_{food_image.filename}")
            with open(temp_path, "wb") as buffer:
                shutil.copyfileobj(food_image.file, buffer)

        # Analyze food using YOLO
        res = analyze_food_with_best_pt(image_path=temp_path, text_prompt=text_prompt)
        
        # If detection failed, return 400 error
        if res is None:
            raise HTTPException(
                status_code=400,
                detail="❌ Unable to recognize food in image. Please provide a clearer photo or enter food name."
            )
        
        cloudinary_url = None
        if temp_path:
            from app.services.cloudinary_service import upload_image_to_cloudinary
            cloudinary_url = upload_image_to_cloudinary(temp_path, folder="health_lens_ai/food_scans")


        return AIAnalysisResult(
            food_name=res["food_name"],
            estimated_weight_g=res["estimated_weight_g"],
            calories=res["calories"],
            protein_g=res["protein_g"],
            carbs_g=res["carbs_g"],
            fat_g=res["fat_g"],
            confidence_score=res["confidence_score"],
            detected_items=res["detected_items"],
            advice=res.get("advice"),
            image_url=cloudinary_url
        )

    finally:
        # Clean up temporary uploaded image file safely
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass

@router.get("/daily-meal-recommendations/{user_id}")
def get_pro_daily_meal_recommendations(user_id: int, db: Session = Depends(get_db)):
    """
    Pro Plan exclusive feature: Generates personalized daily meal plan (Breakfast, Lunch, Dinner, Snack).
    """
    user = db.query(User).filter(User.id == user_id).first()
    if user and user.role != "admin" and user.plan != "pro":
        raise HTTPException(
            status_code=403,
            detail="🔒 'Daily Meal Recommendation' feature is exclusive to Pro tier users. Please upgrade to Pro tier to unlock."
        )

    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    try:
        return generate_pro_daily_meal_plan(profile, db)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

@router.get("/recommendations/{user_id}")
def get_diet_recommendation(user_id: int, db: Session = Depends(get_db)):

    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    target_cal = profile.daily_calorie_target if profile else 2000.0
    goal = profile.goal if profile else "weight_loss"
    pref = profile.dietary_preferences if profile else ""

    from datetime import datetime
    today_start = datetime.combine(datetime.utcnow().date(), datetime.min.time())
    today_logs = db.query(FoodLog).filter(
        FoodLog.user_id == user_id,
        FoodLog.logged_at >= today_start
    ).all()
    consumed_cal = sum(l.calories for l in today_logs)
    consumed_macros = {
        "protein_g": sum(l.protein_g for l in today_logs),
        "carbs_g": sum(l.carbs_g for l in today_logs),
        "fat_g": sum(l.fat_g for l in today_logs)
    }

    return generate_diet_recommendations(
        consumed_calories=consumed_cal,
        target_calories=target_cal,
        goal=goal,
        consumed_macros=consumed_macros,
        dietary_preferences=pref
    )

@router.post("/report/{user_id}")
def create_ai_report(user_id: int, report_in: AIReportCreate, db: Session = Depends(get_db)):
    report = AIReport(
        user_id=user_id,
        food_log_id=report_in.food_log_id,
        original_prediction=report_in.original_prediction,
        user_correction=report_in.user_correction,
        status="pending"
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return {"message": "Thank you for submitting your feedback! Data will be used to improve AI model accuracy.", "report_id": report.id}


# --- RAG AI SMART MEAL PLANNER ENDPOINTS ---
from app.services.rag_engine import generate_rag_meal_plan
from app.db.models import RAGMealPlan, User, UserProfile, FoodLog

@router.post("/rag-meal-plan/{user_id}")
def create_rag_meal_plan(user_id: int, db: Session = Depends(get_db)):
    """
    RAG Smart Nutrition Feature: Generates personalized meal plan based on vector search & Gemini API.
    Available to Plus and Pro tier users.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Tier access control
    if user.role != "admin" and user.plan not in ["plus", "pro"]:
        raise HTTPException(
            status_code=403,
            detail="🔒 'AI Smart Meal Planner' feature requires Plus or Pro subscription tier."
        )

    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()

    # Consumed calories today
    from datetime import datetime
    today_start = datetime.combine(datetime.utcnow().date(), datetime.min.time())
    today_logs = db.query(FoodLog).filter(
        FoodLog.user_id == user_id,
        FoodLog.logged_at >= today_start
    ).all()
    consumed_today = sum(l.calories for l in today_logs)

    plan_tier = user.plan if user.role != "admin" else "pro"
    try:
        rag_res = generate_rag_meal_plan(profile, consumed_today, plan_tier)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

    # Save to database
    db_plan = RAGMealPlan(
        user_id=user_id,
        plan_tier=plan_tier,
        target_calories=rag_res.get("target_calories", 2000.0),
        plan_title=rag_res.get("plan_title", "Personalized AI Smart Meal Plan"),
        summary_advice=rag_res.get("summary_advice", ""),
        meal_data=json.dumps(rag_res.get("meals", []), ensure_ascii=False),
        grocery_list=json.dumps(rag_res.get("grocery_list", []), ensure_ascii=False)
    )
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)

    return rag_res


@router.get("/rag-meal-plan/{user_id}/latest")
def get_latest_rag_meal_plan(user_id: int, db: Session = Depends(get_db)):
    """
    Fetches the user's latest generated RAG meal plan.
    """
    plan = db.query(RAGMealPlan).filter(
        RAGMealPlan.user_id == user_id
    ).order_by(RAGMealPlan.created_at.desc()).first()

    if not plan:
        return {"has_plan": False, "data": None}

    return {
        "has_plan": True,
        "id": plan.id,
        "plan_tier": plan.plan_tier,
        "target_calories": plan.target_calories,
        "plan_title": plan.plan_title,
        "summary_advice": plan.summary_advice,
        "meals": json.loads(plan.meal_data),
        "grocery_list": json.loads(plan.grocery_list) if plan.grocery_list else [],
        "created_at": plan.created_at
    }


