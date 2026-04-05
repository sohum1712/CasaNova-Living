# CasaNova API (FastAPI)

Python service for retail operations: auth (JWT), stores, inventory, products, POS, transfers, analytics.

## Run locally

From the **repository root** (recommended):

- Windows: `start.ps1` or `start.bat`
- macOS/Linux: `./scripts/start-dev.sh`

Or manually:

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
# Ensure backend/.env is configured (copy from repo root .env)
python startup.py
```

- **OpenAPI:** http://127.0.0.1:8000/docs  
- **Health:** http://127.0.0.1:8000/api/health  

## Layout

| Path | Role |
|------|------|
| `main.py` | App factory, CORS, router mount, startup migrations |
| `app/routers/` | HTTP routes (`auth`, `stores`, `inventory`, …) |
| `app/core_auth/` | Password hashing, JWT |
| `app/database/` | psycopg2 pool |
| `app/models/schemas.py` | Pydantic models |
| `static/` | Populated by production build (`scripts/deploy.sh`) |

Full project instructions: **../README.md**.
