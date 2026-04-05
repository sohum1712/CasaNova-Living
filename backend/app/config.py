import os
from typing import Optional
from dotenv import load_dotenv

from app.logging_config import get_logger

# Load environment variables
load_dotenv(override=False)  # Railway env vars take precedence over .env file

# Setup logger for this module
log = get_logger(__name__)


def _parse_database_url(url: str) -> dict:
    """Parse postgres:// or postgresql:// URL into psycopg2 kwargs.
    Strips query params that psycopg2 doesn't support (e.g. channel_binding).
    """
    # Strip query string before parsing — we handle sslmode manually
    from urllib.parse import urlparse, unquote, parse_qs

    parsed = urlparse(url)
    if parsed.scheme not in ("postgres", "postgresql", "postgresql+psycopg2"):
        raise ValueError(f"Unsupported DATABASE_URL scheme: {parsed.scheme}")

    database = (parsed.path or "").lstrip("/") or "postgres"

    cfg = {
        "host": parsed.hostname or "localhost",
        "port": parsed.port or 5432,
        "database": database,
        "user": unquote(parsed.username) if parsed.username else None,
        "password": unquote(parsed.password) if parsed.password else "",
    }

    # Extract only the params psycopg2 actually supports
    qs = parse_qs(parsed.query)
    if "sslmode" in qs:
        cfg["sslmode"] = qs["sslmode"][0]

    return cfg


class AppConfig:
    """Configuration class for the application"""

    @property
    def database_config(self) -> dict:
        """Connection kwargs for psycopg2 (supports DATABASE_URL or discrete DB_* vars)."""
        url = os.environ.get("DATABASE_URL", "").strip()
        if url:
            cfg = _parse_database_url(url)
            # Allow env override of sslmode
            sslmode = os.environ.get("DB_SSLMODE", "").strip()
            if sslmode:
                cfg["sslmode"] = sslmode
            # Neon always needs SSL
            if "neon.tech" in url and "sslmode" not in cfg:
                cfg["sslmode"] = "require"
            return cfg

        cfg = {
            "host": os.environ.get("DB_HOST", "localhost").strip(),
            "port": int(os.environ.get("DB_PORT", "5432")),
            "database": os.environ.get("DB_NAME", "postgres"),
            "user": os.environ.get("DB_USER", "").strip() or None,
            "password": os.environ.get("DB_PASSWORD", "").strip(),
        }
        sslmode = os.environ.get("DB_SSLMODE", "").strip()
        if sslmode:
            cfg["sslmode"] = sslmode
        return cfg

    @property
    def cors_origins(self) -> list:
        """Get CORS origins"""
        origins = [
            "http://localhost:5173",
            "http://localhost:3000",
            "http://localhost:8080",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:3000",
        ]
        extra = os.getenv("CORS_ORIGINS", "")
        if extra:
            origins.extend([o.strip() for o in extra.split(",") if o.strip()])
        return origins

    @property
    def jwt_secret_key(self) -> Optional[str]:
        v = os.getenv("JWT_SECRET_KEY", "").strip()
        return v or None

    @property
    def allow_insecure_jwt_default(self) -> bool:
        """Only when true: fall back to a dev-only default if JWT_SECRET_KEY is unset."""
        return os.getenv("ALLOW_INSECURE_JWT_DEFAULT", "").strip() in ("1", "true", "yes")

# Global config instance
app_config = AppConfig()
