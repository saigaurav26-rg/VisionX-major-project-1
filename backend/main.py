"""
VISIONX Backend (FastAPI)

Endpoints:
- POST /api/inference         (single image derain)
- POST /api/inference/batch   (batch derain)
- GET  /api/health
- GET  /api/model-info
- GET  /api/inference-history
- DELETE /api/inference-history/{id}
- POST /api/analyze/restoration
- POST /api/analyze/xray
- POST /api/analyze/objects
- POST /api/vision-assistant

All inference uses the cached, strict-loaded HRS-Net model.
Analysis endpoints operate on stored inference results when available.
"""

import asyncio
import base64
import io
import logging
import os
import secrets
import time
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, Response
from PIL import Image

from backend.inference import pipeline as inference_pipeline
from backend.services import analysis_service, history_store, image_service, model_service, object_service, vision_service

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("visionx.api")

app = FastAPI(title="VISIONX API", version="1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Concurrency lock for inference (avoid GPU contention)
_inference_lock = asyncio.Lock()


@app.on_event("startup")
def _startup():
    logger.info("=" * 60)
    logger.info("VISIONX Engine starting...")
    logger.info("=" * 60)
    image_service.ensure_dirs()
    history_store.init()

    def _init_model():
        svc = model_service.get_model_service()
        ok = svc.initialize()
        if ok:
            logger.info("VISIONX Engine ready.")
        else:
            logger.error("VISIONX Engine initialization failed: %s", svc.last_error)

    import threading
    threading.Thread(target=_init_model, daemon=True, name="visionx-model-init").start()



def _img_to_data_url(img: Image.Image, fmt: str = "PNG") -> str:
    buf = io.BytesIO()
    img.save(buf, format=fmt)
    return f"data:image/{fmt.lower()};base64,{base64.b64encode(buf.getvalue()).decode()}"


def _read_upload(file: UploadFile) -> tuple[str, bytes]:
    filename = file.filename or "upload"
    data = file.file.read()
    ok, msg = image_service.validate_image_bytes(data)
    if not ok:
        raise HTTPException(status_code=400, detail=msg)
    return filename, data


def _perform_inference(filename: str, data: bytes) -> dict:
    """Run HRS-Net inference and return metadata dict."""
    input_path = image_service.save_upload(filename, data)
    try:
        result = inference_pipeline.run(str(input_path))
    except torch.cuda.OutOfMemoryError as e:
        logger.exception("CUDA OOM")
        raise HTTPException(
            status_code=507,
            detail=f"Insufficient GPU memory for this image. Try a smaller image or use CPU. ({e})",
        )
    except RuntimeError as e:
        logger.exception("Inference RuntimeError")
        msg = str(e)
        if "Sizes of tensors must match" in msg or "shape" in msg.lower():
            raise HTTPException(
                status_code=400,
                detail=f"Image dimensions are not supported by the model: {msg[:200]}",
            )
        raise HTTPException(status_code=500, detail=f"Inference error: {msg[:300]}")
    except Exception as e:
        logger.exception("Inference error")
        raise HTTPException(status_code=500, detail=f"Inference failed: {type(e).__name__}: {e}")

    output_path = image_service.save_output(filename, result["derained"], fmt="PNG")

    entry_id = secrets.token_hex(8)
    history_store.add_entry(
        {
            "id": entry_id,
            "ts": time.time(),
            "filename": filename,
            "input_w": result["input_width"],
            "input_h": result["input_height"],
            "output_w": result["output_width"],
            "output_h": result["output_height"],
            "processing_ms": result["processing_time_ms"],
            "device": result["device"],
            "model_version": "1.0",
            "output_path": str(output_path),
            "original_path": str(input_path),
        }
    )

    metrics = analysis_service.compute_metrics(result["original"], result["derained"])

    return {
        "success": True,
        "request_id": entry_id,
        "filename": filename,
        "original_image": _img_to_data_url(result["original"]),
        "derained_image": _img_to_data_url(result["derained"]),
        "processing_time": round(result["processing_time_ms"], 2),
        "model_name": "VisionX Engine",
        "model_version": "1.0",
        "device": result["device"],
        "input_width": result["input_width"],
        "input_height": result["input_height"],
        "output_width": result["output_width"],
        "output_height": result["output_height"],
        "metrics": metrics,
        "download_filename": image_service.build_derained_filename(filename, "PNG"),
        "original_url": f"/api/image/{Path(input_path).name}",
        "derained_url": f"/api/image/{Path(output_path).name}",
        "tiled": result.get("tiled", False),
        "padded": result.get("padded", False),
    }


@app.get("/api/health")
def health():
    svc = model_service.get_model_service()
    return {"status": "ok", "model_ready": svc.ready, "device": svc.device_name}


@app.get("/api/model-info")
def model_info():
    svc = model_service.get_model_service()
    return svc.info()


@app.post("/api/inference")
async def inference(file: UploadFile = File(...)):
    filename, data = _read_upload(file)
    async with _inference_lock:
        return _perform_inference(filename, data)


@app.post("/api/inference/batch")
async def inference_batch(files: list[UploadFile] = File(...)):
    results = []
    for f in files:
        try:
            filename, data = _read_upload(f)
            async with _inference_lock:
                results.append(_perform_inference(filename, data))
        except HTTPException as e:
            results.append({"success": False, "filename": f.filename, "error": e.detail})
        except Exception as e:
            logger.exception("Batch inference error")
            results.append({"success": False, "filename": f.filename, "error": str(e)})
    return {"success": True, "results": results}


@app.get("/api/inference-history")
def inference_history():
    return {"entries": history_store.list_entries()}


@app.delete("/api/inference-history/{entry_id}")
def delete_history(entry_id: str):
    entry = history_store.get_entry(entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    history_store.delete_entry(entry_id)
    # Best-effort file cleanup
    for k in ("output_path", "original_path"):
        try:
            p = Path(entry.get(k, ""))
            if p.exists():
                p.unlink()
        except Exception:
            pass
    return {"success": True}


@app.get("/api/image/{name}")
def get_image(name: str):
    """Serve a stored image by sanitized filename (uploads or outputs)."""
    safe = image_service.secure_filename(name)
    for d in (image_service.OUTPUT_DIR, image_service.UPLOAD_DIR):
        p = d / safe
        if p.exists() and p.is_file():
            return FileResponse(p)
    raise HTTPException(status_code=404, detail="Image not found")


@app.post("/api/analyze/restoration")
async def analyze_restoration(file: UploadFile = File(...), derained_file: UploadFile = File(None)):
    """Compute restoration metrics and return data URLs of residual/detail maps."""
    filename, data = _read_upload(file)
    original = Image.open(io.BytesIO(data)).convert("RGB")
    if derained_file is not None:
        _, ddata = _read_upload(derained_file)
        derained = Image.open(io.BytesIO(ddata)).convert("RGB")
    else:
        # Re-run inference
        path = image_service.save_upload(filename, data)
        result = inference_pipeline.run(str(path))
        derained = result["derained"]

    residual = analysis_service.restoration_residual_map(original, derained)
    detail = analysis_service.detail_map(original, derained)
    metrics = analysis_service.compute_metrics(original, derained)
    return {
        "success": True,
        "metrics": metrics,
        "residual_map_url": _img_to_data_url(residual),
        "detail_map_url": _img_to_data_url(detail),
        "original_url": _img_to_data_url(original),
        "derained_url": _img_to_data_url(derained),
    }


@app.post("/api/analyze/xray")
async def analyze_xray(file: UploadFile = File(...), derained_file: UploadFile = File(None)):
    filename, data = _read_upload(file)
    original = Image.open(io.BytesIO(data)).convert("RGB")
    if derained_file is not None:
        _, ddata = _read_upload(derained_file)
        derained = Image.open(io.BytesIO(ddata)).convert("RGB")
    else:
        path = image_service.save_upload(filename, data)
        result = inference_pipeline.run(str(path))
        derained = result["derained"]

    detail = analysis_service.detail_map(original, derained)
    edge_o = analysis_service.edge_map(original)
    edge_d = analysis_service.edge_map(derained)
    edge_diff = analysis_service.edge_difference(original, derained)
    residual = analysis_service.restoration_residual_map(original, derained)
    return {
        "success": True,
        "detail_map_url": _img_to_data_url(detail),
        "edge_original_url": _img_to_data_url(edge_o),
        "edge_derained_url": _img_to_data_url(edge_d),
        "edge_difference_url": _img_to_data_url(edge_diff),
        "residual_url": _img_to_data_url(residual),
    }


@app.post("/api/analyze/objects")
async def analyze_objects(file: UploadFile = File(...), derained_file: UploadFile = File(None)):
    filename, data = _read_upload(file)
    original = Image.open(io.BytesIO(data)).convert("RGB")
    if derained_file is not None:
        _, ddata = _read_upload(derained_file)
        derained = Image.open(io.BytesIO(ddata)).convert("RGB")
    else:
        path = image_service.save_upload(filename, data)
        result = inference_pipeline.run(str(path))
        derained = result["derained"]

    regions = object_service.analyze_regions(original, derained)
    overlay = object_service.detection_fallback_overlay(derained)
    return {
        "success": True,
        "regions": regions,
        "detector": "VisionX saliency/contrast analysis (indicative, not a general object detector)",
        "original_url": _img_to_data_url(original),
        "derained_url": _img_to_data_url(derained),
        "overlay_url": _img_to_data_url(overlay),
    }


@app.post("/api/vision-assistant")
async def vision_assistant(
    file: UploadFile = File(...),
    derained_file: UploadFile = File(None),
    question: str = Form(..., min_length=1, max_length=2000),
):
    filename, data = _read_upload(file)
    original = Image.open(io.BytesIO(data)).convert("RGB")
    if derained_file is not None:
        _, ddata = _read_upload(derained_file)
        derained = Image.open(io.BytesIO(ddata)).convert("RGB")
    else:
        path = image_service.save_upload(filename, data)
        result = inference_pipeline.run(str(path))
        derained = result["derained"]

    answer = vision_service.answer_question(question, original, derained)
    summary = vision_service.summarize(original, derained)
    return {"success": True, "answer": answer, "summary": summary}


@app.post("/api/blend")
async def blend(
    original_id: str = Query(...),
    derained_id: str = Query(...),
    alpha: float = Query(1.0, ge=0.0, le=1.0),
):
    """Apply Restoration Strength blending: output = (1-α)*original + α*derained."""
    op = image_service.OUTPUT_DIR / image_service.secure_filename(original_id)
    dp = image_service.OUTPUT_DIR / image_service.secure_filename(derained_id)
    if not op.exists() or not dp.exists():
        raise HTTPException(status_code=404, detail="Source images not found")
    orig = Image.open(op).convert("RGB")
    der = Image.open(dp).convert("RGB")
    if orig.size != der.size:
        der = der.resize(orig.size, Image.LANCZOS)
    import numpy as np
    a = np.asarray(orig, dtype=np.float32) / 255.0
    b = np.asarray(der, dtype=np.float32) / 255.0
    blended = (1.0 - alpha) * a + alpha * b
    blended = np.clip(blended, 0, 1)
    out = Image.fromarray((blended * 255).astype("uint8"))
    buf = io.BytesIO()
    out.save(buf, format="PNG")
    return Response(content=buf.getvalue(), media_type="image/png")


@app.exception_handler(HTTPException)
async def http_exc(_, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"success": False, "error": exc.detail})


@app.exception_handler(Exception)
async def unhandled(_, exc: Exception):
    logger.exception("Unhandled error")
    msg = f"{type(exc).__name__}: {exc}"
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": f"Internal server error — {msg}"},
    )