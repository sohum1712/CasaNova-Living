#!/usr/bin/env python3
"""
CasaNova — Database Setup & Seed Script
Creates all tables, seeds stores/products/inventory, and creates an admin user.

Usage (from project root):
    python database/setup.py
"""
import os, sys, random
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

# Load from backend/.env first, then root .env
_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(_root, "backend", ".env"))
load_dotenv(os.path.join(_root, ".env"))

DB = dict(
    host=os.getenv("DB_HOST", "localhost"),
    port=int(os.getenv("DB_PORT", "5432")),
    database=os.getenv("DB_NAME", "postgres"),
    user=os.getenv("DB_USER", "postgres"),
    password=os.getenv("DB_PASSWORD", ""),
)

if not DB["password"]:
    print("ERROR: DB_PASSWORD not set in backend/.env"); sys.exit(1)


def connect():
    try:
        return psycopg2.connect(**DB)
    except psycopg2.OperationalError as e:
        print(f"\nERROR: Cannot connect to PostgreSQL\n  {e}")
        print(f"\nCheck backend/.env — current settings:")
        print(f"  DB_HOST={DB['host']}  DB_PORT={DB['port']}")
        print(f"  DB_NAME={DB['database']}  DB_USER={DB['user']}")
        sys.exit(1)


def q(conn, sql, params=None):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(sql, params)
        conn.commit()
        try:
            return cur.fetchall()
        except Exception:
            return []


def setup():
    print(f"\n{'='*52}")
    print(f"  CasaNova Database Setup")
    print(f"  {DB['user']}@{DB['host']}:{DB['port']}/{DB['database']}")
    print(f"{'='*52}\n")

    conn = connect()
    print("✓ Connected to PostgreSQL\n")

    # ── 1. Create tables ──────────────────────────────────────────────────────
    print("[1/5] Creating tables...")

    q(conn, """
        CREATE TABLE IF NOT EXISTS stores (
            store_id       SERIAL PRIMARY KEY,
            store_name     VARCHAR(100) NOT NULL,
            store_code     VARCHAR(50)  UNIQUE NOT NULL,
            address        TEXT,
            city           VARCHAR(100),
            state          VARCHAR(100),
            zip_code       VARCHAR(20),
            region         VARCHAR(50),
            store_type     VARCHAR(50),
            is_warehouse   BOOLEAN DEFAULT FALSE,
            store_category VARCHAR(50) DEFAULT 'retail',
            created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    q(conn, """
        CREATE TABLE IF NOT EXISTS products (
            product_id      SERIAL PRIMARY KEY,
            product_name    VARCHAR(255) NOT NULL,
            brand           VARCHAR(100),
            category        VARCHAR(100),
            package_size    VARCHAR(50),
            unit_price      DECIMAL(10,2) NOT NULL,
            stock_threshold INTEGER DEFAULT 10,
            created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Users table — NO CHECK constraint on role
    q(conn, """
        CREATE TABLE IF NOT EXISTS users (
            user_id         SERIAL PRIMARY KEY,
            username        VARCHAR(50)  UNIQUE NOT NULL,
            email           VARCHAR(100) UNIQUE NOT NULL,
            hashed_password VARCHAR(255) NOT NULL,
            first_name      VARCHAR(50),
            last_name       VARCHAR(50),
            role            VARCHAR(50) DEFAULT 'floor_associate',
            store_id        INTEGER REFERENCES stores(store_id),
            region          VARCHAR(50),
            avatar_url      TEXT,
            created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    q(conn, """
        CREATE TABLE IF NOT EXISTS inventory (
            inventory_id   SERIAL PRIMARY KEY,
            store_id       INTEGER REFERENCES stores(store_id),
            product_id     INTEGER REFERENCES products(product_id),
            quantity_cases INTEGER DEFAULT 0,
            reserved_cases INTEGER DEFAULT 0,
            last_updated   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            version        INTEGER DEFAULT 1,
            UNIQUE (store_id, product_id)
        )
    """)

    q(conn, """
        CREATE TABLE IF NOT EXISTS stock_transfers (
            transfer_id   SERIAL PRIMARY KEY,
            from_store_id INTEGER REFERENCES stores(store_id),
            to_store_id   INTEGER REFERENCES stores(store_id),
            product_id    INTEGER REFERENCES products(product_id),
            quantity      INTEGER NOT NULL,
            status        VARCHAR(50) DEFAULT 'pending',
            notes         TEXT,
            created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at    TIMESTAMP
        )
    """)

    q(conn, """
        CREATE TABLE IF NOT EXISTS pos_sessions (
            session_id SERIAL PRIMARY KEY,
            store_id   INTEGER REFERENCES stores(store_id),
            cart       JSONB DEFAULT '[]',
            total      DECIMAL(12,2) DEFAULT 0,
            status     VARCHAR(50) DEFAULT 'open',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    print("  ✓ Tables ready")

    # ── 2. Fix old schema issues ───────────────────────────────────────────────
    print("\n[2/5] Fixing schema constraints...")

    # Add missing columns
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        for col, defn in [
            ("hashed_password", "VARCHAR(255) NOT NULL DEFAULT ''"),
            ("first_name",      "VARCHAR(50)"),
            ("last_name",       "VARCHAR(50)"),
            ("region",          "VARCHAR(50)"),
            ("avatar_url",      "TEXT"),
        ]:
            cur.execute(
                "SELECT 1 FROM information_schema.columns "
                "WHERE table_name='users' AND column_name=%s", (col,)
            )
            if not cur.fetchone():
                cur.execute(f"ALTER TABLE users ADD COLUMN {col} {defn}")
                print(f"  + Added column users.{col}")
        conn.commit()

    # Drop ALL check constraints on users (removes old role CHECK)
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            "SELECT conname FROM pg_constraint "
            "WHERE conrelid='users'::regclass AND contype='c'"
        )
        constraints = [r["conname"] for r in cur.fetchall()]
    for cname in constraints:
        q(conn, f"ALTER TABLE users DROP CONSTRAINT IF EXISTS {cname}")
        print(f"  - Dropped constraint: {cname}")

    if not constraints:
        print("  ✓ No old constraints to remove")

    # ── 3. Seed stores ────────────────────────────────────────────────────────
    print("\n[3/5] Seeding stores...")
    rows = q(conn, "SELECT COUNT(*) AS c FROM stores")
    if rows[0]["c"] == 0:
        stores = [
            ("CasaNova Central Warehouse", "CN-WH-001", "1 Logistics Blvd",  "Mumbai",    "MH", "400001", "North", "Warehouse", True),
            ("CasaNova South Hub",         "CN-WH-002", "5 Distribution Ave", "Chennai",   "TN", "600001", "South", "Warehouse", True),
            ("Mumbai Flagship",            "CN-RT-001", "45 Retail Plaza",    "Mumbai",    "MH", "400012", "North", "Urban",     False),
            ("Delhi Central",              "CN-RT-002", "12 Connaught Place", "Delhi",     "DL", "110001", "North", "Urban",     False),
            ("Bangalore Tech Park",        "CN-RT-003", "Vertex Tech Park",   "Bangalore", "KA", "560001", "South", "Business",  False),
            ("Pune East",                  "CN-RT-004", "East Street 22",     "Pune",      "MH", "411001", "West",  "Suburban",  False),
            ("Hyderabad Hitech",           "CN-RT-005", "Hitech City Road 8", "Hyderabad", "TS", "500081", "South", "Business",  False),
            ("Chennai Marina",             "CN-RT-006", "Marina Beach Road",  "Chennai",   "TN", "600001", "South", "Tourist",   False),
            ("Kolkata Park Street",        "CN-RT-007", "Park Street 100",    "Kolkata",   "WB", "700016", "East",  "Urban",     False),
            ("Ahmedabad CG Road",          "CN-RT-008", "CG Road 55",         "Ahmedabad", "GJ", "380006", "West",  "Shopping",  False),
        ]
        for s in stores:
            q(conn,
              "INSERT INTO stores (store_name,store_code,address,city,state,zip_code,region,store_type,is_warehouse) "
              "VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT (store_code) DO NOTHING", s)
        print(f"  ✓ {len(stores)} stores inserted")
    else:
        print(f"  ✓ Stores already exist ({rows[0]['c']}), skipping")

    # ── 4. Seed products + inventory ──────────────────────────────────────────
    print("\n[4/5] Seeding products & inventory...")
    rows = q(conn, "SELECT COUNT(*) AS c FROM products")
    if rows[0]["c"] == 0:
        products = [
            ("Minimalist Sofa 3-Seater", "CasaNova",   "Furniture",  "1 unit",   899.00),
            ("Oak Coffee Table",          "WoodCraft",  "Furniture",  "1 unit",   299.00),
            ("Velvet Accent Chair",       "CasaNova",   "Furniture",  "1 unit",   449.00),
            ("Brass Floor Lamp",          "LightHouse", "Lighting",   "1 unit",   180.00),
            ("Pendant Ceiling Light",     "LightHouse", "Lighting",   "1 unit",   220.00),
            ("Ceramic Vase Set",          "ArtHome",    "Decor",      "Set of 3",  65.00),
            ("Velvet Pillow Set",         "CasaNova",   "Decor",      "Set of 2",  45.00),
            ("Abstract Wall Art",         "ArtHome",    "Decor",      "1 unit",   120.00),
            ("Ceramic Serving Bowl",      "KitchenCo",  "Kitchen",    "1 unit",    35.00),
            ("Marble Cheese Board",       "KitchenCo",  "Kitchen",    "1 unit",    55.00),
            ("Linen Duvet Cover",         "SleepWell",  "Bedroom",    "Queen",     89.00),
            ("Memory Foam Pillow",        "SleepWell",  "Bedroom",    "1 unit",    49.00),
            ("Bamboo Bath Towel Set",     "CasaNova",   "Bathroom",   "Set of 4",  59.00),
            ("Scented Candle Collection", "AromaHome",  "Decor",      "Set of 3",  38.00),
            ("Indoor Plant Pot Set",      "GreenHome",  "Decor",      "Set of 3",  42.00),
        ]
        for p in products:
            q(conn,
              "INSERT INTO products (product_name,brand,category,package_size,unit_price) "
              "VALUES (%s,%s,%s,%s,%s)", p)
        print(f"  ✓ {len(products)} products inserted")

        store_ids = [r["store_id"] for r in q(conn, "SELECT store_id FROM stores")]
        prod_ids  = [r["product_id"] for r in q(conn, "SELECT product_id FROM products")]
        for sid in store_ids:
            for pid in prod_ids:
                qty = random.randint(10, 200)
                q(conn,
                  "INSERT INTO inventory (store_id,product_id,quantity_cases) "
                  "VALUES (%s,%s,%s) ON CONFLICT (store_id,product_id) DO NOTHING",
                  (sid, pid, qty))
        print(f"  ✓ Inventory seeded ({len(store_ids)} stores × {len(prod_ids)} products)")
    else:
        print(f"  ✓ Products already exist ({rows[0]['c']}), skipping")

    # ── 5. Create admin user ──────────────────────────────────────────────────
    print("\n[5/5] Creating admin user...")

    try:
        from passlib.context import CryptContext
        pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
    except ImportError:
        print("  ✗ passlib not installed — run: pip install passlib[bcrypt]")
        sys.exit(1)

    ADMIN_USER = "admin"
    ADMIN_PASS = "admin123"
    ADMIN_MAIL = "admin@casanova.com"

    rows = q(conn, "SELECT user_id FROM users WHERE username=%s", (ADMIN_USER,))
    if not rows:
        hashed = pwd_ctx.hash(ADMIN_PASS)
        q(conn,
          "INSERT INTO users (username,email,hashed_password,first_name,last_name,role) "
          "VALUES (%s,%s,%s,%s,%s,%s)",
          (ADMIN_USER, ADMIN_MAIL, hashed, "Admin", "User", "head_office_admin"))
        print(f"  ✓ Admin user created")
    else:
        print(f"  ✓ Admin user already exists")

    conn.close()

    print(f"\n{'='*52}")
    print("  Setup complete!")
    print(f"  Login → http://localhost:5173/login")
    print(f"  Username : admin")
    print(f"  Password : admin123")
    print(f"{'='*52}\n")


if __name__ == "__main__":
    setup()
