"""
Image storage service.
Handles upload persistence, secure filenames, and result file management.
"""

import io
import logging
import re
import secrets
import time
from pathlib import Path

from PIL import Image

logger = logging.getLogger("visionx.storage")

ALLOWED_EXTS = {".png", ".jpg", ".jpeg", ".webp"}
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100 MB
UPLOAD_DIR = Path("uploads")
OUTPUT_DIR = Path("outputs")


def ensure_dirs():
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def sanitize_filename(name: str) -> str:
    name = re.sub(r"[^A-Za-z0-9._-]+", "_", name)
    return name[:120] or "image"


def secure_filename(name: str) -> str:
    base = Path(name).name
    return sanitize_filename(base)


def validate_image_bytes(data: bytes) -> tuple[bool, str]:
    if not data:
        return False, "Empty file"
    if len(data) > MAX_FILE_SIZE:
        return False, f"File too large ({len(data)} bytes)"
    try:
        img = Image.open(io.BytesIO(data))
        img.verify()
    except Exception as e:
        return False, f"Invalid or corrupted image: {e}"
    # Re-open to ensure decodable
    try:
        img2 = Image.open(io.BytesIO(data))
        img2.convert("RGB")
    except Exception as e:
        return False, f"Cannot decode image: {e}"
    return True, ""


def save_upload(filename: str, data: bytes) -> Path:
    ensure_dirs()
    safe = secure_filename(filename)
    stamp = int(time.time() * 1000)
    rand = secrets.token_hex(4)
    target = UPLOAD_DIR / f"{stamp}_{rand}_{safe}"
    target.write_bytes(data)
    return target


def save_output(filename: str, image: Image.Image, fmt: str = "PNG") -> Path:
    ensure_dirs()
    safe = secure_filename(filename)
    base = Path(safe).stem
    ext = "png" if fmt.upper() == "PNG" else "jpg"
    stamp = int(time.time() * 1000)
    rand = secrets.token_hex(4)
    target = OUTPUT_DIR / f"{stamp}_{rand}_{base}_derained.{ext}"
    image.save(target, format=fmt)
    return target


def build_derained_filename(original_name: str, fmt: str = "PNG") -> str:
    base = Path(secure_filename(original_name)).stem
    ext = "png" if fmt.upper() == "PNG" else "jpg"
    return f"{base}_derained.{ext}"