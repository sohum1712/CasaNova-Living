@echo off
setlocal EnableDelayedExpansion
title CasaNova Living — Dev Startup

echo.
echo  ==========================================
echo   CasaNova Living - Dev Environment
echo  ==========================================
echo.

:: ── .env sync ────────────────────────────────────────────────────────────────
if not exist ".env" (
    if exist "env.example" (
        echo [WARN] No .env found — copying from env.example
        copy env.example .env >nul
        echo [INFO] Edit .env with your DB credentials, then press any key.
        pause
    ) else (
        echo [ERROR] No .env or env.example found.
        pause & exit /b 1
    )
)
echo [INFO] Syncing .env to backend...
copy /Y .env backend\.env >nul

:: ── Backend venv ──────────────────────────────────────────────────────────────
echo.
echo [STEP] Setting up Python backend...
if not exist "backend\venv" (
    echo [INFO] Creating virtual environment...
    python -m venv backend\venv
    if errorlevel 1 ( echo [ERROR] Failed to create venv. & pause & exit /b 1 )
)
echo [INFO] Installing Python dependencies...
call backend\venv\Scripts\activate.bat
pip install -r backend\requirements.txt -q
call deactivate

:: ── Database setup ────────────────────────────────────────────────────────────
echo.
echo [STEP] Running database setup...
call backend\venv\Scripts\activate.bat
python database\setup.py
if errorlevel 1 (
    echo [WARN] Database setup had issues — check output above.
    echo        Backend will still start; tables are created on first request.
)
call deactivate

:: ── Frontend ──────────────────────────────────────────────────────────────────
echo.
echo [STEP] Setting up React frontend...
if not exist "frontend\node_modules" (
    echo [INFO] Installing npm packages...
    cd frontend & npm install & cd ..
    if errorlevel 1 ( echo [ERROR] npm install failed. & pause & exit /b 1 )
)

:: ── Launch ────────────────────────────────────────────────────────────────────
echo.
echo [STEP] Launching Backend (FastAPI)...
start "CasaNova Backend" cmd /k "cd backend && call venv\Scripts\activate.bat && python startup.py"

echo [STEP] Launching Frontend (React/Vite)...
start "CasaNova Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo  ==========================================
echo   Services launched in separate windows
echo  ==========================================
echo   Frontend  ^>  http://localhost:5173
echo   Backend   ^>  http://localhost:8000
echo   API Docs  ^>  http://localhost:8000/docs
echo   Health    ^>  http://localhost:8000/api/health
echo  ==========================================
echo.
pause
