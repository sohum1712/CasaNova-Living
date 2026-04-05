from datetime import datetime, timedelta
from typing import Optional
from jose import jwt
from passlib.context import CryptContext
import os

from app.config import app_config
from app.logging_config import get_logger

log = get_logger(__name__)

# Same value historically used when JWT_SECRET_KEY was unset (dev-only when ALLOW_INSECURE_JWT_DEFAULT=1).
_DEV_FALLBACK_SECRET = "casanova_ultra_secure_secret_3029482309"

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_jwt_secret() -> str:
    # Read directly from os.environ first to bypass any dotenv interference
    key = os.environ.get("JWT_SECRET_KEY", "").strip()
    if not key:
        key = (app_config.jwt_secret_key or "").strip()
    log.info(f"JWT_SECRET_KEY present: {bool(key)}, length: {len(key)}")
    if key:
        return key
        return key
    if app_config.allow_insecure_jwt_default:
        log.warning(
            "JWT_SECRET_KEY is not set; using insecure dev default. "
            "Set JWT_SECRET_KEY or remove ALLOW_INSECURE_JWT_DEFAULT for production."
        )
        return _DEV_FALLBACK_SECRET
    raise RuntimeError(
        "JWT_SECRET_KEY is required. Set it in the environment, or for local dev only set "
        "ALLOW_INSECURE_JWT_DEFAULT=1 (not for production)."
    )


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password:
        return False
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    secret = get_jwt_secret()
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, secret, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, get_jwt_secret(), algorithms=[ALGORITHM])
    except Exception:
        return None
