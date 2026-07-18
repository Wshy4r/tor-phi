#!/bin/zsh

set -e

cd "$(dirname "$0")"

echo "Starting TOR Phi..."
echo "Project folder: $(pwd)"

if [ ! -d "node_modules" ]; then
  echo "Dependencies are missing. Running npm install..."
  npm install
fi

echo "Launching local server..."
echo "Starting social capture control API on http://127.0.0.1:8787 ..."
npm run social:control &
SOCIAL_CONTROL_PID=$!

cleanup() {
  if kill -0 "$SOCIAL_CONTROL_PID" >/dev/null 2>&1; then
    kill "$SOCIAL_CONTROL_PID" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT INT TERM

npm run dev
