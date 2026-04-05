#!/usr/bin/env python3
"""
CasaNova DB migration: adds stock_transfers, pos_sessions tables
and extends stores/products with CasaNova fields.
Run: python database/casanova_migrate.py
"""
import os
import sys
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
    print("Error: DB_PASSWORD not set in database/.env")
    sys.exit(1)


def run():
    # Try with sslmode=require first (for cloud DBs), fall back to prefer for local
    try:
        conn = psycopg2.connect(
            host=DB_HOST, port=DB_PORT, database=DB_NAME,
            user=DB_USER, password=DB_PASS, sslmode="require",
        )
    except Exception:
        conn = psycopg2.connect(
            host=DB_HOST, port=DB_PORT, database=DB_NAME,
            user=DB_USER, password=DB_PASS,
        )
    cur = conn.cursor()
    cur.execute(f"SET search_path TO {DB_SCHEMA};")

    print("🔧 Adding CasaNova columns to stores...")
    cur.execute("""
        ALTER TABLE stores
            ADD COLUMN IF NOT EXISTS is_warehouse BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS store_category VARCHAR(50) DEFAULT 'retail';
    """)

    print("🔧 Adding stock_threshold to products...")
    cur.execute("""
        ALTER TABLE products
            ADD COLUMN IF NOT EXISTS stock_threshold INTEGER DEFAULT 10;
    """)

    print("🔧 Creating stock_transfers table...")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS stock_transfers (
            transfer_id SERIAL PRIMARY KEY,
            from_store_id INTEGER NOT NULL REFERENCES stores(store_id),
            to_store_id INTEGER NOT NULL REFERENCES stores(store_id),
            product_id INTEGER NOT NULL REFERENCES products(product_id),
            quantity INTEGER NOT NULL CHECK (quantity > 0),
            status VARCHAR(20) NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','approved','shipped','cancelled')),
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP
        );
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS idx_transfers_status ON stock_transfers(status);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_transfers_from ON stock_transfers(from_store_id);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_transfers_to ON stock_transfers(to_store_id);")

    print("🔧 Creating pos_sessions table...")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS pos_sessions (
            session_id SERIAL PRIMARY KEY,
            store_id INTEGER NOT NULL REFERENCES stores(store_id),
            cart JSONB NOT NULL DEFAULT '[]',
            total DECIMAL(12,2) NOT NULL DEFAULT 0,
            status VARCHAR(20) NOT NULL DEFAULT 'open'
                CHECK (status IN ('open','paid','cancelled')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    cur.execute("CREATE INDEX IF NOT EXISTS idx_pos_store ON pos_sessions(store_id);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_pos_status ON pos_sessions(status);")

    print("🌱 Seeding CasaNova demo data...")
    # Mark warehouses
    cur.execute("""
        UPDATE stores SET is_warehouse = TRUE, store_category = 'warehouse'
        WHERE store_type = 'Warehouse';
    """)

    # Seed some low-stock items for demo (set a few inventory rows to < 10)
    cur.execute("""
        UPDATE inventory SET quantity_cases = 7
        WHERE inventory_id IN (
            SELECT inventory_id FROM inventory ORDER BY RANDOM() LIMIT 5
        );
    """)

    conn.commit()
    cur.close()
    conn.close()
    print("✅ CasaNova migration complete!")


if __name__ == "__main__":
    run()
