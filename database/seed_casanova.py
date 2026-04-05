#!/usr/bin/env python3
"""
CasaNova Demo Data Seeder
Seeds realistic POS sessions, stock transfers, and low-stock inventory
so the dashboard has live data to display.

Run: python database/seed_casanova.py
"""
import os, sys, json, random
from datetime import datetime, timedelta
import psycopg2
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_NAME = os.getenv("DB_NAME", "postgres")
DB_SCHEMA = os.getenv("DB_SCHEMA", "public")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASSWORD", "")

if not DB_PASS:
    print("Error: DB_PASSWORD not set"); sys.exit(1)


def connect():
    try:
        return psycopg2.connect(host=DB_HOST, port=DB_PORT, database=DB_NAME,
                                user=DB_USER, password=DB_PASS, sslmode="require")
    except Exception:
        return psycopg2.connect(host=DB_HOST, port=DB_PORT, database=DB_NAME,
                                user=DB_USER, password=DB_PASS)


def seed():
    conn = connect()
    cur = conn.cursor()
    cur.execute(f"SET search_path TO {DB_SCHEMA};")

    # ── Fetch reference data ──────────────────────────────────────────────────
    cur.execute("SELECT store_id, store_name FROM stores ORDER BY store_id LIMIT 20")
    stores = cur.fetchall()
    if not stores:
        print("No stores found – run demo_setup.py first"); sys.exit(1)

    cur.execute("SELECT product_id, product_name, unit_price FROM products ORDER BY product_id LIMIT 50")
    products = cur.fetchall()
    if not products:
        print("No products found – run demo_setup.py first"); sys.exit(1)

    retail_stores = [s for s in stores if s[0] % 5 != 0][:10]  # rough retail subset
    warehouse_stores = stores[:2]  # first 2 as warehouses

    print(f"Found {len(stores)} stores, {len(products)} products")

    # ── 1. Seed POS sessions (last 30 days) ──────────────────────────────────
    print("Seeding POS sessions...")
    cur.execute("SELECT COUNT(*) FROM pos_sessions")
    existing = cur.fetchone()[0]
    if existing < 50:
        sessions_added = 0
        for day_offset in range(30, 0, -1):
            sale_date = datetime.now() - timedelta(days=day_offset)
            # 5-25 transactions per day across stores
            n_tx = random.randint(5, 25)
            for _ in range(n_tx):
                store = random.choice(retail_stores)
                # 1-5 items per cart
                n_items = random.randint(1, 5)
                cart = []
                total = 0.0
                for _ in range(n_items):
                    prod = random.choice(products)
                    qty = random.randint(1, 3)
                    cart.append({
                        "product_id": prod[0],
                        "product_name": prod[1],
                        "qty": qty,
                        "unit_price": float(prod[2]),
                    })
                    total += qty * float(prod[2])
                tx_time = sale_date.replace(
                    hour=random.randint(9, 21),
                    minute=random.randint(0, 59),
                )
                cur.execute(
                    """INSERT INTO pos_sessions (store_id, cart, total, status, created_at)
                       VALUES (%s, %s, %s, 'paid', %s)""",
                    (store[0], json.dumps(cart), round(total, 2), tx_time),
                )
                sessions_added += 1
        conn.commit()
        print(f"  Added {sessions_added} POS sessions")
    else:
        print(f"  Skipped – {existing} sessions already exist")

    # ── 2. Seed stock transfers ───────────────────────────────────────────────
    print("Seeding stock transfers...")
    cur.execute("SELECT COUNT(*) FROM stock_transfers")
    existing = cur.fetchone()[0]
    if existing < 10:
        statuses = ["pending", "pending", "shipped", "shipped", "cancelled"]
        for i in range(20):
            from_s = random.choice(warehouse_stores)
            to_s = random.choice(retail_stores)
            if from_s[0] == to_s[0]:
                continue
            prod = random.choice(products)
            qty = random.randint(10, 100)
            status = random.choice(statuses)
            created = datetime.now() - timedelta(days=random.randint(0, 14))
            cur.execute(
                """INSERT INTO stock_transfers
                   (from_store_id, to_store_id, product_id, quantity, status, notes, created_at)
                   VALUES (%s, %s, %s, %s, %s, %s, %s)
                   ON CONFLICT DO NOTHING""",
                (from_s[0], to_s[0], prod[0], qty, status,
                 "Demo transfer request", created),
            )
        conn.commit()
        print("  Added stock transfers")
    else:
        print(f"  Skipped – {existing} transfers already exist")

    # ── 3. Force some low-stock items for demo ────────────────────────────────
    print("Setting low-stock demo items...")
    cur.execute(
        """UPDATE inventory SET quantity_cases = %s
           WHERE inventory_id IN (
               SELECT inventory_id FROM inventory
               WHERE quantity_cases > 20
               ORDER BY RANDOM() LIMIT 15
           )""",
        (random.randint(2, 9),),
    )
    conn.commit()
    print("  Set 15 items to low stock")

    # ── 4. Mark warehouse stores ──────────────────────────────────────────────
    cur.execute(
        "UPDATE stores SET is_warehouse=TRUE, store_category='warehouse' WHERE store_type='Warehouse'"
    )
    conn.commit()

    cur.close()
    conn.close()
    print("\nDone! CasaNova demo data seeded successfully.")


if __name__ == "__main__":
    seed()
