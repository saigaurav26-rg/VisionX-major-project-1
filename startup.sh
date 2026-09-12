#!/bin/bash
set -eu
cd /workspace
export PATH="${HOME}/.local/bin:${PATH}"
export PYTHONPATH=/workspace
export PYTHONUNBUFFERED=1

start_backend() {
  if curl -sf -o /dev/null http://127.0.0.1:8000/api/health; then
    return 0
  fi
  python3 -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 >/tmp/visionx-backend.log 2>&1 &
}

start_frontend() {
  if curl -sf -o /dev/null http://127.0.0.1:8080/; then
    return 0
  fi
  npm run dev >/tmp/visionx-dev.log 2>&1 &
}

start_backend || true
start_frontend

i=0
while [ "$i" -lt 90 ]; do
  if curl -sf -o /dev/null http://127.0.0.1:8080/; then
    exit 0
  fi
  i=$((i + 1))
  sleep 1
done
echo "VisionX dev server failed to start" >&2
tail -n 80 /tmp/visionx-dev.log >&2 || true
exit 1
