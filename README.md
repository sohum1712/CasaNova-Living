# CasaNova Living

Omnichannel retail operations platform: **React + Vite** frontend, **FastAPI** API, **PostgreSQL** data store, **JWT** authentication and role-based access.

## Features

- Staff sign-in with **username or email**, optional **password reset** (token flow; email integration is your responsibility in production).
- Modules: dashboard & analytics, products, inventory KPIs, stores, POS checkout, stock transfers, user directory (role-gated).
- API documented with **OpenAPI** (`/docs`).

## Repository layout

```
├── backend/           # FastAPI app (see backend/README.md)
├── frontend/          # React SPA (Vite)
├── database/          # Optional seed/migrate utilities (setup.py, seed scripts)
├── docs/              # Design and supplementary documentation
├── scripts/           # start-dev.sh, setup-env.sh, deploy.sh (+ root wrappers)
├── env.example        # Copy to .env at repo root
├── start.ps1          # Windows: venv, deps, launch API + UI
├── start.bat          # Windows CMD variant
└── package.json       # Optional: npm run dev (concurrently) from root
```

## Prerequisites

- **Node.js** 18+
- **Python** 3.10+
- **PostgreSQL** 14+ (local or hosted)
- **npm** or **pnpm/yarn**

## Quick start

### 1. Configure environment

```bash
cp env.example .env
```

Edit **`.env`** at the repository root (synced to `backend/.env` by the start scripts):

| Variable | Required | Notes |
|----------|----------|--------|
| `DB_USER`, `DB_PASSWORD` | Yes | Or use `DATABASE_URL` instead of discrete `DB_*` |
| `DB_HOST`, `DB_PORT`, `DB_NAME` | Usually | Defaults suit local Postgres |
| `JWT_SECRET_KEY` | **Yes (prod)** | Strong random string; for local-only dev you may use `ALLOW_INSECURE_JWT_DEFAULT=1` (never in production) |
| `DEBUG` | Optional | `True` exposes reset token in forgot-password JSON for local testing |
| `CORS_ORIGINS` | Optional | Comma-separated extra origins |

### 2. Start everything

**Windows (recommended):**

```powershell
.\start.ps1
```

or double-click **`start.bat`**.

**macOS / Linux / Git Bash:**

```bash
chmod +x scripts/start-dev.sh start-dev.sh
./start-dev.sh
```

**From repo root with npm (if root dependencies installed):**

```bash
npm install
npm run dev
```

### 3. Open the app

| URL | Description |
|-----|-------------|
| http://localhost:5173 | Frontend (Vite dev server) |
| http://127.0.0.1:8000/docs | OpenAPI / Swagger |
| http://127.0.0.1:8000/api/health | Health + DB check |

The Vite dev server proxies `/api` to the backend on **127.0.0.1:8000**.

### 4. First data & users

- Schema is applied on API startup (`main.py` migrations).
- Optional full seed: `python database/setup.py` (uses `backend/.env` / root `.env`).

Create an admin via **Register** in the UI or through the API (`POST /api/auth/register`).

## Production checklist

- Set **`JWT_SECRET_KEY`**; remove **`ALLOW_INSECURE_JWT_DEFAULT`**.
- Use **`DATABASE_URL`** or TLS (`DB_SSLMODE=require`) for managed Postgres.
- Set **`CORS_ORIGINS`** to your real frontend origin(s).
- Build the SPA and serve via FastAPI static or a reverse proxy:

```bash
./scripts/deploy.sh   # builds frontend → backend/static; optional Databricks step
```

Or manually: `npm run build` in `frontend/`, then copy `frontend/dist/*` → `backend/static/` and run Uvicorn/Gunicorn against `main:app`.

- Do not commit **`.env`** or **`backend/static`** source maps with secrets.
- Configure **password reset** email delivery; do not rely on `DEBUG` token leakage.

## Scripts (see `scripts/README.md`)

| Entry | Purpose |
|--------|---------|
| `start-dev.sh` / `start.ps1` / `start.bat` | Local development |
| `scripts/setup-env.sh` | One-time Python venv + npm install |
| `scripts/deploy.sh` | Production build + optional Databricks bundle |

## License and notices

See **LICENSE.md**, **NOTICE.md**, and **SECURITY.md** in the repository root.

---

**CasaNova Living** — regional retail operations.
