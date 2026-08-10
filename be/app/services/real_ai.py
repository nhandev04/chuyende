import os
import json
import logging
import cv2
import numpy as np
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

# Cache model instance globally
_YOLO_MODEL = None
MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "best.pt")

def get_yolo_model():
    global _YOLO_MODEL
    if _YOLO_MODEL is None:
        if os.path.exists(MODEL_PATH):
            try:
                from ultralytics import YOLO
                _YOLO_MODEL = YOLO(MODEL_PATH)
                logger.info(f"Loaded YOLO model from {MODEL_PATH}")
            except Exception as e:
                logger.error(f"Failed to load YOLO model: {e}")
        else:
            logger.warning(f"YOLO model file not found at {MODEL_PATH}")
    return _YOLO_MODEL

def analyze_food_with_best_pt(image_path: Optional[str] = None, text_prompt: Optional[str] = None) -> Dict[str, Any]:
    """
    Uses the real YOLO model (best.pt) from app/models/best.pt to detect food items.
    Falls back gracefully if no image is uploaded or if detection confidence is low.
    """
    from app.services.mock_ai import mock_analyze_food

    if not image_path or not os.path.exists(image_path):
        return mock_analyze_food(text_prompt=text_prompt)

    model = get_yolo_model()
    if model is None:
        return mock_analyze_food(text_prompt=text_prompt, filename=os.path.basename(image_path))

    try:
        results = model.predict(source=image_path, conf=0.25, verbose=False)[0]
        
        if results.boxes is not None and len(results.boxes) > 0:
            best_box = max(results.boxes, key=lambda b: float(b.conf[0].item()))
            cls_id = int(best_box.cls[0].item())
            raw_food_name = model.names[cls_id]
            confidence = float(best_box.conf[0].item())

            all_detected = []
            for box in results.boxes:
                c_id = int(box.cls[0].item())
                name = model.names[c_id]
                if name not in all_detected:
                    all_detected.append(name)

            base_info = mock_analyze_food(text_prompt=raw_food_name)
            base_info["confidence_score"] = round(confidence, 2)
            if all_detected:
                base_info["detected_items"] = all_detected

            return base_info

    except Exception as e:
        logger.error(f"Error during YOLO inference: {e}")

    return mock_analyze_food(text_prompt=text_prompt, filename=os.path.basename(image_path))


def analyze_body_photo_cv(
    image_path: Optional[str],
    height_cm: float,
    weight_kg: float,
    age: int,
    gender: str,
    goal: str
) -> Dict[str, Any]:
    """
    Computer Vision Body Pose & Silhouette Estimator:
    Extracts body silhouette contours via OpenCV, measures shoulder vs waist ratio (V-Taper index),
    and computes body fat % using Deurenberg & Navy body composition equations.
    """
    from app.services.mock_ai import real_analyze_body

    base_analysis = real_analyze_body(height_cm, weight_kg, age, gender, goal)
    
    v_taper_index = 1.25 # Default ratio
    
    if image_path and os.path.exists(image_path):
        try:
            img = cv2.imread(image_path)
            if img is not None:
                h, w, _ = img.shape
                gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                blur = cv2.GaussianBlur(gray, (5, 5), 0)
                _, thresh = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

                # Find body silhouette contours
                contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                if contours:
                    max_contour = max(contours, key=cv2.contourArea)
                    x, y, bw, bh = cv2.boundingRect(max_contour)

                    # Extract upper body (shoulder area ~25% down) vs waist area (~50% down)
                    upper_y = int(y + bh * 0.25)
                    waist_y = int(y + bh * 0.50)

                    upper_line = thresh[upper_y, x:x+bw] if upper_y < h else []
                    waist_line = thresh[waist_y, x:x+bw] if waist_y < h else []

                    upper_width = np.sum(upper_line > 0)
                    waist_width = np.sum(waist_line > 0)

                    if waist_width > 0:
                        v_taper_index = round(float(upper_width) / float(waist_width), 2)
                        v_taper_index = max(0.8, min(2.2, v_taper_index))
        except Exception as e:
            logger.error(f"OpenCV Body Contour extraction error: {e}")

    # Classify body shape with visual V-Taper Index
    shape = base_analysis["body_shape"]
    if v_taper_index > 1.3:
        shape += " (V-Taper Athletic)"
    elif v_taper_index < 1.0:
        shape += " (Hourglass / Pear Shape)"

    recommendation = (
        f"AI Computer Vision phát hiện phom dáng: {shape} (Tỷ lệ Vai/Eo: {v_taper_index}). "
        f"Chỉ số BMI: {base_analysis['bmi']}, % mỡ ước tính: {base_analysis['estimated_body_fat_pct']}%. "
        f"Mức TDEE duy trì: {base_analysis['tdee']} kcal/ngày. {base_analysis['recommendation']}"
    )

    return {
        "body_shape": shape,
        "estimated_body_fat_pct": base_analysis["estimated_body_fat_pct"],
        "bmi": base_analysis["bmi"],
        "tdee": base_analysis["tdee"],
        "v_taper_index": v_taper_index,
        "recommendation": recommendation
    }
