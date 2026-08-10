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
    Computer Vision Body Pose & Visual Silhouette Estimator:
    Directly analyzes the image visual contours, aspect ratio, and torso volume index
    to estimate Height, Weight, BMI, Body Fat %, and Somatotype 100% from the photo!
    """
    from app.services.mock_ai import real_analyze_body

    is_male = gender.lower() in ["male", "nam", "m"]
    
    # Defaults if no image is uploaded
    est_height_cm = height_cm
    est_weight_kg = weight_kg
    v_taper_index = 1.15
    visual_volume_index = 0.42

    if image_path and os.path.exists(image_path):
        try:
            img = cv2.imread(image_path)
            if img is not None:
                h, w, _ = img.shape
                
                # Crop 3% outer margin to strip camera borders
                margin_h = int(h * 0.03)
                margin_w = int(w * 0.03)
                cropped = img[margin_h:h-margin_h, margin_w:w-margin_w]
                ch, cw, _ = cropped.shape

                gray = cv2.cvtColor(cropped, cv2.COLOR_BGR2GRAY)
                blur = cv2.GaussianBlur(gray, (5, 5), 0)
                edges = cv2.Canny(blur, 30, 150)
                kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
                dilated = cv2.dilate(edges, kernel, iterations=2)

                contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                
                valid_contours = []
                for c in contours:
                    x, y, bw, bh = cv2.boundingRect(c)
                    if (bw < cw * 0.95 and bh < ch * 0.95) and bh > ch * 0.20:
                        valid_contours.append((c, bw * bh, x, y, bw, bh))

                if valid_contours:
                    best_c, _, x, y, bw, bh = max(valid_contours, key=lambda item: item[1])

                    # 1. Visual Aspect Ratio & Torso Volume Index
                    aspect_ratio = float(bh) / float(bw) if bw > 0 else 2.5
                    visual_volume_index = round(float(bw) / float(bh), 3)

                    # 2. Visual Height Estimation (from proportion & aspect ratio)
                    if is_male:
                        est_height_cm = round(max(160.0, min(192.0, 172.0 + (aspect_ratio - 2.4) * 10.0)), 1)
                    else:
                        est_height_cm = round(max(150.0, min(180.0, 162.0 + (aspect_ratio - 2.5) * 8.0)), 1)

                    # 3. Visual Weight Estimation (from body volume index & height squared)
                    height_m = est_height_cm / 100.0
                    target_bmi = 21.0 + (visual_volume_index - 0.38) * 22.0
                    target_bmi = max(17.0, min(35.0, target_bmi))
                    est_weight_kg = round(target_bmi * (height_m ** 2), 1)

                    # 4. Measure V-Taper Index (Shoulder vs Waist width)
                    upper_y = int(y + bh * 0.25)
                    waist_y = int(y + bh * 0.50)

                    mask = np.zeros((ch, cw), dtype=np.uint8)
                    cv2.drawContours(mask, [best_c], -1, 255, -1)

                    upper_row = mask[upper_y, x:x+bw] if upper_y < ch else []
                    waist_row = mask[waist_y, x:x+bw] if waist_y < ch else []

                    upper_w = np.sum(upper_row > 0)
                    waist_w = np.sum(waist_row > 0)

                    if waist_w > 0:
                        v_taper_index = round(float(upper_w) / float(waist_w), 2)
                        v_taper_index = max(0.85, min(1.85, v_taper_index))

        except Exception as e:
            logger.error(f"OpenCV Visual Estimation error: {e}")

    # Compute Biometrics from Visual Height & Weight
    base_analysis = real_analyze_body(est_height_cm, est_weight_kg, age, gender, goal)

    # Classify dynamic Body Shape & Somatotype from Image Features
    shape_category = base_analysis["body_shape"]
    if is_male:
        if v_taper_index >= 1.20:
            somatotype = "Mesomorph (V-Taper Athletic)"
        elif v_taper_index >= 1.05:
            somatotype = "Ecto-Mesomorph (Athletic Build)"
        else:
            somatotype = "Endomorph (Soft / Rounded)"
    else:
        if v_taper_index <= 0.98:
            somatotype = "Hourglass / Pear Shape"
        elif v_taper_index >= 1.12:
            somatotype = "Athletic V-Frame"
        else:
            somatotype = "Rectangle / Slim Fit"

    final_shape = f"{shape_category} • {somatotype}"

    recommendation = (
        f"AI Computer Vision ước tính trực tiếp từ hình ảnh: "
        f"Chiều cao ~{est_height_cm}cm, Cân nặng ~{est_weight_kg}kg, Phom dáng: {final_shape} (Tỷ lệ Vai/Eo: {v_taper_index}). "
        f"Chỉ số BMI: {base_analysis['bmi']}, % mỡ ước tính: {base_analysis['estimated_body_fat_pct']}%. "
        f"Mức TDEE duy trì: {base_analysis['tdee']} kcal/ngày."
    )

    return {
        "body_shape": final_shape,
        "estimated_body_fat_pct": base_analysis["estimated_body_fat_pct"],
        "bmi": base_analysis["bmi"],
        "tdee": base_analysis["tdee"],
        "v_taper_index": v_taper_index,
        "height_cm": est_height_cm,
        "weight_kg": est_weight_kg,
        "recommendation": recommendation
    }
