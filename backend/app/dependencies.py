from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.core_auth.security import decode_access_token
from app.database.connection import get_db_cursor
from typing import Dict, Any, Callable

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


async def get_current_user(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    username: str = payload.get("sub")
    if not username:
        raise credentials_exception

    with get_db_cursor() as cursor:
        cursor.execute(
            "SELECT user_id, username, email, "
            "COALESCE(first_name,'') AS first_name, "
            "COALESCE(last_name,'') AS last_name, "
            "role, store_id, region, avatar_url, created_at "
            "FROM users WHERE username = %s",
            (username,),
        )
        row = cursor.fetchone()

    if row is None:
        raise credentials_exception

    # Return plain dict — safe to serialize / pass around
    return dict(row)


async def get_admin_user(
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> Dict[str, Any]:
    if current_user.get("role") != "head_office_admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


def require_roles(*allowed_roles: str) -> Callable[..., Dict[str, Any]]:
    """Dependency factory: current user must have one of the given roles."""

    async def role_checker(
        current_user: Dict[str, Any] = Depends(get_current_user),
    ) -> Dict[str, Any]:
        role = current_user.get("role")
        if role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions for this action",
            )
        return current_user

    return role_checker
