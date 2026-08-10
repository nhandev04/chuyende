from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from app.db.database import get_db
from app.db.models import FoodLog, UserProfile
from app.schemas.schemas import FoodLogCreate, FoodLogOut

router = APIRouter(prefix="/api/v1/food-logs", tags=["Food Logs"])

@router.post("/{user_id}", response_model=FoodLogOut)
def create_food_log(user_id: int, log_in: FoodLogCreate, db: Session = Depends(get_db)):
    log_entry = FoodLog(
        user_id=user_id,
        meal_type=log_in.meal_type,
        food_name=log_in.food_name,
        weight_g=log_in.weight_g,
        calories=log_in.calories,
        protein_g=log_in.protein_g,
        carbs_g=log_in.carbs_g,
        fat_g=log_in.fat_g,
        image_url=log_in.image_url,
        confidence_score=0.95,
        logged_at=datetime.utcnow()
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)
    return log_entry

@router.get("/{user_id}", response_model=List[FoodLogOut])
def get_user_food_logs(
    user_id: int, 
    date_str: Optional[str] = Query(None, description="Format YYYY-MM-DD"),
    db: Session = Depends(get_db)
):
    query = db.query(FoodLog).filter(FoodLog.user_id == user_id)
    if date_str:
        try:
            target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            query = query.filter(
                FoodLog.logged_at >= datetime.combine(target_date, datetime.min.time()),
                FoodLog.logged_at <= datetime.combine(target_date, datetime.max.time())
            )
        except ValueError:
            pass
    return query.order_by(FoodLog.logged_at.desc()).all()

@router.get("/{user_id}/summary")
def get_nutrition_summary(user_id: int, db: Session = Depends(get_db)):
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    target_cal = profile.daily_calorie_target if profile else 2000.0

    today = datetime.utcnow().date()
    today_start = datetime.combine(today, datetime.min.time())
    
    # Today logs
    today_logs = db.query(FoodLog).filter(
        FoodLog.user_id == user_id,
        FoodLog.logged_at >= today_start
    ).all()

    consumed_cal = sum(log.calories for log in today_logs)
    protein_total = sum(log.protein_g for log in today_logs)
    carbs_total = sum(log.carbs_g for log in today_logs)
    fat_total = sum(log.fat_g for log in today_logs)

    # Weekly chart data (7 days)
    weekly_data = []
    days_map = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]
    for i in range(6, -1, -1):
        day_date = today - timedelta(days=i)
        d_start = datetime.combine(day_date, datetime.min.time())
        d_end = datetime.combine(day_date, datetime.max.time())
        logs = db.query(FoodLog).filter(
            FoodLog.user_id == user_id,
            FoodLog.logged_at >= d_start,
            FoodLog.logged_at <= d_end
        ).all()
        day_cal = sum(l.calories for l in logs)
        # Mock default data if no logs exist for visual chart demo
        if day_cal == 0:
            day_cal = round(target_cal * (0.85 + (i % 3) * 0.1), 0)

        weekly_data.append({
            "day": days_map[day_date.weekday()],
            "date": day_date.strftime("%d/%m"),
            "calories": day_cal,
            "target": target_cal
        })

    # Monthly chart data (4 weeks)
    monthly_data = [
        {"week": "Tuần 1", "avg_calories": target_cal - 100, "avg_weight": 66.5},
        {"week": "Tuần 2", "avg_calories": target_cal + 50, "avg_weight": 66.0},
        {"week": "Tuần 3", "avg_calories": target_cal - 150, "avg_weight": 65.4},
        {"week": "Tuần 4", "avg_calories": consumed_cal if consumed_cal > 0 else target_cal - 50, "avg_weight": profile.current_weight_kg if profile else 65.0}
    ]

    return {
        "daily": {
            "consumed_calories": round(consumed_cal, 1),
            "target_calories": round(target_cal, 1),
            "remaining_calories": round(max(0, target_cal - consumed_cal), 1),
            "protein_g": round(protein_total, 1),
            "protein_target_g": round((target_cal * 0.3) / 4, 1), # 30% of target cal
            "carbs_g": round(carbs_total, 1),
            "carbs_target_g": round((target_cal * 0.45) / 4, 1), # 45% of target cal
            "fat_g": round(fat_total, 1),
            "fat_target_g": round((target_cal * 0.25) / 9, 1), # 25% of target cal
        },
        "weekly_chart": weekly_data,
        "monthly_chart": monthly_data
    }

@router.delete("/{log_id}")
def delete_food_log(log_id: int, db: Session = Depends(get_db)):
    log = db.query(FoodLog).filter(FoodLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Không tìm thấy nhật ký món ăn")
    db.delete(log)
    db.commit()
    return {"message": "Đã xóa thành công"}
