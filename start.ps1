# CasaNova Living — Dev Startup (PowerShell)
$ErrorActionPreference = "Stop"

function Write-Step($msg) { Write-Host "  [STEP] $msg" -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "  [OK]   $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "  [WARN] $msg" -ForegroundColor Yellow }
function Write-Err($msg)  { Write-Host "  [ERR]  $msg" -ForegroundColor Red }

Write-Host ""
Write-Host "  ==========================================" -ForegroundColor DarkGray
Write-Host "   CasaNova Living — Dev Environment"        -ForegroundColor Cyan
Write-Host "  ==========================================" -ForegroundColor DarkGray
Write-Host ""

# ── .env sync ─────────────────────────────────────────────────────────────────
if (-not (Test-Path ".env")) {
    if (Test-Path "env.example") {
        Write-Warn "No .env found — copying from env.example"
        Copy-Item "env.example" ".env"
        Write-Warn "Edit .env with your DB credentials, then press Enter."
        Read-Host
    } else {
        Write-Err "No .env or env.example found."; exit 1
    }
}
Write-Step "Syncing .env to backend..."
Copy-Item ".env" "backend\.env" -Force
Write-Ok ".env synced"

# ── Backend venv ──────────────────────────────────────────────────────────────
Write-Host ""
Write-Step "Setting up Python backend..."
if (-not (Test-Path "backend\venv")) {
    Write-Step "Creating virtual environment..."
    python -m venv backend\venv
    if ($LASTEXITCODE -ne 0) { Write-Err "Failed to create venv."; exit 1 }
}
Write-Step "Installing Python dependencies..."
& "backend\venv\Scripts\pip.exe" install -r "backend\requirements.txt" -q
if ($LASTEXITCODE -ne 0) { Write-Err "pip install failed."; exit 1 }
Write-Ok "Backend dependencies ready"

# ── Database setup ────────────────────────────────────────────────────────────
Write-Host ""
Write-Step "Running database setup (tables + admin user)..."
try {
    & "backend\venv\Scripts\python.exe" "database\setup.py"
    Write-Ok "Database ready"
} catch {
    Write-Warn "Database setup had issues — backend will still start."
    Write-Warn "Check that PostgreSQL is running and backend\.env credentials are correct."
}

# ── Frontend ──────────────────────────────────────────────────────────────────
Write-Host ""
Write-Step "Setting up React frontend..."
if (-not (Test-Path "frontend\node_modules")) {
    Push-Location frontend; npm install; Pop-Location
    if ($LASTEXITCODE -ne 0) { Write-Err "npm install failed."; exit 1 }
}
Write-Ok "Frontend dependencies ready"

# ── Launch ────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Step "Launching Backend (FastAPI on :8000)..."
Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "cd backend; .\venv\Scripts\Activate.ps1; python startup.py"
) -WindowStyle Normal

Write-Step "Launching Frontend (Vite on :5173)..."
Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "cd frontend; npm run dev"
) -WindowStyle Normal

Write-Host ""
Write-Host "  ==========================================" -ForegroundColor DarkGray
Write-Host "   All services launched!" -ForegroundColor Green
Write-Host "  ==========================================" -ForegroundColor DarkGray
Write-Host "   Frontend  ->  http://localhost:5173"      -ForegroundColor Cyan
Write-Host "   Backend   ->  http://localhost:8000"      -ForegroundColor Cyan
Write-Host "   API Docs  ->  http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "   Health    ->  http://localhost:8000/api/health" -ForegroundColor Cyan
Write-Host "  ==========================================" -ForegroundColor DarkGray
Write-Host ""
Write-Host "   Default login: admin / admin123" -ForegroundColor Yellow
Write-Host ""
