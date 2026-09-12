"""
Restoration analysis service.
Computes real image-derived information about the restoration
between the original and derained images.

All metrics are derived from actual pixel values. Where a metric
cannot be reliably computed we return 'N/A'.
"""

import io
import math

import numpy as np
from PIL import Image, ImageFilter


def _to_array(img: Image.Image, size: tuple[int, int] | None = None) -> np.ndarray:
    if size and img.size != size:
        img = img.resize(size, Image.LANCZOS)
    return np.asarray(img.convert("RGB"), dtype=np.float32) / 255.0


def restoration_residual_map(original: Image.Image, derained: Image.Image) -> Image.Image:
    """Pixel-wise |original - derained| residual map (visual)."""
    a = _to_array(original)
    b = _to_array(derained)
    diff = np.clip(np.abs(a - b) * 4.0, 0, 1)  # amplify for visibility
    # Highlight in cool/cyan
    gray = diff.mean(axis=2, keepdims=True)
    tinted = np.concatenate([gray * 0.4, gray * 0.9, gray * 1.0], axis=2)
    tinted = np.clip(tinted, 0, 1)
    arr = (tinted * 255).astype("uint8")
    return Image.fromarray(arr)


def detail_map(original: Image.Image, derained: Image.Image) -> Image.Image:
    """High-frequency difference between original and derained (detail recovery)."""
    o = original.convert("L").filter(ImageFilter.FIND_EDGES)
    d = derained.convert("L").filter(ImageFilter.FIND_EDGES)
    a = np.asarray(o, dtype=np.float32) / 255.0
    b = np.asarray(d, dtype=np.float32) / 255.0
    # Difference: where the derained has more high-frequency detail
    diff = np.clip(np.abs(b - a) * 3.0, 0, 1)
    rgb = np.stack([diff, diff * 0.7, diff * 0.3], axis=-1)
    rgb = np.clip(rgb, 0, 1)
    arr = (rgb * 255).astype("uint8")
    return Image.fromarray(arr)


def edge_map(image: Image.Image) -> Image.Image:
    e = image.convert("L").filter(ImageFilter.FIND_EDGES)
    arr = np.asarray(e, dtype=np.float32) / 255.0
    rgb = np.stack([arr, arr, arr], axis=-1)
    return Image.fromarray((rgb * 255).astype("uint8"))


def edge_difference(original: Image.Image, derained: Image.Image) -> Image.Image:
    eo = np.asarray(original.convert("L").filter(ImageFilter.FIND_EDGES), dtype=np.float32) / 255.0
    ed = np.asarray(derained.convert("L").filter(ImageFilter.FIND_EDGES), dtype=np.float32) / 255.0
    diff = np.clip(np.abs(ed - eo) * 3.0, 0, 1)
    rgb = np.stack([diff, diff * 0.6, diff * 0.2], axis=-1)
    rgb = np.clip(rgb, 0, 1)
    return Image.fromarray((rgb * 255).astype("uint8"))


def compute_metrics(original: Image.Image, derained: Image.Image) -> dict:
    """Compute actual pixel-derived restoration metrics. Returns 'N/A' if invalid."""
    try:
        a = _to_array(original)
        b = _to_array(derained)
        if a.shape != b.shape:
            b_img = derained.resize((original.size), Image.LANCZOS)
            b = _to_array(b_img)
        # Mean absolute difference (pixel-level change)
        mad = float(np.mean(np.abs(a - b)))
        # Per-channel std of difference (variability)
        diff = np.abs(a - b)
        std = float(np.std(diff))
        # Brightness change
        luma_a = float(np.mean(0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]))
        luma_b = float(np.mean(0.299 * b[..., 0] + 0.587 * b[..., 1] + 0.114 * b[..., 2]))
        # Edge density (Laplacian-like)
        edge_a = float(np.mean(np.abs(np.asarray(original.convert("L").filter(ImageFilter.FIND_EDGES), dtype=np.float32)) / 255.0))
        edge_b = float(np.mean(np.abs(np.asarray(derained.convert("L").filter(ImageFilter.FIND_EDGES), dtype=np.float32)) / 255.0))
        # Estimated restoration strength: ratio of changed pixels (above noise threshold)
        changed_pixels = float(np.mean((diff.mean(axis=2) > 0.02).astype(np.float32)))
        return {
            "mean_abs_difference": round(mad, 4),
            "difference_std": round(std, 4),
            "luma_before": round(luma_a, 4),
            "luma_after": round(luma_b, 4),
            "luma_change": round(luma_b - luma_a, 4),
            "edge_density_before": round(edge_a, 4),
            "edge_density_after": round(edge_b, 4),
            "edge_density_change": round(edge_b - edge_a, 4),
            "changed_pixel_ratio": round(changed_pixels, 4),
        }
    except Exception:
        return {
            "mean_abs_difference": "N/A",
            "difference_std": "N/A",
            "luma_before": "N/A",
            "luma_after": "N/A",
            "luma_change": "N/A",
            "edge_density_before": "N/A",
            "edge_density_after": "N/A",
            "edge_density_change": "N/A",
            "changed_pixel_ratio": "N/A",
        }


def img_to_data_url(img: Image.Image, fmt: str = "PNG") -> str:
    buf = io.BytesIO()
    img.save(buf, format=fmt)
    import base64
    return f"data:image/{fmt.lower()};base64,{base64.b64encode(buf.getvalue()).decode()}"