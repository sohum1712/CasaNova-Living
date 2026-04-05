# CasaNova Living — Omnichannel Store Operations Platform


> A microservices-based retail operations platform for a regional home & lifestyle group,  
> covering 18 stores, 2 warehouse hubs, and a growing online order desk.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Roles & Access Control](#roles--access-control)
- [Data Model](#data-model)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [AI Features](#ai-features)
- [Non-Functional Requirements](#non-functional-requirements)
- [Phased Rollout](#phased-rollout)
- [Repository Structure](#repository-structure)
- [Production Checklist](#production-checklist)
- [Author](#author)

---

## Overview

**CasaNova Living** is a production-ready, full-stack web application designed to unify day-to-day retail operations across a distributed store network. Built with Python (FastAPI) on the backend and React + Vite on the frontend, it delivers secure role-based access, real-time inventory visibility, POS-assisted billing, inter-store stock transfers, BI reporting, and agentic AI capabilities — all through clearly separated API boundaries between the UI, service, and data layers.

| Metric | Value |
|---|---|
| Retail Stores | 18 |
| Warehouse Hubs | 2 |
| User Roles | 4 |
| Rollout Target | 9 months |
| Pilot Stores | 6 (Phase 1) |

---

## Features

### Core Modules

- **Authentication** — JWT-based login via username or email, password reset token flow, session audit logging
- **Product Management** — Full catalogue with SKUs, categories, barcodes, and pricing
- **Inventory Management** — Real-time stock levels per store, low-stock alerts, replenishment workflows
- **POS & Billing** — Assisted checkout, multi-payment support, receipt generation, returns & exchanges
- **Stock Transfers** — Store-to-store and warehouse-to-store requests with approval flows and discrepancy reporting
- **BI Dashboards** — Sales performance, shrinkage tracking, basket size, and category drill-downs
- **User Directory** — Staff management with role assignment and store mapping (admin-gated)
- **Offline Support** — Service Worker + IndexedDB queue for POS in low-connectivity suburban stores

---

## Architecture

The platform follows a strict **three-layer separation**: UI → Service → Data. Each service owns its domain and communicates through versioned REST APIs documented via OpenAPI.

```
┌─────────────────────────────────────────────────────────┐
│                   PRESENTATION LAYER                    │
│   React 18 · Vite · Tailwind CSS · React Query         │
│   IndexedDB (offline) · Service Workers · Recharts     │
└─────────────────────┬───────────────────────────────────┘
                      │  REST / JSON over HTTPS
┌─────────────────────▼───────────────────────────────────┐
│                   SERVICE LAYER                         │
│   FastAPI (Python) · JWT Middleware · OpenAPI /docs    │
│                                                         │
│   ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌────────┐  │
│   │   Auth   │ │  Product  │ │Inventory │ │  POS   │  │
│   └──────────┘ └───────────┘ └──────────┘ └────────┘  │
│   ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌────────┐  │
│   │ Transfer │ │ Reporting │ │  Users   │ │  AI    │  │
│   └──────────┘ └───────────┘ └──────────┘ └────────┘  │
└─────────────────────┬───────────────────────────────────┘
                      │  SQLAlchemy ORM
┌─────────────────────▼───────────────────────────────────┐
│                     DATA LAYER                          │
│   PostgreSQL 14+ · Alembic Migrations · Redis Cache    │
│   SQLite (edge/offline stores) · Object Storage        │
└─────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React 18 + Vite | Component-based SPA |
| Styling | Tailwind CSS | Utility-first UI |
| Data Fetching | React Query | Server state & caching |
| Backend | FastAPI (Python) | Async REST API framework |
| ORM | SQLAlchemy + Alembic | Database access & migrations |
| Database | PostgreSQL 14+ | Primary data store |
| Cache / Queue | Redis | Hot data caching, task queues |
| Auth | JWT (PyJWT) | Stateless authentication |
| Offline | IndexedDB + Service Worker | Edge store resilience |
| Containers | Docker + Docker Compose | Dev & production packaging |
| Observability | Prometheus + Grafana + Sentry | Metrics, dashboards, error tracking |
| CI/CD | GitHub Actions | Automated test & deploy pipeline |

---

## Roles & Access Control

Access is enforced at both the **API middleware layer** and the **UI component level**.

```
Head-Office Admin
│   Full platform access — users, all-store analytics, product config, policies
│
├── Area Manager
│       Assigned store cluster — KPI review, large transfer approvals
│
│   ├── Store Supervisor
│   │       Single store — inventory, replenishments, staff management
│   │
│   │   └── Floor Associate
│   │           POS checkout, stock lookups, transfer initiation only
```

| Permission | Admin | Area Mgr | Supervisor | Associate |
|---|:---:|:---:|:---:|:---:|
| Manage Users | ✓ | — | — | — |
| All-Store Analytics | ✓ | ✓ | — | — |
| Approve Transfers | ✓ | ✓ | ✓ | — |
| Inventory Management | ✓ | ✓ | ✓ | — |
| POS Checkout | ✓ | ✓ | ✓ | ✓ |
| Stock Lookup | ✓ | ✓ | ✓ | ✓ |

---

## Data Model

Core PostgreSQL tables — schema applied on API startup via Alembic.

```
users               stores              products
─────────────       ──────────────      ────────────────
id (PK)             id (PK)             id (PK)
username            name, code          sku, name
email               region              category_id (FK)
password_hash       type                price, cost
role                address             barcode
store_id (FK)       is_active           is_active


inventory           sales_orders        order_items
─────────────       ─────────────────   ─────────────────
id (PK)             id (PK)             id (PK)
store_id (FK)       order_ref           order_id (FK)
product_id (FK)     store_id (FK)       product_id (FK)
quantity            user_id (FK)        qty, unit_price
low_stock_threshold total, status       discount
                    payment_method


stock_transfers     audit_logs
──────────────────  ──────────────────
id (PK), ref        id (PK), action
from_store (FK)     user_id (FK)
to_store (FK)       entity_type
status              entity_id
approved_by (FK)    payload
notes               timestamp
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.10+
- PostgreSQL 14+
- npm (or pnpm / yarn)

### 1 — Clone & Configure

```bash
git clone https://github.com/your-org/casanova-living.git
cd casanova-living
cp env.example .env
# Edit .env — see Environment Variables section below
```

### 2 — Start the Application

**Windows (recommended)**
```powershell
.\start.ps1
# or double-click start.bat
```

**macOS / Linux**
```bash
chmod +x start-dev.sh
./start-dev.sh
```

**npm (from repo root)**
```bash
npm install
npm run dev
```

### 3 — Seed the Database

Schema is applied automatically on first startup. For demo data:

```bash
python database/setup.py
```

### 4 — Create Your First Admin

Register via the UI at `http://localhost:5173` or directly via the API:

```bash
curl -X POST http://127.0.0.1:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","email":"admin@casanova.com","password":"secret","role":"admin"}'
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DB_USER` | Yes | PostgreSQL username |
| `DB_PASSWORD` | Yes | PostgreSQL password |
| `DB_HOST` | Usually | Database host (default: localhost) |
| `DB_PORT` | Usually | Database port (default: 5432) |
| `DB_NAME` | Usually | Database name |
| `DATABASE_URL` | Alt | Full connection string (overrides DB_*) |
| `JWT_SECRET_KEY` | **Yes (prod)** | Strong random string — never commit |
| `ALLOW_INSECURE_JWT_DEFAULT` | Dev only | Set `1` for local testing without JWT secret |
| `DEBUG` | Optional | `True` exposes reset token in JSON responses |
| `CORS_ORIGINS` | Optional | Comma-separated allowed frontend origins |

---

## API Endpoints

| URL | Description |
|---|---|
| `http://localhost:5173` | React frontend (Vite dev server) |
| `http://127.0.0.1:8000/docs` | OpenAPI / Swagger interactive docs |
| `http://127.0.0.1:8000/api/health` | Health check + database status |
| `POST /api/auth/login` | Authenticate and receive JWT |
| `POST /api/auth/register` | Create a new staff account |
| `POST /api/auth/forgot-password` | Initiate password reset flow |
| `GET /api/products` | List product catalogue |
| `GET /api/inventory` | Real-time stock levels |
| `POST /api/sales` | Create a sales order (POS) |
| `POST /api/transfers` | Initiate a stock transfer request |
| `GET /api/reports/sales` | Sales performance report |
| `GET /api/reports/shrinkage` | Shrinkage & loss report |

Full interactive documentation available at `/docs` once the backend is running.

---

## AI Features

All AI outputs are **advisory only** — confidence scores are displayed and human override is always available.

| Feature | Description |
|---|---|
| **Upsell Recommendations** | Surfaces complementary products at POS based on basket contents and purchase history |
| **Anomaly Detection** | Flags unusual stock movement, shrinkage spikes, or billing discrepancies for supervisor review |
| **Conversational Querying** | Natural language interface — ask operational questions and get structured data in return |
| **Demand Forecasting** | Predicts replenishment needs based on seasonal trends and historical sell-through |
| **Billing Anomaly Alerts** | Detects unusual discount patterns, void clusters, or price override frequencies |
| **AI Guardrails** | Responsible use enforced — all recommendations include confidence scores and audit trails |

---

## Non-Functional Requirements

**Performance**
Sub-200ms API responses under peak weekend trading. Query optimisation, connection pooling, and Redis caching on hot data paths.

**Scalability**
Horizontal pod scaling via Kubernetes for seasonal promotions. Stateless API services allow replication without coordination overhead.

**Security**
JWT with refresh rotation · bcrypt password hashing · HTTPS enforced · input validation on all endpoints · RBAC at every layer · secrets never committed.

**Offline Tolerance**
Service Worker + IndexedDB transaction queue for POS in suburban stores with intermittent connectivity. Graceful sync on reconnect with conflict resolution for inventory mutations.

**Observability**
Prometheus metrics · structured JSON logging · Grafana dashboards · Sentry error tracking · `/api/health` endpoint for support team monitoring.

**Reliability**
Retry logic on transient failures · database transactions for all mutations · circuit breakers on downstream dependencies · zero-downtime deployments via rolling updates.

---

## Phased Rollout

```
Month 1–3 ──── Phase 1: Pilot
                6 stores · Core auth, POS, inventory, basic transfers
                Offline flows validated · Team training & feedback

Month 4–6 ──── Phase 2: Expand
                12 stores · BI dashboards, area manager workflows
                Transfer management fully enabled · AI activated in pilot stores

Month 7–9 ──── Phase 3: Full Network
                18 stores + 2 warehouse hubs · Full AI suite enabled
                Performance tuning for peak seasonal load
```

---

## Repository Structure

```
casanova-living/
│
├── backend/                  # FastAPI application
│   ├── main.py               # Entry point; migrations run on startup
│   ├── routers/              # auth, products, inventory, pos, transfers, reports
│   ├── models/               # SQLAlchemy ORM models
│   ├── schemas/              # Pydantic request / response schemas
│   └── services/             # Business logic layer
│
├── frontend/                 # React + Vite SPA
│   └── src/
│       ├── pages/            # Dashboard, POS, Inventory, Reports, Admin…
│       ├── components/       # Shared UI components
│       └── api/              # Typed API client functions
│
├── database/                 # Seed scripts and setup utilities
│   └── setup.py
│
├── docs/                     # Architecture and supplementary documentation
├── scripts/                  # start-dev.sh · deploy.sh · setup-env.sh
│
├── env.example               # Environment variable template
├── start.ps1                 # Windows PowerShell launcher
├── start.bat                 # Windows CMD launcher
└── package.json              # Optional: npm run dev (concurrently)
```

---

## Production Checklist

- [ ] Set a strong `JWT_SECRET_KEY` — remove `ALLOW_INSECURE_JWT_DEFAULT`
- [ ] Use `DATABASE_URL` with TLS (`DB_SSLMODE=require`) for managed Postgres
- [ ] Set `CORS_ORIGINS` to your real frontend origin(s)
- [ ] Configure password reset email delivery — do not rely on `DEBUG` token leakage
- [ ] Do not commit `.env` or `backend/static` source maps with secrets
- [ ] Run production build and serve via FastAPI static or a reverse proxy:

```bash
./scripts/deploy.sh
# Builds frontend → backend/static; serve with Uvicorn/Gunicorn
```

---

## Scripts

| Script | Purpose |
|---|---|
| `start-dev.sh` / `start.ps1` / `start.bat` | Local development — sets up venv, installs deps, starts API + UI |
| `scripts/setup-env.sh` | One-time Python venv + npm install |
| `scripts/deploy.sh` | Production build + optional Databricks bundle |

See `scripts/README.md` for detailed usage.

---

## License

See **LICENSE.md**, **NOTICE.md**, and **SECURITY.md** in the repository root.

---

## Author

**Soham Vaghela**  
3rd Year · B.Tech Computer Science & Engineering  
Parul University, Vadodara

| | |
|---|---|
| LinkedIn | [linkedin.com/in/sohamvaghela](https://linkedin.com/in/SohamVaghela) |
| Portfolio | [sohamvaghela.in](https://sohamvaghela.in/) |
| GitHub | [github.com/sohum1712](https://github.com/sohum1712) |

> This case study was completed independently as part of a technical selection process.  
> All architecture, design decisions, and implementation details are original work  
> and will be substantiated during Q&A stages of the selection process.

---

*CasaNova Living — Regional Retail Operations Platform*
