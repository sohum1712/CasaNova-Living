from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional
from app.models.schemas import User, UserCreate, ApiResponse
from app.core_auth.security import get_password_hash
from app.database.connection import get_db_cursor
from app.dependencies import get_current_user, require_roles

router = APIRouter()

_read_users = require_roles("head_office_admin", "area_manager", "store_supervisor")
_admin_only = require_roles("head_office_admin")


@router.get("", response_model=List[User])
async def get_users(
    role: Optional[str] = Query(None),
    store_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    current_user: dict = Depends(_read_users),
):
    with get_db_cursor() as cursor:
        sql = (
            "SELECT user_id, username, email, "
            "COALESCE(first_name,'') AS first_name, "
            "COALESCE(last_name,'') AS last_name, "
            "role, store_id, region, avatar_url, created_at "
            "FROM users WHERE 1=1"
        )
        params: list = []

        viewer_role = current_user.get("role")
        viewer_store = current_user.get("store_id")
        viewer_id = current_user.get("user_id")
        if viewer_role == "store_supervisor":
            sql += " AND (store_id IS NOT DISTINCT FROM %s OR user_id = %s)"
            params.extend([viewer_store, viewer_id])

        if role:
            sql += " AND role = %s"
            params.append(role)
        if store_id is not None:
            sql += " AND store_id = %s"
            params.append(store_id)
        if search:
            sql += (
                " AND (first_name ILIKE %s OR last_name ILIKE %s"
                " OR username ILIKE %s OR email ILIKE %s)"
            )
            s = f"%{search}%"
            params.extend([s, s, s, s])
        sql += " ORDER BY created_at DESC LIMIT %s"
        params.append(limit)
        cursor.execute(sql, params)
        return [dict(r) for r in cursor.fetchall()]


@router.get("/{user_id}", response_model=User)
async def get_user(user_id: int, current_user: dict = Depends(get_current_user)):
    with get_db_cursor() as cursor:
        cursor.execute(
            "SELECT user_id, username, email, "
            "COALESCE(first_name,'') AS first_name, "
            "COALESCE(last_name,'') AS last_name, "
            "role, store_id, region, avatar_url, created_at "
            "FROM users WHERE user_id = %s",
            (user_id,),
        )
        row = cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")

    role = current_user.get("role")
    uid = current_user.get("user_id")
    if role in ("head_office_admin", "area_manager"):
        return dict(row)
    if role == "store_supervisor":
        if row["user_id"] == uid:
            return dict(row)
        if row.get("store_id") != current_user.get("store_id"):
            raise HTTPException(status_code=403, detail="Cannot view users outside your store")
        return dict(row)
    if role == "floor_associate":
        if row["user_id"] != uid:
            raise HTTPException(status_code=403, detail="You can only view your own profile")
        return dict(row)
    raise HTTPException(status_code=403, detail="Insufficient permissions")


@router.post("", response_model=ApiResponse)
async def create_user(
    user_data: UserCreate,
    _: dict = Depends(_admin_only),
):
    hashed_pwd = get_password_hash(user_data.password)

    with get_db_cursor() as cursor:
        cursor.execute(
            "SELECT username, email FROM users WHERE username=%s OR email=%s",
            (user_data.username.strip(), user_data.email.strip().lower()),
        )
        existing = cursor.fetchone()
        if existing:
            if existing["username"] == user_data.username.strip():
                raise HTTPException(status_code=400, detail="Username already exists")
            raise HTTPException(status_code=400, detail="Email already exists")

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
        except Exception as exc:
            raise HTTPException(status_code=500, detail=str(exc))

    return ApiResponse(
        success=True,
        data={"user_id": row["user_id"]},
        message=f"User {user_data.username} created",
    )


@router.delete("/{user_id}", response_model=ApiResponse)
async def delete_user(
    user_id: int,
    current_user: dict = Depends(_admin_only),
):
    if user_id == current_user.get("user_id"):
        raise HTTPException(status_code=400, detail="You cannot delete your own account")

    with get_db_cursor() as cursor:
        cursor.execute(
            "DELETE FROM users WHERE user_id = %s RETURNING user_id", (user_id,)
        )
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="User not found")
    return ApiResponse(success=True, message="User deleted")
