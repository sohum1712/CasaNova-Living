from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from contextlib import asynccontextmanager
import pathlib

from app.routers import stores, inventory, orders, users, products, transfers, pos, analytics, ai, auth
from app.database.connection import init_connection_pool, close_connection_pool, get_db_cursor
from app.logging_config import setup_logging, get_logger
from app.dependencies import get_current_user
from app.config import app_config
from app.core_auth.security import get_jwt_secret

load_dotenv(override=False)  # Railway env vars take precedence over .env file
setup_logging()
log = get_logger(__name__)

FRONTEND_STATIC_PATH = pathlib.Path(__file__).parent / "static"


# ── Migrations ────────────────────────────────────────────────────────────────
def run_migrations():
    """Idempotent schema setup — safe to run on every startup."""
    with get_db_cursor() as cur:

        # ── Core tables ───────────────────────────────────────────────────────
        cur.execute("""
            CREATE TABLE IF NOT EXISTS stores (
                store_id       SERIAL PRIMARY KEY,
                store_name     VARCHAR(100) NOT NULL,
                store_code     VARCHAR(50)  UNIQUE NOT NULL,
                address        TEXT,
                city           VARCHAR(100),
                state          VARCHAR(100),
                zip_code       VARCHAR(20),
                region         VARCHAR(50),
                store_type     VARCHAR(50),
                is_warehouse   BOOLEAN DEFAULT FALSE,
                store_category VARCHAR(50) DEFAULT 'retail',
                created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS products (
                product_id      SERIAL PRIMARY KEY,
                product_name    VARCHAR(255) NOT NULL,
                brand           VARCHAR(100),
                category        VARCHAR(100),
                package_size    VARCHAR(50),
                unit_price      DECIMAL(10,2) NOT NULL,
                stock_threshold INTEGER DEFAULT 10,
                created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Users — no CHECK constraint on role so any role string is accepted
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                user_id         SERIAL PRIMARY KEY,
                username        VARCHAR(50)  UNIQUE NOT NULL,
                email           VARCHAR(100) UNIQUE NOT NULL,
                hashed_password VARCHAR(255) NOT NULL,
                first_name      VARCHAR(50),
                last_name       VARCHAR(50),
                role            VARCHAR(50) DEFAULT 'floor_associate',
                store_id        INTEGER REFERENCES stores(store_id),
                region          VARCHAR(50),
                avatar_url      TEXT,
                created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS inventory (
                inventory_id   SERIAL PRIMARY KEY,
                store_id       INTEGER REFERENCES stores(store_id),
                product_id     INTEGER REFERENCES products(product_id),
                quantity_cases INTEGER DEFAULT 0,
                reserved_cases INTEGER DEFAULT 0,
                last_updated   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                version        INTEGER DEFAULT 1,
                UNIQUE (store_id, product_id)
            )
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS stock_transfers (
                transfer_id   SERIAL PRIMARY KEY,
                from_store_id INTEGER REFERENCES stores(store_id),
                to_store_id   INTEGER REFERENCES stores(store_id),
                product_id    INTEGER REFERENCES products(product_id),
                quantity      INTEGER NOT NULL,
                status        VARCHAR(50) DEFAULT 'pending',
                notes         TEXT,
                created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at    TIMESTAMP
            )
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS pos_sessions (
                session_id SERIAL PRIMARY KEY,
                store_id   INTEGER REFERENCES stores(store_id),
                cart       JSONB DEFAULT '[]',
                total      DECIMAL(12,2) DEFAULT 0,
                status     VARCHAR(50) DEFAULT 'open',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cur.execute("""
            CREATE TABLE IF NOT EXISTS password_reset_tokens (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                token_hash VARCHAR(64) NOT NULL UNIQUE,
                expires_at TIMESTAMP NOT NULL,
                used_at TIMESTAMP
            )
        """)
        cur.execute(
            "CREATE INDEX IF NOT EXISTS idx_pwd_reset_user ON password_reset_tokens(user_id)"
        )

        # ── Reconcile existing schema (handles old demo_setup.py tables) ──────

        # 1. Legacy users.password column (before adding hashed_password)
        cur.execute(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_schema = current_schema() AND table_name = 'users'"
        )
        user_col_names = {r["column_name"] for r in cur.fetchall()}
        if "password" in user_col_names and "hashed_password" not in user_col_names:
            cur.execute("ALTER TABLE users RENAME COLUMN password TO hashed_password")
            log.info("Renamed legacy users.password to hashed_password")
        elif "password" in user_col_names and "hashed_password" in user_col_names:
            cur.execute(
                """
                UPDATE users SET hashed_password = password
                WHERE (hashed_password IS NULL OR TRIM(hashed_password) = '')
                  AND password IS NOT NULL AND TRIM(password::text) <> ''
                  AND password::text LIKE %s
                """,
                ("$2%",),
            )
            cur.execute("ALTER TABLE users DROP COLUMN IF EXISTS password")
            log.info("Merged bcrypt hashes from legacy password column into hashed_password")

        # 2. Add missing columns to users
        for col, defn in [
            ("hashed_password", "VARCHAR(255) NOT NULL DEFAULT ''"),
            ("first_name",      "VARCHAR(50)"),
            ("last_name",       "VARCHAR(50)"),
            ("region",          "VARCHAR(50)"),
            ("avatar_url",      "TEXT"),
        ]:
            cur.execute(
                "SELECT 1 FROM information_schema.columns "
                "WHERE table_name='users' AND column_name=%s",
                (col,),
            )
            if not cur.fetchone():
                cur.execute(f"ALTER TABLE users ADD COLUMN {col} {defn}")
                log.info(f"Added missing column users.{col}")

        # 3. Drop ALL check constraints on users.role
        #    (old demo_setup.py had CHECK (role IN ('store_manager','regional_manager')))
        cur.execute(
            "SELECT conname FROM pg_constraint "
            "WHERE conrelid = 'users'::regclass AND contype = 'c'"
        )
        for row in cur.fetchall():
            cname = row["conname"]
            cur.execute(f"ALTER TABLE users DROP CONSTRAINT IF EXISTS {cname}")
            log.info(f"Dropped constraint: {cname}")

        # 4. Widen role column if needed
        cur.execute(
            "SELECT character_maximum_length FROM information_schema.columns "
            "WHERE table_name='users' AND column_name='role'"
        )
        row = cur.fetchone()
        if row and row["character_maximum_length"] and row["character_maximum_length"] < 50:
            cur.execute("ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(50)")
            log.info("Widened users.role to VARCHAR(50)")

        # 5. Ensure inventory unique constraint exists
        cur.execute(
            "SELECT 1 FROM pg_constraint WHERE conname='inventory_store_product_uq'"
        )
        if not cur.fetchone():
            try:
                cur.execute(
                    "ALTER TABLE inventory "
                    "ADD CONSTRAINT inventory_store_product_uq UNIQUE (store_id, product_id)"
                )
            except Exception:
                pass  # already exists under a different name

        log.info("Migrations complete")


# ── Lifespan ──────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    get_jwt_secret()
    init_connection_pool()
    run_migrations()
    log.info("CasaNova ready")
    yield
    close_connection_pool()


# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="CasaNova Living API",
    version="1.0.2",
    redirect_slashes=False,
    lifespan=lifespan,
)

# CORS — must be before routers
app.add_middleware(
    CORSMiddleware,
    allow_origins=app_config.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API = "/api"

# Public (no auth)
app.include_router(auth.router, prefix=f"{API}/auth", tags=["auth"])

# Protected (require valid JWT)
_protected = {"dependencies": [Depends(get_current_user)]}
app.include_router(stores.router,    prefix=f"{API}/stores",    tags=["stores"],    **_protected)
app.include_router(inventory.router, prefix=f"{API}/inventory", tags=["inventory"], **_protected)
app.include_router(orders.router,    prefix=f"{API}/orders",    tags=["orders"],    **_protected)
app.include_router(users.router,     prefix=f"{API}/users",     tags=["users"],     **_protected)
app.include_router(products.router,  prefix=f"{API}/products",  tags=["products"],  **_protected)
app.include_router(transfers.router, prefix=f"{API}/transfers", tags=["transfers"], **_protected)
app.include_router(pos.router,       prefix=f"{API}/pos",       tags=["pos"],       **_protected)
app.include_router(analytics.router, prefix=f"{API}/analytics", tags=["analytics"], **_protected)
app.include_router(ai.router,        prefix=f"{API}/ai",        tags=["ai"],        **_protected)


# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/api/health")
async def health():
    try:
        with get_db_cursor() as cur:
            cur.execute("SELECT COUNT(*) AS c FROM users")
            n = cur.fetchone()["c"]
        return {"status": "healthy", "version": "1.0.2", "database": "connected", "users": n}
    except Exception as exc:
        return {"status": "degraded", "database": "error", "error": str(exc)}


# ── SPA fallback ──────────────────────────────────────────────────────────────
@app.get("/")
async def root():
    f = FRONTEND_STATIC_PATH / "index.html"
    return FileResponse(str(f)) if f.exists() else {"message": "CasaNova API"}


@app.get("/{full_path:path}")
async def spa(full_path: str):
    if full_path.startswith("api/") or full_path.startswith("docs"):
        raise HTTPException(status_code=404)
    f = FRONTEND_STATIC_PATH / "index.html"
    if f.exists():
        return FileResponse(str(f))
    raise HTTPException(status_code=404)
