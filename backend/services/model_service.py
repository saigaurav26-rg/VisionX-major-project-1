"""
HRS-Net model service.

Loads trained weights exactly once at startup with strict=True validation,
runs a smoke test, and serves the cached model for inference.
"""

import logging
import os
import time
from pathlib import Path

import torch

from backend.model.hrsnet import HRSNet

logger = logging.getLogger("visionx.model")

# ===================== CONFIGURATION =====================

MODEL_URL = "https://huggingface.co/NSG04/visionx-model/resolve/main/best_model_new.pth"
MODEL_FILENAME = "best_model_new.pth"
MODEL_VERSION = "1.0"

DEFAULT_IN_CHANNELS = 3
DEFAULT_CHANNELS = 64
DEFAULT_NUM_BLOCKS = 12
DEFAULT_NUM_HEADS = 8


class ModelService:
    """Singleton model service for HRS-Net."""

    _instance = None

    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.device_name = "CUDA" if torch.cuda.is_available() else "CPU"
        self.model: HRSNet | None = None
        self.ready = False
        self.last_error: str | None = None
        self.checkpoint_path: str | None = None
        self.param_count: int = 0

    @classmethod
    def instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _resolve_weights_path(self) -> Path:
        """Ensure weights file exists locally; download if missing."""
        candidates = [
            Path("models") / MODEL_FILENAME,
            Path("backend") / "model" / MODEL_FILENAME,
            Path("/home/user/project/models") / MODEL_FILENAME,
        ]
        for c in candidates:
            if c.exists():
                return c

        # Download
        target = Path("models") / MODEL_FILENAME
        target.parent.mkdir(parents=True, exist_ok=True)
        try:
            import urllib.request
            logger.info("Downloading model weights from %s", MODEL_URL)
            with urllib.request.urlopen(MODEL_URL, timeout=60) as resp:
                data = resp.read()
            target.write_bytes(data)
            logger.info("Saved model to %s", target)
            return target
        except Exception as e:
            logger.error("Model download failed: %s", e)
            raise RuntimeError(f"Model weights could not be downloaded: {e}")

    def initialize(self):
        """Build HRS-Net, load strict state_dict, smoke-test, mark ready."""
        logger.info("Initializing HRS-Net...")
        try:
            weight_path = self._resolve_weights_path()
            self.checkpoint_path = str(weight_path)
            logger.info("Weights path: %s", self.checkpoint_path)

            self.model = HRSNet(
                in_channels=DEFAULT_IN_CHANNELS,
                channels=DEFAULT_CHANNELS,
                num_blocks=DEFAULT_NUM_BLOCKS,
                num_heads=DEFAULT_NUM_HEADS,
            )
            self.param_count = sum(p.numel() for p in self.model.parameters())
            logger.info(
                "Model built: channels=%d num_blocks=%d num_heads=%d params=%d",
                DEFAULT_CHANNELS,
                DEFAULT_NUM_BLOCKS,
                DEFAULT_NUM_HEADS,
                self.param_count,
            )

            logger.info("Loading state_dict (strict=True)...")
            checkpoint = torch.load(weight_path, map_location=self.device)
            # weights file is a raw state_dict per user spec
            self.model.load_state_dict(checkpoint, strict=True)
            logger.info("State_dict loaded with strict=True (architecture verified)")

            self.model.to(self.device)
            self.model.eval()

            # Smoke test
            logger.info("Running smoke test...")
            with torch.no_grad():
                dummy = torch.zeros(1, 3, 64, 64, device=self.device)
                out = self.model(dummy)
            assert out.shape == dummy.shape, f"Smoke test shape mismatch: {out.shape}"
            logger.info("Smoke test passed (output shape: %s)", tuple(out.shape))

            self.ready = True
            self.last_error = None
            logger.info("Device: %s | Ready for inference", self.device_name)
            return True
        except Exception as e:
            self.ready = False
            self.last_error = str(e)
            logger.exception("Model initialization failed: %s", e)
            return False

    def info(self) -> dict:
        return {
            "ready": self.ready,
            "device": self.device_name,
            "model_name": "VisionX Engine",
            "model_version": MODEL_VERSION,
            "model_file": MODEL_FILENAME,
            "checkpoint_path": self.checkpoint_path,
            "param_count": self.param_count,
            "config": {
                "in_channels": DEFAULT_IN_CHANNELS,
                "channels": DEFAULT_CHANNELS,
                "num_blocks": DEFAULT_NUM_BLOCKS,
                "num_heads": DEFAULT_NUM_HEADS,
            },
            "components": [
                "DWT (custom Haar wavelet decomposition)",
                "IWT (custom inverse wavelet)",
                "head (3x3 conv after DWT)",
                "down1 / down2 (multi-scale)",
                "transformer_full (4 x RestormerBlock)",
                "transformer_half (4 x RestormerBlock)",
                "transformer_quarter (4 x RestormerBlock)",
                "restormer_extra1",
                "restormer_extra2",
                "FrequencyAttention (FFT magnitude + phase)",
                "ChannelAttention",
                "SpatialAttention",
                "up1 / up2 (ConvTranspose2d)",
                "fusion1 / fusion2",
                "tail (3x3 conv -> ReLU -> 3x3 conv)",
            ],
            "last_error": self.last_error,
        }


def get_model_service() -> ModelService:
    return ModelService.instance()