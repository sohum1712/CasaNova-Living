from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.models.schemas import POSSession, POSSessionCreate, ApiResponse
from app.database.connection import get_db_cursor

router = APIRouter()


@router.get("", response_model=List[POSSession])
async def get_sessions(
    store_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
):
    with get_db_cursor() as cursor:
        query = """
            SELECT ps.session_id, ps.store_id, ps.cart, ps.total, ps.status, ps.created_at,
                   s.store_name
            FROM pos_sessions ps
            JOIN stores s ON ps.store_id = s.store_id
            WHERE 1=1
        """
        params = []
        if store_id:
            query += " AND ps.store_id = %s"
            params.append(store_id)
        if status:
            query += " AND ps.status = %s"
            params.append(status)
        query += " ORDER BY ps.created_at DESC LIMIT 100"
        cursor.execute(query, params)
        rows = cursor.fetchall()
        return [dict(r) for r in rows]


@router.post("", response_model=POSSession)
async def create_session(session: POSSessionCreate):
    if not session.cart:
        raise HTTPException(status_code=400, detail="Cart cannot be empty")

    import json
    with get_db_cursor() as cursor:
        cursor.execute(
            """INSERT INTO pos_sessions (store_id, cart, total, status)
               VALUES (%s, %s, %s, 'open') RETURNING session_id, created_at""",
            (session.store_id, json.dumps(session.cart), session.total),
        )
        result = cursor.fetchone()
        session_id = result["session_id"]

        cursor.execute(
            """SELECT ps.session_id, ps.store_id, ps.cart, ps.total, ps.status, ps.created_at,
                      s.store_name
               FROM pos_sessions ps JOIN stores s ON ps.store_id = s.store_id
               WHERE ps.session_id = %s""",
            (session_id,),
        )
        return dict(cursor.fetchone())


@router.post("/{session_id}/checkout", response_model=ApiResponse)
async def checkout(session_id: int):
    with get_db_cursor() as cursor:
        cursor.execute(
            "SELECT * FROM pos_sessions WHERE session_id=%s", (session_id,)
        )
        session = cursor.fetchone()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        if session["status"] != "open":
            raise HTTPException(status_code=400, detail="Session already closed")

        cart = session["cart"]
        if isinstance(cart, str):
            import json
            cart = json.loads(cart)

        # Deduct inventory for each cart item
        for item in cart:
            product_id = item.get("product_id")
            qty = item.get("qty", 0)
            cursor.execute(
                """SELECT inventory_id, quantity_cases FROM inventory
                   WHERE store_id=%s AND product_id=%s""",
                (session["store_id"], product_id),
            )
            inv = cursor.fetchone()
            if not inv:
                raise HTTPException(
                    status_code=400,
                    detail=f"Product {product_id} not in store inventory",
                )
            if inv["quantity_cases"] < qty:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient stock for product {product_id}",
                )
            cursor.execute(
                """UPDATE inventory SET quantity_cases = quantity_cases - %s, last_updated=NOW()
                   WHERE inventory_id=%s""",
                (qty, inv["inventory_id"]),
            )

        cursor.execute(
            "UPDATE pos_sessions SET status='paid' WHERE session_id=%s", (session_id,)
        )
        return {"success": True, "message": "Checkout complete", "data": {"session_id": session_id}}


@router.get("/dashboard/kpis")
async def get_dashboard_kpis(store_id: Optional[int] = Query(None)):
    with get_db_cursor() as cursor:
        # Total inventory value
        if store_id:
            cursor.execute(
                """SELECT COALESCE(SUM(i.quantity_cases * p.unit_price), 0) as total_value,
                          COUNT(DISTINCT i.product_id) as total_products,
                          COUNT(CASE WHEN i.quantity_cases < 10 THEN 1 END) as low_stock_count
                   FROM inventory i JOIN products p ON i.product_id = p.product_id
                   WHERE i.store_id = %s""",
                (store_id,),
            )
        else:
            cursor.execute(
                """SELECT COALESCE(SUM(i.quantity_cases * p.unit_price), 0) as total_value,
                          COUNT(DISTINCT i.product_id) as total_products,
                          COUNT(CASE WHEN i.quantity_cases < 10 THEN 1 END) as low_stock_count
                   FROM inventory i JOIN products p ON i.product_id = p.product_id"""
            )
        inv_row = cursor.fetchone()

        # Pending transfers
        if store_id:
            cursor.execute(
                """SELECT COUNT(*) as cnt FROM stock_transfers
                   WHERE status='pending' AND (from_store_id=%s OR to_store_id=%s)""",
                (store_id, store_id),
            )
        else:
            cursor.execute("SELECT COUNT(*) as cnt FROM stock_transfers WHERE status='pending'")
        transfer_row = cursor.fetchone()

        # Today's sales (paid POS sessions)
        if store_id:
            cursor.execute(
                """SELECT COALESCE(SUM(total), 0) as todays_sales FROM pos_sessions
                   WHERE status='paid' AND DATE(created_at) = CURRENT_DATE AND store_id=%s""",
                (store_id,),
            )
        else:
            cursor.execute(
                """SELECT COALESCE(SUM(total), 0) as todays_sales FROM pos_sessions
                   WHERE status='paid' AND DATE(created_at) = CURRENT_DATE"""
            )
        sales_row = cursor.fetchone()

        return {
            "total_inventory_value": float(inv_row["total_value"]),
            "total_products": int(inv_row["total_products"]),
            "low_stock_count": int(inv_row["low_stock_count"]),
            "pending_transfers": int(transfer_row["cnt"]),
            "todays_sales": float(sales_row["todays_sales"]),
            "store_id": store_id,
        }
