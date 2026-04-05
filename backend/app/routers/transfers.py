from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.models.schemas import StockTransfer, StockTransferCreate, ApiResponse
from app.database.connection import get_db_cursor

router = APIRouter()


@router.get("", response_model=List[StockTransfer])
async def get_transfers(
    status: Optional[str] = Query(None),
    store_id: Optional[int] = Query(None),
):
    with get_db_cursor() as cursor:
        query = """
            SELECT t.transfer_id, t.from_store_id, t.to_store_id, t.product_id,
                   t.quantity, t.status, t.notes, t.created_at, t.updated_at,
                   fs.store_name as from_store_name,
                   ts.store_name as to_store_name,
                   p.product_name, p.category
            FROM stock_transfers t
            JOIN stores fs ON t.from_store_id = fs.store_id
            JOIN stores ts ON t.to_store_id = ts.store_id
            JOIN products p ON t.product_id = p.product_id
            WHERE 1=1
        """
        params = []
        if status:
            query += " AND t.status = %s"
            params.append(status)
        if store_id:
            query += " AND (t.from_store_id = %s OR t.to_store_id = %s)"
            params.extend([store_id, store_id])
        query += " ORDER BY t.created_at DESC LIMIT 200"
        cursor.execute(query, params)
        rows = cursor.fetchall()
        return [dict(r) for r in rows]


@router.post("", response_model=StockTransfer)
async def create_transfer(transfer: StockTransferCreate):
    if transfer.from_store_id == transfer.to_store_id:
        raise HTTPException(status_code=400, detail="Source and destination must differ")
    if transfer.quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be positive")

    with get_db_cursor() as cursor:
        # Check source inventory
        cursor.execute(
            "SELECT quantity_cases FROM inventory WHERE store_id=%s AND product_id=%s",
            (transfer.from_store_id, transfer.product_id),
        )
        row = cursor.fetchone()
        if not row or row["quantity_cases"] < transfer.quantity:
            raise HTTPException(status_code=400, detail="Insufficient inventory at source store")

        cursor.execute(
            """INSERT INTO stock_transfers (from_store_id, to_store_id, product_id, quantity, status, notes)
               VALUES (%s, %s, %s, %s, 'pending', %s) RETURNING transfer_id, created_at""",
            (transfer.from_store_id, transfer.to_store_id, transfer.product_id,
             transfer.quantity, transfer.notes),
        )
        result = cursor.fetchone()
        transfer_id = result["transfer_id"]

        cursor.execute(
            """SELECT t.transfer_id, t.from_store_id, t.to_store_id, t.product_id,
                      t.quantity, t.status, t.notes, t.created_at, t.updated_at,
                      fs.store_name as from_store_name, ts.store_name as to_store_name,
                      p.product_name, p.category
               FROM stock_transfers t
               JOIN stores fs ON t.from_store_id = fs.store_id
               JOIN stores ts ON t.to_store_id = ts.store_id
               JOIN products p ON t.product_id = p.product_id
               WHERE t.transfer_id = %s""",
            (transfer_id,),
        )
        return dict(cursor.fetchone())


@router.patch("/{transfer_id}/approve", response_model=ApiResponse)
async def approve_transfer(transfer_id: int):
    with get_db_cursor() as cursor:
        cursor.execute(
            "SELECT * FROM stock_transfers WHERE transfer_id=%s", (transfer_id,)
        )
        t = cursor.fetchone()
        if not t:
            raise HTTPException(status_code=404, detail="Transfer not found")
        if t["status"] != "pending":
            raise HTTPException(status_code=400, detail="Only pending transfers can be approved")

        # Deduct from source, add to destination
        cursor.execute(
            """UPDATE inventory SET quantity_cases = quantity_cases - %s, last_updated = NOW()
               WHERE store_id=%s AND product_id=%s""",
            (t["quantity"], t["from_store_id"], t["product_id"]),
        )
        # Upsert destination inventory
        cursor.execute(
            """INSERT INTO inventory (store_id, product_id, quantity_cases, reserved_cases)
               VALUES (%s, %s, %s, 0)
               ON CONFLICT (product_id, store_id)
               DO UPDATE SET quantity_cases = inventory.quantity_cases + EXCLUDED.quantity_cases,
                             last_updated = NOW()""",
            (t["to_store_id"], t["product_id"], t["quantity"]),
        )
        cursor.execute(
            "UPDATE stock_transfers SET status='shipped', updated_at=NOW() WHERE transfer_id=%s",
            (transfer_id,),
        )
        return {"success": True, "message": "Transfer approved and inventory updated"}


@router.patch("/{transfer_id}/cancel", response_model=ApiResponse)
async def cancel_transfer(transfer_id: int):
    with get_db_cursor() as cursor:
        cursor.execute(
            "SELECT status FROM stock_transfers WHERE transfer_id=%s", (transfer_id,)
        )
        t = cursor.fetchone()
        if not t:
            raise HTTPException(status_code=404, detail="Transfer not found")
        if t["status"] not in ("pending", "approved"):
            raise HTTPException(status_code=400, detail="Cannot cancel this transfer")
        cursor.execute(
            "UPDATE stock_transfers SET status='cancelled', updated_at=NOW() WHERE transfer_id=%s",
            (transfer_id,),
        )
        return {"success": True, "message": "Transfer cancelled"}
