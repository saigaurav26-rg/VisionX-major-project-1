#!/bin/bash
cd /workspace
export PYTHONPATH=/workspace
exec python3 -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 > /tmp/visionx-backend.log 2>&1
