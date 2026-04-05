#!/usr/bin/env bash
# CasaNova Living — one-time dev environment (Python venv, npm, .env sync)
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

echo "CasaNova Living — environment setup"
echo "===================================="

command_exists() { command -v "$1" >/dev/null 2>&1; }

if ! command_exists node; then
    echo "ERROR: Node.js 18+ required."; exit 1
fi
if ! command_exists python3; then
    echo "ERROR: Python 3.10+ required."; exit 1
fi

if [ ! -f ".env" ]; then
    if [ -f "env.example" ]; then
        cp env.example .env
        echo "Created .env from env.example — edit DB_* and JWT_SECRET_KEY."
    else
        echo "ERROR: No env.example at repo root."; exit 1
    fi
fi

cp .env backend/.env
echo "Synced .env → backend/.env"

if [ ! -d "backend/venv" ]; then
    python3 -m venv backend/venv
fi
# shellcheck source=/dev/null
source backend/venv/bin/activate
pip install --upgrade pip -q
pip install -r backend/requirements.txt -q
deactivate
echo "Backend venv ready."

if [ ! -d "frontend/node_modules" ]; then
    npm install --prefix frontend
else
    echo "frontend/node_modules already present."
fi

echo ""
echo "Done. Start the stack with: ./start-dev.sh  (or start.ps1 / start.bat on Windows)"
