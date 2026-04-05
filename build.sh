#!/usr/bin/env bash
# Build frontend and copy into backend/static for Railway deployment
set -e

echo "==> Installing frontend dependencies..."
cd frontend
npm install

echo "==> Building frontend..."
npm run build

echo "==> Copying build to backend/static..."
cd ..
rm -rf backend/static
mkdir -p backend/static
cp -r frontend/dist/* backend/static/

echo "==> Build complete. backend/static is ready."
