import os
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("%(asctime)s - %(levelname)s - %(name)s - %(message)s"))
    logger.addHandler(handler)

# Cache model instance globally
_YOLO_MODEL = None
MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "ai_weights", "best.pt")


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

def analyze_food_with_best_pt(image_path: Optional[str] = None, text_prompt: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Uses the real YOLO model (best.pt) from app/models/best.pt to detect food items.
    
    Returns:
        Dict with food analysis if detected successfully
        None if no image provided, model not loaded, or detection failed
    """
    from app.services.analysis_engine import analyze_food_fallback

    logger.info(f"Food detection request: image_path={image_path}, text_prompt={text_prompt}")

    # Case 1: No image provided, only text prompt
    if not image_path or not os.path.exists(image_path):
        if text_prompt:
            logger.info(f"No image provided; falling back to text lookup: {text_prompt}")
            # Try to lookup in database by text
            return analyze_food_fallback(text_prompt=text_prompt)
        logger.warning("No image and no text prompt provided for YOLO analysis")
        # No image and no text prompt → return None
        return None

    # Case 2: Image provided but model not available
    model = get_yolo_model()
    if model is None:
        logger.warning("YOLO model not available for food detection")
        return None

    # Case 3: Try YOLO inference
    try:
        logger.info(f"Running YOLO inference on image: {image_path}")
        results = model.predict(source=image_path, conf=0.25, verbose=False)[0]

        if results.boxes is not None and len(results.boxes) > 0:
            # Food detected successfully
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

            logger.info(f"YOLO detected classes: {all_detected} | best={raw_food_name} | confidence={confidence}")

            # Look up nutrition info from database
            base_info = analyze_food_fallback(text_prompt=raw_food_name)
            base_info["confidence_score"] = round(confidence, 2)
            if all_detected:
                base_info["detected_items"] = all_detected

            logger.info(f"YOLO final nutrition payload: {base_info}")
            return base_info
        else:
            # YOLO found no objects
            logger.info("YOLO detection: No food items detected in image")
            return None

    except Exception as e:
        logger.exception(f"Error during YOLO inference for image {image_path}: {e}")
        return None
