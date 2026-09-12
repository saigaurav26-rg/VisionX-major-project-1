"""Smoke test: instantiate HRS-Net, load weights strict=True, run inference."""
import logging
import sys

logging.basicConfig(level=logging.INFO, format="%(message)s")

sys.path.insert(0, ".")

from backend.services.model_service import get_model_service

if __name__ == "__main__":
    svc = get_model_service()
    ok = svc.initialize()
    print("\n=== RESULT ===")
    print("Ready:", svc.ready)
    print("Device:", svc.device_name)
    print("Error:", svc.last_error)
    print("Info:", svc.info())
    sys.exit(0 if ok else 1)