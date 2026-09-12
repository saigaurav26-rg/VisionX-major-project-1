"""
HRS-Net inference pipeline.
- Validates image
- Adds DWT-compatible padding
- Runs the cached HRS-Net (tiled for large images to control memory)
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


def load_and_validate(path: str) -> tuple[Image.Image, tuple[int, int]]:
    img = Image.open(path)
    img.verify()
    img = Image.open(path).convert("RGB")
    if img.size[0] == 0 or img.size[1] == 0:
        raise ValueError("Image has zero dimensions")
    return img, img.size  # (W, H)


def _dwt_compatible_pad(h: int, w: int) -> tuple[int, int, int, int]:
    """Pad to the next multiple of 8.

    Network depth: DWT(÷2) → down1(÷2, total ÷4) → down2(÷2, total ÷8) →
    up1(×2, ÷4) → up1(×2, ÷2) → IWT(×2). Padding to a multiple of 8 ensures
    both down1 and down2 layers produce even-sized outputs that the matching
    up-samples reproduce exactly.
    """
    pad_h = (8 - h % 8) % 8
    pad_w = (8 - w % 8) % 8
    return 0, pad_w, 0, pad_h  # left, right, top, bottom


# Tile threshold (pixels). Images with total pixel count above this are
# processed in overlapping tiles to keep peak memory bounded.
TILE_PIXEL_THRESHOLD = 1024 * 1024  # 1 MP
TILE_SIZE = 512           # spatial size per tile (pixels)
TILE_OVERLAP = 32         # overlap between adjacent tiles


def _infer_single(model, tensor: torch.Tensor, device) -> torch.Tensor:
    """Run the model on a single padded tensor and return the unpadded tensor."""
    with torch.no_grad():
        out = model(tensor.to(device))
    return out


def _run_tiled(model, img_tensor: torch.Tensor, device) -> torch.Tensor:
    """Run HRS-Net tile-by-tile over a large image with overlap-blending."""
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

    # Hann window for smooth blending in the overlap region
    win1d = torch.hann_window(TILE_SIZE)
    win2d = (win1d.unsqueeze(0) * win1d.unsqueeze(1)).unsqueeze(0).unsqueeze(0)

    for y in ys:
        for x in xs:
            y0 = min(y, H - TILE_SIZE)
            x0 = min(x, W - TILE_SIZE)
            tile = img_tensor[:, :, y0:y0 + TILE_SIZE, x0:x0 + TILE_SIZE]
            out_tile = _infer_single(model, tile, device).cpu()
            full_out[:, :, y0:y0 + TILE_SIZE, x0:x0 + TILE_SIZE] += out_tile * win2d
            weight_sum[:, :, y0:y0 + TILE_SIZE, x0:x0 + TILE_SIZE] += win2d

    full_out = full_out / weight_sum.clamp(min=1e-6)
    return full_out


def run(image_path: str) -> dict:
    """Run real HRS-Net inference. Returns metadata + PIL Image."""
    svc = get_model_service()
    if not svc.ready:
        if not svc.initialize():
            raise RuntimeError(f"Model not ready: {svc.last_error}")

    pil_img, (W, H) = load_and_validate(image_path)
    original_size = (W, H)

    pad_l, pad_r, pad_t, pad_b = _dwt_compatible_pad(H, W)
    tensor = transforms.ToTensor()(pil_img)  # (C, H, W) in [0, 1]
    if pad_l or pad_r or pad_t or pad_b:
        tensor = F.pad(tensor.unsqueeze(0), (pad_l, pad_r, pad_t, pad_b), mode="reflect").squeeze(0)
    input_tensor = tensor.unsqueeze(0)

    H_p, W_p = input_tensor.shape[-2:]
    total_pixels = H_p * W_p

    start = time.perf_counter()
    if total_pixels <= TILE_PIXEL_THRESHOLD:
        output = _infer_single(svc.model, input_tensor, svc.device)
    else:
        logger.info(
            "Large image %dx%d (%d px) — running tiled inference",
            W, H, total_pixels,
        )
        output = _run_tiled(svc.model, input_tensor, svc.device).to(svc.device)
    elapsed_ms = (time.perf_counter() - start) * 1000.0

    output = torch.clamp(output, 0, 1)
    arr = output.squeeze(0).permute(1, 2, 0).cpu().numpy()

    # Crop back to padded size first, then to original size
    arr = arr[: H + pad_t + pad_b, : W + pad_l + pad_r]
    arr = arr[pad_t : pad_t + H, pad_l : pad_l + W]

    derained = Image.fromarray((arr * 255).astype("uint8"))
    if derained.size != original_size:
        derained = derained.resize(original_size, Image.LANCZOS)

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