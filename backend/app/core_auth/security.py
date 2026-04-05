from datetime import datetime, timedelta
from typing import Optional
import os
import hashlib
import base64
import secrets as _secrets

# ── passlib/bcrypt compatibility patch ────────────────────────────────────────
# passlib 1.7.4 reads bcrypt.__about__.__version__ which was removed in bcrypt 4.x
# Patch it before importing CryptContext so passlib doesn't crash.
try:
    import bcrypt
    if not hasattr(bcrypt, "__about__"):
        import types
        bcrypt.__about__ = types.SimpleNamespace(__version__=bcrypt.__version__)
except Exception:
    pass

from passlib.context import CryptContext
from jose import jwt

from app.config import app_config
from app.logging_config import get_logger

log = get_logger(__name__)

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__truncate_error=False)

_RUNTIME_SECRET = _secrets.token_hex(32)


def get_jwt_secret() -> str:
    key = os.environ.get("JWT_SECRET_KEY", "").strip()
    if not key:
        key = (app_config.jwt_secret_key or "").strip()
    if key:
        return key
    log.warning(
        "JWT_SECRET_KEY not set — using a generated runtime secret. "
        "Sessions will be lost on restart. Set JWT_SECRET_KEY in production."
    )
    return _RUNTIME_SECRET


def _prehash(password: str) -> str:
    """SHA-256 prehash so bcrypt always receives a fixed-length 44-char string."""
    digest = hashlib.sha256(password.encode("utf-8")).digest()
    return base64.b64encode(digest).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password:
        return False
    try:
        return pwd_context.verify(_prehash(plain_password), hashed_password)
    except Exception:
        return False


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
