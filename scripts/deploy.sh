#!/usr/bin/env bash
# Build SPA into backend/static and deploy via Databricks Asset Bundles (optional path).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROFILE="DEFAULT"
TARGET="dev"

show_usage() {
    echo -e "${YELLOW}Usage: scripts/deploy.sh [OPTIONS]${NC}"
    echo "  --profile, -p   Databricks CLI profile (default: DEFAULT)"
    echo "  --target, -t    Bundle target (default: dev)"
    echo "  --help          This help"
}

while [[ $# -gt 0 ]]; do
    case $1 in
        --profile|-p) PROFILE="$2"; shift 2 ;;
        --target|-t) TARGET="$2"; shift 2 ;;
        --help) show_usage; exit 0 ;;
        *) echo -e "${RED}Unknown option: $1${NC}"; show_usage; exit 1 ;;
    esac
done

echo -e "${BLUE}CasaNova — production build + Databricks deploy${NC}"
echo -e "${BLUE}Profile: ${PROFILE}  Target: ${TARGET}${NC}"

if ! command -v databricks &> /dev/null; then
    echo -e "${RED}Databricks CLI not found. pip install databricks-cli${NC}"; exit 1
fi

WORKSPACE_HOST=$(databricks auth describe --profile "${PROFILE}" 2>/dev/null | grep "Host:" | cut -d' ' -f2)
if [ -z "$WORKSPACE_HOST" ]; then
    echo -e "${RED}Could not read workspace host for profile ${PROFILE}${NC}"; exit 1
fi
echo -e "${GREEN}Workspace: ${WORKSPACE_HOST}${NC}"

echo -e "${YELLOW}Building frontend...${NC}"
cd frontend
ENV_BACKUP=""
if [ -f ".env" ]; then
    ENV_BACKUP=".env.backup.$(date +%s)"
    mv .env "$ENV_BACKUP"
fi
if command -v bun &> /dev/null; then
    bun run build --mode production
elif command -v yarn &> /dev/null; then
    yarn build --mode production
else
    npm run build -- --mode production
fi
if [ -n "$ENV_BACKUP" ] && [ -f "$ENV_BACKUP" ]; then
    mv "$ENV_BACKUP" .env
fi
cd "$REPO_ROOT"

if [ ! -d "frontend/dist" ]; then
    echo -e "${RED}frontend/dist missing after build${NC}"; exit 1
fi

echo -e "${YELLOW}Copying to backend/static...${NC}"
rm -rf backend/static
mkdir -p backend/static
cp -r frontend/dist/* backend/static/

echo -e "${YELLOW}Databricks bundle deploy...${NC}"
databricks bundle deploy -t "${TARGET}" --profile "${PROFILE}"
databricks bundle run -t "${TARGET}" brickhouse_brands --profile "${PROFILE}"

echo -e "${GREEN}Deploy finished.${NC}"
