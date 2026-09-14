import logging
import os
from typing import Any, Dict, List, Optional

import cv2
import numpy as np
from ultralytics import YOLO

logger = logging.getLogger(__name__)

_POSE_MODEL: Optional[YOLO] = None
_ARUCO_DETECTOR: Optional[Any] = None

POSE_MODEL_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "models", "yolov8n-pose.pt")
)

ARUCO_DICTIONARY = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_4X4_50)
ARUCO_PARAMETERS = cv2.aruco.DetectorParameters()
ARUCO_SIDE_CM = 5.0


def get_aruco_detector() -> Any:
    """Get or create ArUco detector instance."""
    global _ARUCO_DETECTOR
    if _ARUCO_DETECTOR is None:
        _ARUCO_DETECTOR = cv2.aruco.ArucoDetector(ARUCO_DICTIONARY, ARUCO_PARAMETERS)
    return _ARUCO_DETECTOR


def get_pose_model() -> YOLO:
    """Load the real YOLO pose model used for full-body estimation."""
    global _POSE_MODEL
    if _POSE_MODEL is not None:
        return _POSE_MODEL

    try:
        _POSE_MODEL = YOLO(POSE_MODEL_PATH)
        logger.info(f"Loaded YOLO pose model from {POSE_MODEL_PATH}")
        return _POSE_MODEL
    except Exception as exc:
        logger.exception("Failed to load YOLO pose model for full-body analysis")
        raise RuntimeError(
            "AI body posture analysis service is currently unavailable. Please try again later."
        ) from exc




def _detect_aruco_markers(image: np.ndarray) -> List[Dict[str, float]]:
    detector = get_aruco_detector()
    corners, ids, rejected = detector.detectMarkers(image)
    if ids is None or len(ids) == 0 or corners is None:
        return []

    markers: List[Dict[str, float]] = []
    for corner in corners:
        p1, p2, p3, p4 = corner[0]
        side_px = max(
            np.linalg.norm(p1 - p2),
            np.linalg.norm(p2 - p3),
            np.linalg.norm(p3 - p4),
            np.linalg.norm(p4 - p1),
        )
        if side_px > 0:
            markers.append({"side_px": float(side_px)})
    return markers


def _estimate_height_from_pose_and_aruco(image_path: str, result: Any) -> Optional[float]:
    """Estimate height from YOLO pose keypoints using body proportions.
    
    YOLO keypoint model (17 points):
    0: nose, 1-2: eyes, 3-4: ears, 5-6: shoulders, 7-8: elbows, 9-10: wrists,
    11-12: hips, 13-14: knees, 15-16: ankles
    """
    keypoints = result.keypoints.xy[0].cpu().numpy() if result.keypoints is not None else None
    if keypoints is None or keypoints.size == 0:
        return None

    valid = keypoints[(keypoints[:, 0] > 0) & (keypoints[:, 1] > 0)]
    if valid.shape[0] < 5:
        return None

    # Get head and foot position
    head_y = float(np.min(valid[:, 1]))
    foot_y = float(np.max(valid[:, 1]))
    height_px = max(0.0, foot_y - head_y)
    if height_px <= 0:
        return None

    # Estimate scale using shoulder width (keypoints 5 and 6)
    shoulder_left = keypoints[5] if len(keypoints) > 5 else None
    shoulder_right = keypoints[6] if len(keypoints) > 6 else None
    
    if shoulder_left is not None and shoulder_right is not None:
        if shoulder_left[0] > 0 and shoulder_right[0] > 0:
            shoulder_width_px = abs(shoulder_right[0] - shoulder_left[0])
            if shoulder_width_px > 0:
                px_per_cm = shoulder_width_px / 42.0
                height_cm = height_px / px_per_cm
                if 120.0 <= height_cm <= 220.0:
                    logger.info(f"Height estimated from shoulder width: {height_cm}cm (shoulder_width_px={shoulder_width_px})")
                    return round(float(height_cm), 1)

    # Fallback: use face/head width heuristic
    head_keypoints = keypoints[:5]
    valid_head = head_keypoints[(head_keypoints[:, 0] > 0) & (head_keypoints[:, 1] > 0)]
    
    if len(valid_head) >= 2:
        head_width_px = float(np.ptp(valid_head[:, 0]))
        if head_width_px > 0:
            estimated_px_per_cm = head_width_px / 19.0
            height_cm = height_px / estimated_px_per_cm
            if 120.0 <= height_cm <= 220.0:
                logger.info(f"Height estimated from head width: {height_cm}cm (head_width_px={head_width_px})")
                return round(float(height_cm), 1)

    # Final fallback: generic estimation using body height to width ratio
    body_width_px = float(np.ptp(valid[:, 0]))
    if body_width_px > 20:
        estimated_px_per_cm = body_width_px / 35.0
        height_cm = height_px / estimated_px_per_cm
        if 120.0 <= height_cm <= 220.0:
            logger.info(f"Height estimated from body width: {height_cm}cm (body_width_px={body_width_px})")
            return round(float(height_cm), 1)

    logger.warning(f"Could not estimate height reliably from pose keypoints. height_px={height_px}")
    return None


def _estimate_weight_kg_from_keypoints(height_cm: float, keypoints: np.ndarray) -> float:
    """
    Dynamically computes body weight based on visual body width vs height ratio from keypoints.
    Eliminates fixed constant 22.5 BMI baseline!
    """
    valid = keypoints[(keypoints[:, 0] > 0) & (keypoints[:, 1] > 0)]
    if valid.shape[0] >= 4:
        head_y = float(np.min(valid[:, 1]))
        foot_y = float(np.max(valid[:, 1]))
        height_px = max(1.0, foot_y - head_y)
        
        width_px = float(np.ptp(valid[:, 0]))
        ratio = width_px / height_px

        # Dynamic BMI scaling based on keypoint torso ratio (typically 0.16 to 0.35)
        dynamic_bmi = 15.0 + (ratio - 0.16) * 50.0
        dynamic_bmi = round(max(16.5, min(36.0, dynamic_bmi)), 1)
    else:
        dynamic_bmi = 22.0

    weight_kg = dynamic_bmi * (height_cm / 100.0) ** 2
    return round(float(max(35.0, min(160.0, weight_kg))), 1)


def predict_height_weight_from_body(image_path: str) -> Dict[str, Any]:
    """
    Estimate height and weight from a full-body image using YOLOv8 pose keypoints.
    Calculates dynamic BMI from skeleton proportions.
    """
    try:
        model = get_pose_model()
        results = model(image_path, conf=0.25, verbose=False)
    except Exception as exc:
        logger.exception(f"Pose analysis failed for {image_path}")
        return {
            "predicted_height_cm": None,
            "predicted_weight_kg": None,
            "confidence_score": 0.0,
            "model_info": "Smart Body Analysis (proportional estimation)",
            "error": str(exc),
        }

    if not results:
        return {
            "predicted_height_cm": None,
            "predicted_weight_kg": None,
            "confidence_score": 0.0,
            "model_info": "No full-body person detected",
            "error": "No person detected in the photo.",
        }

    best_detection: Optional[Dict[str, Any]] = None
    best_confidence = 0.0

    for result in results:
        if result.keypoints is None or len(result.keypoints.xy) == 0:
            continue

        if result.boxes is not None and len(result.boxes.conf) > 0:
            box_conf = float(result.boxes.conf[0].item())
        else:
            box_conf = 0.5

        height_cm = _estimate_height_from_pose_and_aruco(image_path, result)
        if height_cm is None:
            continue

        keypoints_xy = result.keypoints.xy[0].cpu().numpy()
        estimated_weight = _estimate_weight_kg_from_keypoints(height_cm, keypoints_xy)
        candidate_confidence = min(0.99, max(0.35, box_conf * 0.85))

        if candidate_confidence > best_confidence:
            best_confidence = candidate_confidence
            best_detection = {
                "predicted_height_cm": height_cm,
                "predicted_weight_kg": estimated_weight,
                "confidence_score": round(best_confidence, 3),
                "model_info": "Smart Body Analysis (proportional estimation)",
            }

    if best_detection is None:
        return {
            "predicted_height_cm": None,
            "predicted_weight_kg": None,
            "confidence_score": 0.0,
            "model_info": "Smart Body Analysis (proportional estimation)",
            "error": "Unable to estimate height: photo does not contain a clear full-body view or camera angle is unsuitable.",
        }


    logger.info(
        "Body pose estimate: height_cm=%s, weight_kg=%s, confidence=%s",
        best_detection["predicted_height_cm"],
        best_detection["predicted_weight_kg"],
        best_detection["confidence_score"],
    )
    return best_detection
