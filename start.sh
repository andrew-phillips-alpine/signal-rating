#!/usr/bin/env bash
set -euo pipefail

pick_port() {
  local start=$1
  local end=$2
  for ((port=start; port<=end; port++)); do
    if ! lsof -i :"$port" >/dev/null 2>&1; then
      echo "$port"
      return
    fi
  done
  echo "0"
}

FRONTEND_PORT=$(pick_port 5173 5185)
BACKEND_PORT=$(pick_port 3001 3013)

if [ "$FRONTEND_PORT" = "0" ] || [ "$BACKEND_PORT" = "0" ]; then
  echo "No free dev ports found. Close other processes and retry."
  exit 1
fi

export PORT=$BACKEND_PORT
export NEXT_PUBLIC_API_BASE="http://localhost:${BACKEND_PORT}"

echo "Starting frontend on :$FRONTEND_PORT and backend on :$BACKEND_PORT"
echo "Frontend: http://localhost:${FRONTEND_PORT}"
echo "Backend APIs: http://localhost:${BACKEND_PORT}/api/*"

npx concurrently \
  "PORT=${FRONTEND_PORT} next dev --port ${FRONTEND_PORT}" \
  "node server.js"
