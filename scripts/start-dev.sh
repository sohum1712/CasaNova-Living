#!/usr/bin/env bash
# CasaNova Living — start backend + frontend (Unix / Git Bash)
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

CYAN='\033[0;36m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
RED='\033[0;31m'; GRAY='\033[0;37m'; NC='\033[0m'

echo -e "${CYAN}  CasaNova Living — Dev Environment${NC}"
echo -e "${GRAY}  =========================================${NC}"

check_cmd() {
    if ! command -v "$1" &>/dev/null; then
        echo -e "${RED}  ✗ '$1' not found. Please install it.${NC}"; exit 1
    fi
}
check_cmd python3; check_cmd node; check_cmd npm

if [ ! -f ".env" ]; then
    if [ -f "env.example" ]; then
        echo -e "${YELLOW}  ⚠ No .env — copying from env.example${NC}"
        cp env.example .env
        echo -e "${YELLOW}  Edit .env with your DB credentials, then press Enter.${NC}"
        read -r
    else
        echo -e "${RED}  ✗ No .env or env.example found.${NC}"; exit 1
    fi
fi
cp .env backend/.env
echo -e "${GREEN}  ✓ .env synced to backend/${NC}"

echo ""
echo -e "${CYAN}  [1/4] Python backend...${NC}"
if [ ! -d "backend/venv" ]; then
    python3 -m venv backend/venv
fi
# shellcheck source=/dev/null
source backend/venv/bin/activate
pip install -r backend/requirements.txt -q
echo -e "${GREEN}  ✓ Backend dependencies ready${NC}"

echo ""
echo -e "${CYAN}  [2/4] Database seed (optional)...${NC}"
python database/setup.py || echo -e "${YELLOW}  ⚠ DB setup had issues — check PostgreSQL and backend/.env${NC}"
deactivate

echo ""
echo -e "${CYAN}  [3/4] Frontend...${NC}"
if [ ! -d "frontend/node_modules" ]; then
    npm install --prefix frontend
fi
echo -e "${GREEN}  ✓ Frontend dependencies ready${NC}"

echo ""
echo -e "${CYAN}  [4/4] Launching...${NC}"

(cd backend && ./venv/bin/python startup.py) &
BACKEND_PID=$!

(cd frontend && npm run dev) &
FRONTEND_PID=$!

sleep 2
echo ""
echo -e "${GRAY}  =========================================${NC}"
echo -e "${GREEN}  Services running${NC}"
echo -e "${GRAY}  =========================================${NC}"
echo -e "  Frontend  → ${CYAN}http://localhost:5173${NC}"
echo -e "  Backend   → ${CYAN}http://localhost:8000${NC}"
echo -e "  API Docs  → ${CYAN}http://localhost:8000/docs${NC}"
echo -e "${GRAY}  =========================================${NC}"
echo -e "  Press ${RED}Ctrl+C${NC} to stop"

cleanup() {
    echo -e "\n${YELLOW}  Stopping...${NC}"
    kill $BACKEND_PID 2>/dev/null; kill $FRONTEND_PID 2>/dev/null
    wait $BACKEND_PID 2>/dev/null; wait $FRONTEND_PID 2>/dev/null
    echo -e "${GREEN}  Done.${NC}"; exit 0
}
trap cleanup SIGINT SIGTERM
wait
