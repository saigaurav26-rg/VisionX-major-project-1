"""
Object analysis service.
Compares structural / contrast-based features in original vs derained.
Provides an indicative region analysis based on local contrast and
edge strength. Does not claim to perform generic object detection.
"""

import io
import base64

import numpy as np
from PIL import Image, ImageFilter


def _to_array(img: Image.Image) -> np.ndarray:
    return np.asarray(img.convert("RGB"), dtype=np.float32) / 255.0


def _local_contrast(gray: np.ndarray, kernel: int = 16) -> np.ndarray:
    """Compute local standard deviation as a simple saliency proxy."""
    from scipy.ndimage import uniform_filter
    mean = uniform_filter(gray, size=kernel)
    mean_sq = uniform_filter(gray ** 2, size=kernel)
    var = np.clip(mean_sq - mean ** 2, 0, None)
    return np.sqrt(var)


def analyze_regions(original: Image.Image, derained: Image.Image, n_regions: int = 4) -> list[dict]:
    """Return per-region visibility comparison based on local contrast & edges."""
    a = _to_array(original)
    b = _to_array(derained)
    a_g = a.mean(axis=2)
    b_g = b.mean(axis=2)
    try:
        ca = _local_contrast(a_g)
        cb = _local_contrast(b_g)
    except Exception:
        ca = np.abs(np.diff(a_g, axis=0, append=a_g[-1:]))
        cb = np.abs(np.diff(b_g, axis=0, append=b_g[-1:]))

    H, W = a_g.shape
    # Divide into a grid
    rows, cols = 2, 2
    rh, rw = H // rows, W // cols
    regions = []
    for r in range(rows):
        for c in range(cols):
            y0, y1 = r * rh, (r + 1) * rh
            x0, x1 = c * rw, (c + 1) * rw
            ca_r = float(ca[y0:y1, x0:x1].mean())
            cb_r = float(cb[y0:y1, x0:x1].mean())
            la_r = float(a_g[y0:y1, x0:x1].mean())
            lb_r = float(b_g[y0:y1, x0:x1].mean())
            change = cb_r - ca_r
            regions.append(
                {
                    "region": f"R{r * cols + c + 1}",
                    "box": [int(x0), int(y0), int(x1), int(y1)],
                    "contrast_before": round(ca_r, 4),
                    "contrast_after": round(cb_r, 4),
                    "contrast_change": round(change, 4),
                    "luma_before": round(la_r, 4),
                    "luma_after": round(lb_r, 4),
                    "visibility_improved": bool(change > 0.005),
                }
            )
    return regions[:n_regions]


def detection_fallback_overlay(image: Image.Image) -> Image.Image:
    """Generate an indicative saliency overlay (gradient magnitude)."""
    g = image.convert("L").filter(ImageFilter.FIND_EDGES)
    arr = np.asarray(g, dtype=np.float32) / 255.0
    # Colorize: stronger edges = cyan/blue tint
    rgb = np.stack([arr * 0.3, arr * 0.8, arr * 1.0], axis=-1)
    rgb = np.clip(rgb, 0, 1)
    return Image.fromarray((rgb * 255).astype("uint8"))


def img_to_data_url(img: Image.Image, fmt: str = "PNG") -> str:
    buf = io.BytesIO()
    img.save(buf, format=fmt)
    return f"data:image/{fmt.lower()};base64,{base64.b64encode(buf.getvalue()).decode()}"