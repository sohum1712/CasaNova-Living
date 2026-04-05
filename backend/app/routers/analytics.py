"""
CasaNova Analytics Router
Provides sales trends, category performance, store comparison, and basket analytics.
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.database.connection import get_db_cursor

router = APIRouter()


@router.get("/sales-trend")
async def get_sales_trend(days: int = Query(30, ge=7, le=90), store_id: Optional[int] = Query(None)):
    """Daily sales totals for the last N days from POS sessions."""
    with get_db_cursor() as cursor:
        params = [days]
        store_filter = ""
        if store_id:
            store_filter = " AND ps.store_id = %s"
            params.append(store_id)
        cursor.execute(
            f"""
            SELECT
                DATE(ps.created_at) AS sale_date,
                COUNT(*) AS transactions,
                COALESCE(SUM(ps.total), 0) AS revenue,
                COALESCE(AVG(ps.total), 0) AS avg_basket
            FROM pos_sessions ps
            WHERE ps.status = 'paid'
              AND ps.created_at >= CURRENT_DATE - INTERVAL '%s days'
              {store_filter}
            GROUP BY DATE(ps.created_at)
            ORDER BY sale_date
            """,
            params,
        )
        rows = cursor.fetchall()
        return [
            {
                "date": str(r["sale_date"]),
                "transactions": int(r["transactions"]),
                "revenue": float(r["revenue"]),
                "avg_basket": round(float(r["avg_basket"]), 2),
            }
            for r in rows
        ]


@router.get("/category-performance")
async def get_category_performance(store_id: Optional[int] = Query(None)):
    """Revenue and units sold per category from POS sessions."""
    with get_db_cursor() as cursor:
        store_filter = ""
        params: list = []
        if store_id:
            store_filter = " AND ps.store_id = %s"
            params.append(store_id)
        cursor.execute(
            f"""
            SELECT
                p.category,
                COUNT(DISTINCT ps.session_id) AS transactions,
                SUM((item->>'qty')::int) AS units_sold,
                SUM((item->>'qty')::int * (item->>'unit_price')::numeric) AS revenue
            FROM pos_sessions ps
            JOIN LATERAL jsonb_array_elements(ps.cart) AS item ON TRUE
            JOIN products p ON p.product_id = (item->>'product_id')::int
            WHERE ps.status = 'paid' {store_filter}
            GROUP BY p.category
            ORDER BY revenue DESC
            """,
            params,
        )
        rows = cursor.fetchall()
        total_rev = sum(float(r["revenue"] or 0) for r in rows) or 1
        return [
            {
                "category": r["category"],
                "transactions": int(r["transactions"]),
                "units_sold": int(r["units_sold"] or 0),
                "revenue": float(r["revenue"] or 0),
                "share_pct": round(float(r["revenue"] or 0) / total_rev * 100, 1),
            }
            for r in rows
        ]


@router.get("/store-comparison")
async def get_store_comparison():
    """Inventory value and low-stock count per store."""
    with get_db_cursor() as cursor:
        cursor.execute(
            """
            SELECT
                s.store_id,
                s.store_name,
                s.store_type,
                s.region,
                COALESCE(SUM(i.quantity_cases * p.unit_price), 0) AS inventory_value,
                COUNT(i.inventory_id) AS sku_count,
                COUNT(CASE WHEN i.quantity_cases < 10 THEN 1 END) AS low_stock_count,
                COALESCE(SUM(i.quantity_cases), 0) AS total_cases
            FROM stores s
            LEFT JOIN inventory i ON s.store_id = i.store_id
            LEFT JOIN products p ON i.product_id = p.product_id
            GROUP BY s.store_id, s.store_name, s.store_type, s.region
            ORDER BY inventory_value DESC
            LIMIT 20
            """
        )
        rows = cursor.fetchall()
        return [
            {
                "store_id": r["store_id"],
                "store_name": r["store_name"],
                "store_type": r["store_type"],
                "region": r["region"],
                "inventory_value": float(r["inventory_value"]),
                "sku_count": int(r["sku_count"]),
                "low_stock_count": int(r["low_stock_count"]),
                "total_cases": int(r["total_cases"]),
            }
            for r in rows
        ]


@router.get("/recent-activity")
async def get_recent_activity(limit: int = Query(10, ge=5, le=50)):
    """Latest POS transactions for activity feed."""
    with get_db_cursor() as cursor:
        cursor.execute(
            """
            SELECT
                ps.session_id,
                ps.total,
                ps.created_at,
                s.store_name,
                jsonb_array_length(ps.cart) AS item_count
            FROM pos_sessions ps
            JOIN stores s ON ps.store_id = s.store_id
            WHERE ps.status = 'paid'
            ORDER BY ps.created_at DESC
            LIMIT %s
            """,
            (limit,),
        )
        rows = cursor.fetchall()
        return [
            {
                "session_id": r["session_id"],
                "total": float(r["total"]),
                "created_at": r["created_at"].isoformat(),
                "store_name": r["store_name"],
                "item_count": int(r["item_count"]),
            }
            for r in rows
        ]


@router.get("/inventory-health")
async def get_inventory_health():
    """Inventory health breakdown: healthy / low / critical per region."""
    with get_db_cursor() as cursor:
        cursor.execute(
            """
            SELECT
                s.region,
                COUNT(CASE WHEN i.quantity_cases >= 50 THEN 1 END) AS healthy,
                COUNT(CASE WHEN i.quantity_cases BETWEEN 10 AND 49 THEN 1 END) AS low,
                COUNT(CASE WHEN i.quantity_cases < 10 THEN 1 END) AS critical
            FROM inventory i
            JOIN stores s ON i.store_id = s.store_id
            GROUP BY s.region
            ORDER BY s.region
            """
        )
        rows = cursor.fetchall()
        return [
            {
                "region": r["region"],
                "healthy": int(r["healthy"]),
                "low": int(r["low"]),
                "critical": int(r["critical"]),
            }
            for r in rows
        ]
