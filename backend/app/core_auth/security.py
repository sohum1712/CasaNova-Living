from datetime import datetime, timedelta
from typing import Optional
from jose import jwt
from passlib.context import CryptContext
import os
import hashlib
import base64
import secrets as _secrets

from app.config import app_config
from app.logging_config import get_logger

log = get_logger(__name__)

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__truncate_error=False)

# Generated once at import time as a last-resort fallback
# (sessions won't survive restarts, but the app will start)
_RUNTIME_SECRET = _secrets.token_hex(32)


def get_jwt_secret() -> str:
    key = os.environ.get("JWT_SECRET_KEY", "").strip()
    if not key:
        key = (app_config.jwt_secret_key or "").strip()
    if key:
        return key
    log.warning(
        "JWT_SECRET_KEY not set — using a generated runtime secret. "
        "Sessions will be lost on restart. Set JWT_SECRET_KEY in Railway Variables."
    )
    return _RUNTIME_SECRET


def _prehash(password: str) -> str:
    """SHA-256 prehash to bypass bcrypt's 72-byte limit."""
    digest = hashlib.sha256(password.encode("utf-8")).digest()
    return base64.b64encode(digest).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password:
        return False
    return pwd_context.verify(_prehash(plain_password), hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(_prehash(password))


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    secret = get_jwt_secret()
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, secret, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, get_jwt_secret(), algorithms=[ALGORITHM])
    except Exception:
        return None
