# Scripts

| Script | Purpose |
|--------|---------|
| `start-dev.sh` | Unix/Git Bash: sync `.env`, install deps, run API + Vite (foreground, Ctrl+C stops both). |
| `setup-env.sh` | One-time: create `backend/venv`, `pip install`, `npm install` in `frontend/`. |
| `deploy.sh` | Production: build frontend, copy to `backend/static/`, Databricks bundle deploy (requires CLI). |

From the **repository root**, wrappers `start-dev.sh`, `setup-env.sh`, and `deploy.sh` forward to this folder.

**Windows:** use `start.ps1` or `start.bat` at the repo root instead of `start-dev.sh`.
