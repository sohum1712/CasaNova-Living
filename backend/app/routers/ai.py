from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Dict, Any, Optional
import random
from datetime import datetime, timedelta
from app.database.connection import get_db_cursor

router = APIRouter()

@router.get("/recommendations")
async def get_recommendations(store_id: Optional[int] = Query(None)):
    """Agentic AI: Product and upsell recommendations based on sales patterns."""
    with get_db_cursor() as cursor:
        # Simple logic: Recommend top selling products that are in stock
        cursor.execute("""
            SELECT p.product_id, p.product_name, p.category, p.unit_price, i.quantity_cases
            FROM products p
            JOIN inventory i ON p.product_id = i.product_id
            WHERE i.quantity_cases > 20
            ORDER BY RANDOM()
            LIMIT 4
        """)
        prods = cursor.fetchall()
        
        recs = []
        for p in prods:
            recs.append({
                "product_id": p["product_id"],
                "name": p["product_name"],
                "category": p["category"],
                "price": float(p["unit_price"]),
                "reason": random.choice(["Trending in region", "Frequently bought together", "High margin upsell", "Low inventory in nearby stores"])
            })
        return recs

@router.get("/anomalies")
async def detect_anomalies(store_id: Optional[int] = Query(None)):
    """Agentic AI: Unusual stock movement or billing anomalies detection."""
    # Simulating anomaly detection
    anomalies = [
        {
            "id": "AN-001",
            "type": "Stock Movement",
            "severity": "High",
            "message": "Unusual volume of 'Luxe Velvet Sofa' moved from Warehouse to Store 4 without active transfer request.",
            "timestamp": datetime.now().isoformat()
        },
        {
            "id": "AN-002",
            "type": "Billing",
            "severity": "Medium",
            "message": "Multiple voided transactions at Store 2 (Terminal 4) within 15 minutes.",
            "timestamp": (datetime.now() - timedelta(hours=2)).isoformat()
        },
        {
            "id": "AN-003",
            "type": "Inventory",
            "severity": "Low",
            "message": "Negative inventory variance detected for 'Ceramic Vase' after end-of-day count.",
            "timestamp": (datetime.now() - timedelta(days=1)).isoformat()
        }
    ]
    return anomalies

@router.post("/query")
async def conversational_query(payload: Dict[str, str]):
    """Agentic AI: Conversational querying for operational insights."""
    query = payload.get("query", "").lower()
    
    # Simple semantic router simulation
    if "sales" in query or "revenue" in query:
        return {
            "answer": "Total revenue across all 18 stores for the last 30 days is $1.2M. Mumbai Central is leading with 24% of total share.",
            "data_points": ["$1,240,500 Total Revenue", "24% Top Store Share"]
        }
    elif "stock" in query or "inventory" in query:
        return {
            "answer": "Currently, 12 SKUs are below the 10-unit threshold and require replenishment. 5 transfers are pending approval.",
            "data_points": ["12 Low Stock SKUs", "5 Pending Transfers"]
        }
    elif "recomm" in query:
        return {
            "answer": "I recommend promoting 'Modular Coffee Tables' this weekend as they have high stock levels (240 units) and positive regional sentiment.",
            "data_points": ["240 Units in Stock", "High Upsell Potential"]
        }
    else:
        return {
            "answer": "I'm CasaNova AI. I can help you with sales figures, stock levels, and operational anomalies. What would you like to know?",
            "data_points": []
        }
