from fastapi import APIRouter, HTTPException, Depends
from app.models.schemas import (
    UserToken,
    UserLogin,
    UserCreate,
    ApiResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)
from app.core_auth.security import verify_password, get_password_hash, create_access_token
from app.database.connection import get_db_cursor
from app.dependencies import get_current_user, get_admin_user
from app.logging_config import get_logger
from typing import Dict, Any, Optional
import hashlib
import os
import secrets
import psycopg2
from psycopg2 import errors as pg_errors

router = APIRouter()
log = get_logger(__name__)


def _debug_mode() -> bool:
    return os.getenv("DEBUG", "").lower() in ("true", "1", "yes")


# ── Login ─────────────────────────────────────────────────────────────────────
@router.post("/login", response_model=UserToken)
async def login(login_data: UserLogin):
    id_value = login_data.username.strip()
    with get_db_cursor() as cursor:
        cursor.execute(
            """
            SELECT * FROM users
            WHERE LOWER(TRIM(username)) = LOWER(%s)
               OR LOWER(TRIM(email)) = LOWER(%s)
            """,
            (id_value, id_value),
        )
        user = cursor.fetchone()

    if not user:
        raise HTTPException(status_code=401, detail="Incorrect username or password")

    stored_hash = user.get("hashed_password") or ""
    if not stored_hash.strip():
        raise HTTPException(
            status_code=403,
            detail="Account has no password set. Use registration or ask an admin to reset your account.",
        )

    if not verify_password(login_data.password, stored_hash):
        raise HTTPException(status_code=401, detail="Incorrect username or password")

    token = create_access_token({"sub": user["username"], "role": user["role"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user["user_id"],
        "username": user["username"],
        "role": user["role"],
    }


# ── Register ──────────────────────────────────────────────────────────────────
@router.post("/register", response_model=ApiResponse)
async def register(user_data: UserCreate):
    try:
        hashed_pwd = get_password_hash(user_data.password)
    except Exception as exc:
        log.exception("Password hashing failed: %s", exc)
        detail = str(exc) if _debug_mode() else "Registration error. Please try again."
        raise HTTPException(status_code=500, detail=detail) from exc

    with get_db_cursor() as cursor:
        if user_data.store_id is not None:
            cursor.execute(
                "SELECT 1 FROM stores WHERE store_id = %s",
                (user_data.store_id,),
            )
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=400,
                    detail="Selected store is not valid. Refresh the page and choose a store from the list, or leave store unassigned.",
                )

        cursor.execute(
            "SELECT username, email FROM users WHERE username = %s OR email = %s",
            (user_data.username.strip(), user_data.email.strip().lower()),
        )
        existing = cursor.fetchone()
        if existing:
            if existing["username"] == user_data.username.strip():
                raise HTTPException(status_code=400, detail="Username already taken.")
            raise HTTPException(status_code=400, detail="Email already registered.")

        try:
            cursor.execute(
                """
                INSERT INTO users
                    (username, email, hashed_password, first_name, last_name,
                     role, store_id, region, avatar_url)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING user_id
                """,
                (
                    user_data.username.strip(),
                    user_data.email.strip().lower(),
                    hashed_pwd,
                    user_data.first_name.strip(),
                    user_data.last_name.strip(),
                    str(user_data.role),
                    user_data.store_id,
                    user_data.region.strip() if user_data.region else None,
                    user_data.avatar_url,
                ),
            )
            row = cursor.fetchone()
        except pg_errors.UniqueViolation:
            raise HTTPException(
                status_code=400,
                detail="Username or email is already registered.",
            ) from None
        except pg_errors.ForeignKeyViolation:
            raise HTTPException(
                status_code=400,
                detail="Invalid store reference. Leave store unassigned or pick a valid store.",
            ) from None
        except pg_errors.NotNullViolation as exc:
            log.warning("register NotNullViolation: %s", exc)
            raise HTTPException(
                status_code=400,
                detail="A required field is missing or invalid.",
            ) from exc
        except pg_errors.StringDataRightTruncation:
            raise HTTPException(
                status_code=400,
                detail="Username, email, or name is too long. Use shorter values.",
            ) from None
        except psycopg2.Error as exc:
            log.exception("Registration database error")
            raise HTTPException(
                status_code=500,
                detail="Registration could not be completed. Check server logs or try again later.",
            ) from exc

    return ApiResponse(
        success=True,
        data={"user_id": row["user_id"]},
        message=f"Account created for {user_data.username}",
    )


# ── Password reset ────────────────────────────────────────────────────────────
@router.post("/forgot-password", response_model=ApiResponse)
async def forgot_password(body: ForgotPasswordRequest):
    """Always returns success to avoid email enumeration. With DEBUG=true, includes a dev-only reset token."""
    email = body.email.strip().lower()
    dev_payload: Optional[dict] = None

    with get_db_cursor() as cursor:
        cursor.execute(
            "SELECT user_id FROM users WHERE LOWER(TRIM(email)) = %s",
            (email,),
        )
        row = cursor.fetchone()
        if row:
            user_id = row["user_id"]
            cursor.execute(
                "DELETE FROM password_reset_tokens WHERE user_id = %s",
                (user_id,),
            )
            raw_token = secrets.token_urlsafe(32)
            token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
            cursor.execute(
                """
                INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
                VALUES (%s, %s, CURRENT_TIMESTAMP + INTERVAL '1 hour')
                """,
                (user_id, token_hash),
            )
            if _debug_mode():
                dev_payload = {
                    "reset_token": raw_token,
                    "reset_url_path": f"/reset-password?token={raw_token}",
                }

    return ApiResponse(
        success=True,
        data=dev_payload,
        message="If an account exists for that email, you can reset your password using the link we sent.",
    )


@router.post("/reset-password", response_model=ApiResponse)
async def reset_password(body: ResetPasswordRequest):
    token_hash = hashlib.sha256(body.token.strip().encode()).hexdigest()
    try:
        new_hash = get_password_hash(body.password)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid password. Please try a different password.")

    with get_db_cursor() as cursor:
        cursor.execute(
            """
            SELECT user_id FROM password_reset_tokens
            WHERE token_hash = %s
              AND expires_at > CURRENT_TIMESTAMP
              AND used_at IS NULL
            """,
            (token_hash,),
        )
        row = cursor.fetchone()
        if not row:
            raise HTTPException(
                status_code=400,
                detail="Invalid or expired reset link. Request a new password reset.",
            )
        uid = row["user_id"]
        cursor.execute(
            "UPDATE users SET hashed_password = %s WHERE user_id = %s",
            (new_hash, uid),
        )
        cursor.execute(
            "UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE token_hash = %s",
            (token_hash,),
        )

    return ApiResponse(
        success=True,
        message="Password updated. You can sign in with your new password.",
    )


# ── Auth health (public, for debugging) ──────────────────────────────────────
@router.get("/health")
async def auth_health():
    """Quick check that password hashing works."""
    try:
        from app.core_auth.security import get_password_hash, verify_password
        h = get_password_hash("test")
        ok = verify_password("test", h)
        return {"status": "ok", "bcrypt": ok}
    except Exception as exc:
        return {"status": "error", "detail": str(exc)}


# ── Current user ──────────────────────────────────────────────────────────────
@router.get("/me")
async def get_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    return current_user


# ── Public store list (for register form, no auth needed) ─────────────────────
@router.get("/stores-public")
async def stores_public():
    with get_db_cursor() as cursor:
        cursor.execute(
            "SELECT store_id, store_name, store_code, region "
            "FROM stores ORDER BY region, store_name"
        )
        return [dict(r) for r in cursor.fetchall()]


# ── DB health check ───────────────────────────────────────────────────────────
@router.get("/db-check")
async def db_check(_admin: Dict[str, Any] = Depends(get_admin_user)):
    try:
        with get_db_cursor() as cursor:
            cursor.execute("SELECT COUNT(*) AS c FROM users")
            user_count = cursor.fetchone()["c"]
            cursor.execute(
                "SELECT column_name, data_type "
                "FROM information_schema.columns "
                "WHERE table_name='users' ORDER BY ordinal_position"
            )
            columns = [dict(r) for r in cursor.fetchall()]
            cursor.execute(
                "SELECT conname, pg_get_constraintdef(oid) AS def "
                "FROM pg_constraint "
                "WHERE conrelid='users'::regclass AND contype='c'"
            )
            constraints = [dict(r) for r in cursor.fetchall()]
        return {
            "status": "ok",
            "user_count": user_count,
            "columns": columns,
            "check_constraints": constraints,
        }
    except Exception as exc:
        return {"status": "error", "detail": str(exc)}
