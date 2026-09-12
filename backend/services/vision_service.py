"""
Vision Assistant service.

Provides deterministic, image-derived summaries of the deraining result.
Does not call any external VLM. Clearly labels responses as factual
observations derived from the processed images.
"""

from PIL import Image
import numpy as np

from backend.services.analysis_service import compute_metrics


def _luma(arr: np.ndarray) -> np.ndarray:
    return 0.299 * arr[..., 0] + 0.587 * arr[..., 1] + 0.114 * arr[..., 2]


def _to_array(img: Image.Image) -> np.ndarray:
    return np.asarray(img.convert("RGB"), dtype=np.float32) / 255.0


def summarize(original: Image.Image, derained: Image.Image) -> str:
    """Generate a factual observation summary."""
    metrics = compute_metrics(original, derained)
    a = _to_array(original)
    b = _to_array(derained)
    la = float(_luma(a).mean())
    lb = float(_luma(b).mean())
    diff = np.abs(a - b).mean(axis=2)
    high_change = float((diff > 0.05).mean())
    return (
        f"Factual observation: average per-pixel change is {metrics['mean_abs_difference']} "
        f"on a 0-1 scale. Approximately {high_change:.1%} of pixels show noticeable change. "
        f"Mean luminance changed from {la:.3f} to {lb:.3f} "
        f"(change {lb - la:+.3f}). This is an analytical summary, not a subjective assessment."
    )


def answer_question(question: str, original: Image.Image, derained: Image.Image) -> str:
    """Answer a user's question using only factual pixel-derived information."""
    q = question.lower().strip()
    metrics = compute_metrics(original, derained)
    a = _to_array(original)
    b = _to_array(derained)
    la = float(_luma(a).mean())
    lb = float(_luma(b).mean())
    diff = np.abs(a - b).mean(axis=2)
    high_change = float((diff > 0.05).mean())

    if any(k in q for k in ["change", "what changed", "difference"]):
        return (
            f"Factual observation: pixel-level mean absolute difference is "
            f"{metrics['mean_abs_difference']}. About {high_change:.1%} of pixels changed noticeably. "
            f"Edge density changed from {metrics['edge_density_before']} to {metrics['edge_density_after']}."
        )
    if any(k in q for k in ["clear", "sharper", "visible"]):
        return (
            f"Factual observation: local edge density {'increased' if float(metrics['edge_density_change']) > 0 else 'decreased'} "
            f"by {float(metrics['edge_density_change']):+.4f} after deraining. "
            f"{'Restored image appears to expose more high-frequency content.' if float(metrics['edge_density_change']) > 0 else 'Restored image shows smoother high-frequency regions.'}"
        )
    if "rain" in q:
        return (
            f"Factual observation: residual-map analysis shows pixel deviations in "
            f"{high_change:.1%} of pixels. This is an estimated residual/rain visualization, "
            f"not a precise rain-segmentation mask."
        )
    if "compare" in q or "vs" in q or "versus" in q:
        return (
            f"Factual observation: original mean luma={la:.3f}, derained mean luma={lb:.3f}. "
            f"Mean absolute pixel difference: {metrics['mean_abs_difference']}. "
            f"Edge density: before={metrics['edge_density_before']}, after={metrics['edge_density_after']}."
        )
    if any(k in q for k in ["object", "subject", "thing", "people", "car", "building"]):
        return (
            "I do not perform generic object detection in this mode. "
            "For region-level comparison between the original and derained images, "
            "use the Object Analysis panel."
        )
    # Default summary
    return summarize(original, derained)