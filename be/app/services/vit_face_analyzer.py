"""
ViT (Vision Transformer) Face Analyzer
Fine-tuned Vision Transformer model for predicting height and weight from facial images.
Uses face detection + ViT model for multi-task regression.
"""
import logging
import os
from typing import Any, Dict, Optional, Tuple

import cv2
import numpy as np

logger = logging.getLogger(__name__)

# Cache ViT model instance globally
_VIT_MODEL = None
_FACE_DETECTOR = None

VIT_MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "best_vit.pt")
HF_MODEL_ID = "Rithankoushik/Finetuned_VITmodel"
HF_MODEL_FILENAME = "best_model.pt"


def get_face_detector():
    """Load face detection model (MediaPipe preferred, fallback to OpenCV Haar cascade)."""
    global _FACE_DETECTOR
    if _FACE_DETECTOR is not None:
        return _FACE_DETECTOR

    try:
        import mediapipe as mp

        _FACE_DETECTOR = mp.solutions.face_detection.FaceDetection(
            model_selection=1,
            min_detection_confidence=0.5,
        )
        logger.info("Loaded MediaPipe Face Detector")
        return _FACE_DETECTOR
    except Exception as mp_error:
        logger.warning(f"MediaPipe face detector unavailable: {mp_error}")

    if not hasattr(cv2, "CascadeClassifier"):
        raise RuntimeError(
            "OpenCV installation is incomplete or broken in this environment: cv2.CascadeClassifier is unavailable. "
            "Please reinstall with 'python -m pip uninstall -y opencv-python-headless opencv-python' and then 'python -m pip install opencv-python'."
        )

    cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    _FACE_DETECTOR = cv2.CascadeClassifier(cascade_path)
    logger.info("Loaded OpenCV Cascade Classifier for Face Detection")
    return _FACE_DETECTOR


def denormalize_vit_prediction(prediction: Dict[str, Any], dataset_stats: Dict[str, float]) -> Dict[str, Any]:
    """Convert normalized ViT outputs back to actual height/weight numbers."""
    height_norm = prediction.get("height")
    weight_norm = prediction.get("weight")

    if height_norm is None and "height_normalized" in prediction:
        height_norm = prediction.get("height_normalized")
    if weight_norm is None and "weight_normalized" in prediction:
        weight_norm = prediction.get("weight_normalized")

    if isinstance(height_norm, (list, tuple, np.ndarray)):
        height_norm = float(height_norm[0])
    if isinstance(weight_norm, (list, tuple, np.ndarray)):
        weight_norm = float(weight_norm[0])

    try:
        height_norm = float(height_norm)
        weight_norm = float(weight_norm)
    except (TypeError, ValueError):
        logger.warning("Invalid ViT normalized values; using defaults")
        height_norm = 0.0
        weight_norm = 0.0

    height_mean = float(dataset_stats.get("height_mean", 170.0))
    height_std = float(dataset_stats.get("height_std", 10.0))
    weight_mean = float(dataset_stats.get("weight_mean", 70.0))
    weight_std = float(dataset_stats.get("weight_std", 12.0))

    pred_height = height_norm * height_std + height_mean
    pred_weight = weight_norm * weight_std + weight_mean

    return {
        "predicted_height_cm": round(float(pred_height), 1),
        "predicted_weight_kg": round(float(pred_weight), 1),
        "confidence_score": 0.85,
        "model_info": "Fine-tuned ViT regression model",
        "status": "success",
    }


def get_vit_model():
    """Load a real ViT regression checkpoint when available, otherwise raise a clear error."""
    global _VIT_MODEL
    if _VIT_MODEL is not None:
        return _VIT_MODEL

    try:
        import torch
        from transformers import ViTConfig, ViTForImageClassification, ViTImageProcessor

        # Prefer local file if it exists.
        if os.path.exists(VIT_MODEL_PATH):
            checkpoint = torch.load(VIT_MODEL_PATH, map_location="cpu")
            dataset_stats = checkpoint.get("dataset_stats", {}) if isinstance(checkpoint, dict) else {}

            config = ViTConfig.from_pretrained("google/vit-base-patch16-224")
            config.num_labels = 2
            model = ViTForImageClassification(config)

            if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
                state_dict = checkpoint["model_state_dict"]
                model.load_state_dict(state_dict, strict=False)
            elif hasattr(checkpoint, "eval"):
                model = checkpoint

            processor = ViTImageProcessor.from_pretrained("google/vit-base-patch16-224")
            _VIT_MODEL = {
                "model": model,
                "processor": processor,
                "dataset_stats": dataset_stats,
                "type": "real_vit_regression",
            }
            logger.info(f"Loaded local ViT checkpoint from {VIT_MODEL_PATH}")
            return _VIT_MODEL

        # If no local checkpoint exists, try downloading the model card's checkpoint.
        try:
            from huggingface_hub import hf_hub_download

            model_path = hf_hub_download(repo_id=HF_MODEL_ID, filename=HF_MODEL_FILENAME)
            checkpoint = torch.load(model_path, map_location="cpu")
            dataset_stats = checkpoint.get("dataset_stats", {}) if isinstance(checkpoint, dict) else {}

            config = ViTConfig.from_pretrained("google/vit-base-patch16-224")
            config.num_labels = 2
            model = ViTForImageClassification(config)

            if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
                state_dict = checkpoint["model_state_dict"]
                model.load_state_dict(state_dict, strict=False)
            elif hasattr(checkpoint, "eval"):
                model = checkpoint

            processor = ViTImageProcessor.from_pretrained("google/vit-base-patch16-224")
            _VIT_MODEL = {
                "model": model,
                "processor": processor,
                "dataset_stats": dataset_stats,
                "type": "real_vit_regression",
            }
            logger.info(f"Loaded ViT checkpoint from Hugging Face: {HF_MODEL_ID}")
            return _VIT_MODEL
        except Exception as download_error:
            logger.warning(f"No usable real ViT checkpoint available yet: {download_error}")
            return None
    except Exception as exc:
        logger.error(f"Failed to load ViT model: {exc}")
        return None


def extract_face_roi(image_path: str) -> Optional[np.ndarray]:
    """Extract face region of interest (ROI) from image."""
    try:
        img = cv2.imread(image_path)
        if img is None:
            logger.warning(f"Failed to read image: {image_path}")
            return None

        face_detector = get_face_detector()

        try:
            import mediapipe as mp

            if isinstance(face_detector, type(mp.solutions.face_detection.FaceDetection)):
                rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                results = face_detector.process(rgb_img)

                if results.detections and len(results.detections) > 0:
                    detection = results.detections[0]
                    h, w, _ = img.shape
                    bbox = detection.location_data.relative_bounding_box
                    x1 = int(bbox.xmin * w)
                    y1 = int(bbox.ymin * h)
                    x2 = int((bbox.xmin + bbox.width) * w)
                    y2 = int((bbox.ymin + bbox.height) * h)
                    padding = int(max(x2 - x1, y2 - y1) * 0.1)
                    x1 = max(0, x1 - padding)
                    y1 = max(0, y1 - padding)
                    x2 = min(w, x2 + padding)
                    y2 = min(h, y2 + padding)
                    return img[y1:y2, x1:x2]
        except Exception:
            pass

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        faces = face_detector.detectMultiScale(gray, 1.1, 4)

        if len(faces) > 0:
            x, y, w, h = faces[0]
            padding = int(max(w, h) * 0.1)
            x = max(0, x - padding)
            y = max(0, y - padding)
            w = min(img.shape[1], w + 2 * padding)
            h = min(img.shape[0], h + 2 * padding)
            return img[y : y + h, x : x + w]

        logger.warning("No face detected in image")
        return None
    except Exception as exc:
        logger.error(f"Error extracting face ROI: {exc}")
        return None


def predict_height_weight_with_vit(image_path: str) -> Dict[str, Any]:
    """Predict height and weight using a real ViT regression model."""
    try:
        face_roi = extract_face_roi(image_path)
        if face_roi is None:
            logger.warning("Could not extract face from image; refusing to return default body estimates")
            return {
                "predicted_height_cm": None,
                "predicted_weight_kg": None,
                "confidence_score": 0.0,
                "model_info": "No face detected",
                "status": "error",
            }

        vit_model = get_vit_model()
        if vit_model is None:
            logger.warning("Real ViT model is not available; refusing to guess from face heuristics")
            return {
                "predicted_height_cm": None,
                "predicted_weight_kg": None,
                "confidence_score": 0.0,
                "model_info": "No real ViT checkpoint available",
                "status": "error",
            }

        import torch
        from PIL import Image

        processor = vit_model["processor"]
        model = vit_model["model"]
        dataset_stats = vit_model.get("dataset_stats", {})

        image = Image.fromarray(cv2.cvtColor(face_roi, cv2.COLOR_BGR2RGB))
        inputs = processor(images=image, return_tensors="pt")

        model.eval()
        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs.logits if hasattr(outputs, "logits") else outputs
            logits = logits[0]

            if logits.shape[0] < 2:
                raise ValueError("Model output does not contain height and weight predictions")

            prediction = {
                "height": logits[0].item(),
                "weight": logits[1].item(),
            }

        denormalized = denormalize_vit_prediction(prediction, dataset_stats)
        return {
            "predicted_height_cm": denormalized["predicted_height_cm"],
            "predicted_weight_kg": denormalized["predicted_weight_kg"],
            "confidence_score": denormalized["confidence_score"],
            "model_info": denormalized["model_info"],
            "status": denormalized["status"],
        }
    except Exception as exc:
        logger.error(f"Error in ViT height/weight prediction: {exc}")
        return {
            "predicted_height_cm": None,
            "predicted_weight_kg": None,
            "confidence_score": 0.0,
            "model_info": f"Error during inference: {str(exc)}",
            "status": "error",
        }

