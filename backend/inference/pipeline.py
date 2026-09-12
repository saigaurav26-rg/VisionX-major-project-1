"""
HRS-Net inference pipeline (Render CPU Optimized).
- Validates image
- Fast Downscaling for high-res inputs (CPU safety)
- Uses torch.inference_mode() & thread limits
- Clamps output and crops to original dimensions
"""

import logging
import time

import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image
from torchvision import transforms

from backend.services.model_service import get_model_service

logger = logging.getLogger("visionx.inference")

# --- CPU SPEEDUP CONFIGURATIONS ---
# Render CPU ke resource contention ko kam karne ke liye threads limit karein
torch.set_num_threads(2)

TILE_PIXEL_THRESHOLD = 1024 * 1024  # 1 MP
TILE_SIZE = 512
TILE_OVERLAP = 32

# Max resolution cap to prevent CPU timeouts (e.g., max 1280px side)
MAX_INFERENCE_DIM = 1280 


def load_and_validate(path: str) -> tuple[Image.Image, tuple[int, int]]:
    img = Image.open(path)
    img.verify()
    img = Image.open(path).convert("RGB")
    if img.size[0] == 0 or img.size[1] == 0:
        raise ValueError("Image has zero dimensions")
    return img, img.size  # (W, H)


def _dwt_compatible_pad(h: int, w: int) -> tuple[int, int, int, int]:
    pad_h = (8 - h % 8) % 8
    pad_w = (8 - w % 8) % 8
    return 0, pad_w, 0, pad_h  # left, right, top, bottom


def _infer_single(model, tensor: torch.Tensor, device) -> torch.Tensor:
    # torch.no_grad() se fast runtime: inference_mode Enforce karein
    with torch.inference_mode():
        out = model(tensor.to(device))
    return out


def _run_tiled(model, img_tensor: torch.Tensor, device) -> torch.Tensor:
    """Optimized Tiled inference using cached windows."""
    _, _, H, W = img_tensor.shape
    full_out = torch.zeros((1, 3, H, W), dtype=torch.float32)
    weight_sum = torch.zeros((1, 1, H, W), dtype=torch.float32)

    step = TILE_SIZE - TILE_OVERLAP
    ys = list(range(0, max(1, H - TILE_OVERLAP), step))
    xs = list(range(0, max(1, W - TILE_OVERLAP), step))
    if ys[-1] + TILE_OVERLAP < H:
        ys.append(H - TILE_SIZE if H - TILE_SIZE >= 0 else 0)
    if xs[-1] + TILE_OVERLAP < W:
        xs.append(W - TILE_SIZE if W - TILE_SIZE >= 0 else 0)

    # Pre-calculated Hann window
    win1d = torch.hann_window(TILE_SIZE)
    win2d = (win1d.unsqueeze(0) * win1d.unsqueeze(1)).unsqueeze(0).unsqueeze(0)

    with torch.inference_mode():
        for y in ys:
            for x in xs:
                y0 = min(y, H - TILE_SIZE)
                x0 = min(x, W - TILE_SIZE)
                tile = img_tensor[:, :, y0:y0 + TILE_SIZE, x0:x0 + TILE_SIZE]
                out_tile = model(tile.to(device)).cpu()
                full_out[:, :, y0:y0 + TILE_SIZE, x0:x0 + TILE_SIZE] += out_tile * win2d
                weight_sum[:, :, y0:y0 + TILE_SIZE, x0:x0 + TILE_SIZE] += win2d

    full_out = full_out / weight_sum.clamp(min=1e-6)
    return full_out


def run(image_path: str) -> dict:
    svc = get_model_service()
    if not svc.ready:
        if not svc.initialize():
            raise RuntimeError(f"Model not ready: {svc.last_error}")

    pil_img, (W, H) = load_and_validate(image_path)
    original_size = (W, H)

    # Render CPU Guard: Auto-downscale very large images to avoid 60s timeouts
    target_img = pil_img
    if max(W, H) > MAX_INFERENCE_DIM:
        scale = MAX_INFERENCE_DIM / float(max(W, H))
        new_w, new_h = int(W * scale), int(H * scale)
        target_img = pil_img.resize((new_w, new_h), Image.Resampling.BILINEAR)

    t_W, t_H = target_img.size
    pad_l, pad_r, pad_t, pad_b = _dwt_compatible_pad(t_H, t_W)
    tensor = transforms.ToTensor()(target_img)
    
    if pad_l or pad_r or pad_t or pad_b:
        tensor = F.pad(tensor.unsqueeze(0), (pad_l, pad_r, pad_t, pad_b), mode="reflect").squeeze(0)
    input_tensor = tensor.unsqueeze(0)

    H_p, W_p = input_tensor.shape[-2:]
    total_pixels = H_p * W_p

    start = time.perf_counter()
    if total_pixels <= TILE_PIXEL_THRESHOLD:
        output = _infer_single(svc.model, input_tensor, svc.device)
    else:
        logger.info("Running tiled inference for %dx%d image", t_W, t_H)
        output = _run_tiled(svc.model, input_tensor, svc.device).to(svc.device)
    elapsed_ms = (time.perf_counter() - start) * 1000.0

    output = torch.clamp(output, 0, 1)
    arr = output.squeeze(0).permute(1, 2, 0).cpu().numpy()

    # Unpad cropped region
    arr = arr[: t_H + pad_t + pad_b, : t_W + pad_l + pad_r]
    arr = arr[pad_t : pad_t + t_H, pad_l : pad_l + t_W]

    derained = Image.fromarray((arr * 255).astype("uint8"))
    
    # Upscale back to original resolution if downscaling was applied
    if derained.size != original_size:
        derained = derained.resize(original_size, Image.Resampling.LANCZOS)

    return {
        "derained": derained,
        "original": pil_img,
        "processing_time_ms": elapsed_ms,
        "device": svc.device_name,
        "input_width": original_size[0],
        "input_height": original_size[1],
        "output_width": derained.size[0],
        "output_height": derained.size[1],
        "padded": bool(pad_l or pad_r or pad_t or pad_b),
        "tiled": total_pixels > TILE_PIXEL_THRESHOLD,
    }