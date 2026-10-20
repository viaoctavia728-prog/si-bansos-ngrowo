from pathlib import Path


UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads"
MAX_UPLOAD_BYTES = 2 * 1024 * 1024
MAX_HOUSE_IMAGE_BYTES = 2 * 1024 * 1024  # Maksimal 2 MB untuk foto rumah