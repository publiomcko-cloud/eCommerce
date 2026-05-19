# Local Development Environment Architecture — DataPulse Commerce

## 1. Purpose

This document explains how the local development environment should be structured for DataPulse Commerce.

The project extends the completed DataPulse BI foundation, so the local environment must support both:

- the existing analytics dashboard and pipeline
- the new commerce storefront, backend, admin, checkout, and analytics integration

## 2. Environment Strategy

Recommended local environment:

```text
Local machine / WSL2
├── Frontend running with Node.js
├── Backend running with Python
├── PostgreSQL running with Docker
├── Optional Redis running with Docker
└── Optional local email catcher or console email adapter
```

PostgreSQL remains required. Redis is optional until background jobs, token storage, or async queues are introduced.

## 3. Recommended Operating System

Use Linux or WSL2 Ubuntu on Windows.

Recommended Windows setup:

- Windows as host
- WSL2 Ubuntu for project commands
- Docker Desktop integrated with WSL2
- VS Code connected to WSL

Avoid developing directly inside Windows paths such as:

```text
/mnt/c/Users/...
```

Prefer:

```bash
~/projects/datapulse-commerce
```

## 4. Applications Used

## 4.1 VS Code

Recommended extensions:

- Python
- Pylance
- ESLint
- Prettier
- Docker
- GitLens
- PostgreSQL or SQLTools
- Markdown Preview

## 4.2 Git

Used for version control.

Recommended workflow:

- preserve BI baseline in a commit
- implement commerce by milestones
- keep main branch stable
- use clear commits

## 4.3 Docker

Used for local infrastructure:

- PostgreSQL
- optional Redis
- optional pgAdmin
- optional production-like stack

## 4.4 Node.js

Used for the Next.js frontend.

Recommended version:

- current LTS or stable version already compatible with the project

## 4.5 Python

Used for FastAPI backend, data scripts, tests, and analytics projections.

Recommended version:

- Python 3.11 or 3.12

## 4.6 PostgreSQL

Used as:

- transactional e-commerce database
- BI/analytics database
- development and test persistence layer

## 5. Project Location

Recommended path:

```bash
~/projects/datapulse-commerce
```

If continuing in the same repository, the folder may remain:

```bash
~/projects/datapulse-bi
```

In either case, product identity should be updated in documentation and UI to DataPulse Commerce.

## 6. Local Services

## 6.1 Database

Run from project root:

```bash
docker compose up -d
```

Validate:

```bash
docker ps
```

## 6.2 Backend

Run from:

```bash
cd ~/projects/datapulse-commerce/backend
```

Command:

```bash
source .venv/bin/activate
alembic upgrade head
python scripts/check_db_connection.py
uvicorn app.main:app --reload
```

Useful checks:

```bash
curl http://localhost:8000/health
curl http://localhost:8000/catalog/products
curl http://localhost:8000/metrics/summary
```

## 6.3 Frontend

Run from:

```bash
cd ~/projects/datapulse-commerce/frontend
```

Command:

```bash
npm install
npm run dev
```

Expected local URLs:

- storefront: `http://localhost:3000`
- dashboard: `http://localhost:3000/dashboard`
- cart: `http://localhost:3000/cart`
- checkout: `http://localhost:3000/checkout`
- admin: `http://localhost:3000/admin`

## 6.4 Analytics and Projection Scripts

Existing scripts remain useful:

```bash
python scripts/ingest_data.py
python scripts/transform_data.py
python scripts/run_smoke_checks.py
```

New commerce scripts should be added:

```bash
python scripts/seed_commerce_demo_data.py
python scripts/project_commerce_analytics.py
python scripts/run_commerce_smoke_checks.py
```

## 7. Environment Variables

Backend `.env` example:

```env
DATABASE_URL=postgresql+psycopg://datapulse:datapulse@localhost:5432/datapulse
POSTGRES_USER=datapulse
POSTGRES_PASSWORD=datapulse
POSTGRES_DB=datapulse
ENVIRONMENT=local
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
SECRET_KEY=local-dev-change-me
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
PAYMENT_PROVIDER=mock
STORE_CURRENCY=BRL
DEMO_MODE=true
ADMIN_DEMO_EMAIL=admin@datapulse.local
ADMIN_DEMO_PASSWORD=admin123-local-only
```

Frontend `.env.local` example:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_STORE_NAME=DataPulse Commerce
NEXT_PUBLIC_DEMO_MODE=true
```

Repository rule:

- commit `.env.example`
- do not commit `.env`
- do not commit real secrets

## 8. Folder Organization

Recommended structure:

```text
datapulse-commerce/
├── README.md
├── .env.example
├── docker-compose.yml
├── docker-compose.production.yml
├── backend/
│   ├── alembic/
│   ├── app/
│   │   ├── api/
│   │   ├── adapters/
│   │   ├── core/
│   │   ├── db/
│   │   ├── models/
│   │   ├── schemas/
│   │   └── services/
│   ├── scripts/
│   └── tests/
├── frontend/
│   └── src/
│       ├── app/
│       ├── components/
│       ├── lib/
│       └── types/
├── data/
└── docs/
```

## 9. Operational Development Flow

Daily development flow:

1. Open WSL terminal.
2. Go to project folder.
3. Start Docker services.
4. Activate backend virtual environment.
5. Apply migrations.
6. Seed commerce demo data when needed.
7. Start backend.
8. Start frontend.
9. Test the feature being developed.
10. Run backend tests.
11. Run frontend lint/build when UI changes.
12. Commit.

Example:

```bash
cd ~/projects/datapulse-commerce
docker compose up -d

cd backend
source .venv/bin/activate
alembic upgrade head
python scripts/seed_commerce_demo_data.py
uvicorn app.main:app --reload
```

Second terminal:

```bash
cd ~/projects/datapulse-commerce/frontend
npm run dev
```

## 10. Recommended Ports

| Service | Port |
|---|---:|
| Frontend | 3000 |
| Backend | 8000 |
| PostgreSQL | 5432 |
| PostgreSQL production-like stack | 5433 |
| Redis optional | 6379 |
| pgAdmin optional | 5050 |
| Mail catcher optional | 8025 |

## 11. Good Practices

- Keep backend and frontend separate.
- Keep commerce services modular.
- Keep checkout logic server-side.
- Keep payment provider logic behind adapters.
- Keep inventory changes auditable.
- Keep demo data synthetic.
- Run tests before important commits.
- Update docs when routes, tables, or flows change.

## 12. Common Mistakes

### Mistake 1 — Breaking existing dashboard routes

Always run existing metric checks after adding commerce features.

### Mistake 2 — Calculating trusted prices on frontend

The backend must calculate totals.

### Mistake 3 — Creating duplicate orders on retry

Use idempotency keys.

### Mistake 4 — Updating stock without movements

Every stock change should create an inventory movement.

### Mistake 5 — Committing secrets

Check:

```bash
git status
```

before commit.

## 13. Minimum Local Environment Acceptance

The local environment is ready when:

- PostgreSQL runs with Docker
- backend connects to PostgreSQL
- migrations apply
- frontend opens
- product list loads
- cart API works
- checkout works in mock payment mode
- admin routes are protected
- dashboard still displays metrics
- smoke checks pass
- frontend lint succeeds
