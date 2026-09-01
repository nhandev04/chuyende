import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
from app.db.database import get_db
from app.db.models import UserProfile, FoodLog, AIReport
from app.schemas.schemas import AIAnalysisResult, AIReportCreate
from app.services.real_ai import analyze_food_with_best_pt
from app.services.analysis_engine import generate_diet_recommendations

router = APIRouter(prefix="/api/v1/ai", tags=["AI Engine"])

TEMP_DIR = "temp_uploads"
os.makedirs(TEMP_DIR, exist_ok=True)

@router.post("/analyze-food", response_model=AIAnalysisResult)
def analyze_food(
    text_prompt: Optional[str] = Form(None),
    food_image: Optional[UploadFile] = File(None)
):
    """
    AI Food Analyzer endpoint:
    Processes uploaded food image via YOLO (app/models/best.pt) or natural text prompt.
    
    Returns:
        AIAnalysisResult with food details if detected successfully
        400 Bad Request if no image/text provided or food not detected
    """
    # Validate input
    if not food_image and not text_prompt:
        raise HTTPException(
            status_code=400,
            detail="Vui lòng cung cấp ảnh đồ ăn hoặc tên món ăn"
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
                detail="❌ Không nhận diện được đồ ăn. Vui lòng cung cấp ảnh rõ ràng hơn hoặc nhập tên món ăn."
            )
        
        return AIAnalysisResult(
            food_name=res["food_name"],
            estimated_weight_g=res["estimated_weight_g"],
            calories=res["calories"],
            protein_g=res["protein_g"],
            carbs_g=res["carbs_g"],
            fat_g=res["fat_g"],
            confidence_score=res["confidence_score"],
            detected_items=res["detected_items"],
            advice=res.get("advice")
        )
    finally:
        # Clean up temporary uploaded image file safely
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass

@router.get("/recommendations/{user_id}")
def get_diet_recommendation(user_id: int, db: Session = Depends(get_db)):
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    target_cal = profile.daily_calorie_target if profile else 2000.0
    goal = profile.goal if profile else "weight_loss"

    from datetime import datetime
    today_start = datetime.combine(datetime.utcnow().date(), datetime.min.time())
    today_logs = db.query(FoodLog).filter(
        FoodLog.user_id == user_id,
        FoodLog.logged_at >= today_start
    ).all()
    consumed_cal = sum(l.calories for l in today_logs)

    return generate_diet_recommendations(consumed_cal, target_cal, goal)

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
    return {"message": "Cảm ơn bạn đã gửi báo cáo! Dữ liệu sẽ được dùng để huấn luyện AI chính xác hơn.", "report_id": report.id}
