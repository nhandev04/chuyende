import os
import logging
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Initialize Cloudinary Configuration
CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME", "rohl7aqf")
API_KEY = os.getenv("CLOUDINARY_API_KEY", "396177385619527")
API_SECRET = os.getenv("CLOUDINARY_API_SECRET", "")

is_configured = False
try:
    import cloudinary
    import cloudinary.uploader

    if (
        CLOUD_NAME and API_KEY and API_SECRET and
        "your_cloudinary" not in API_SECRET and
        API_SECRET != "**********" and
        len(API_SECRET) > 5
    ):
        cloudinary.config(
            cloud_name=CLOUD_NAME,
            api_key=API_KEY,
            api_secret=API_SECRET,
            secure=True
        )
        is_configured = True
        logger.info("☁️ Cloudinary SDK configured successfully for Cloud Name: %s", CLOUD_NAME)
    else:
        logger.info("ℹ️ Cloudinary credentials not fully configured (API Secret placeholder). Fallback to local image storage.")
except Exception as e:
    logger.warning("Failed to initialize Cloudinary SDK: %s", e)


def upload_image_to_cloudinary(file_path: str, folder: str = "health_lens_ai/scans") -> Optional[str]:
    """
    Uploads a local image file or base64 data string to Cloudinary and returns its secure HTTPS CDN URL.
    Returns None if Cloudinary is not configured or upload fails.
    """
    if not is_configured or not file_path:
        return None

    is_data_uri = isinstance(file_path, str) and file_path.startswith("data:image/")
    if not is_data_uri and not os.path.exists(file_path):
        return None

    try:
        import cloudinary.uploader
        response = cloudinary.uploader.upload(
            file_path,
            folder=folder,
            resource_type="image",
            use_filename=True,
            unique_filename=True
        )
        url = response.get("secure_url")
        logger.info("☁️ Uploaded image to Cloudinary: %s", url)
        return url
    except Exception as e:
        logger.error("Error uploading image to Cloudinary: %s", e)
        return None
