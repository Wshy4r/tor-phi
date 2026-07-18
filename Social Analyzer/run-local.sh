#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
VENV_DIR="$BACKEND_DIR/venv"

echo "=========================================="
echo " Social Analyzer Local Server"
echo "=========================================="

if [ ! -d "$BACKEND_DIR" ]; then
  echo "Error: backend directory not found at $BACKEND_DIR"
  exit 1
fi

cd "$BACKEND_DIR"

if [ ! -d "$VENV_DIR" ]; then
  echo "Creating virtual environment..."
  python3 -m venv "$VENV_DIR"
fi

source "$VENV_DIR/bin/activate"

if ! python3 -c "import flask, flask_cors, requests, bs4, playwright" >/dev/null 2>&1; then
  echo "Installing Python dependencies..."
  pip install -r requirements.txt
  echo "Installing Playwright browser..."
  playwright install chromium
fi

echo "Starting local server..."
echo "Open: http://127.0.0.1:5001"
echo

python3 app.py
