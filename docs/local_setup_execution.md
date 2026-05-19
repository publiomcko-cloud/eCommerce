# Local Setup and Execution Guide — DataPulse Commerce

## 1. Purpose

This document provides sequential instructions for running DataPulse Commerce locally.

The commands assume Linux or WSL2 Ubuntu.

The project is built on top of the completed DataPulse BI repository, so the first goal is to preserve the existing working BI setup and then add the commerce layer.

## 2. Prerequisites

Install:

- Git
- Docker
- Docker Compose
- Python 3.11 or 3.12
- Node.js
- npm
- VS Code

Check versions:

```bash
git --version
docker --version
docker compose version
python3 --version
node -v
npm -v
```

## 3. Project Folder

Recommended new folder:

```bash
mkdir -p ~/projects
cd ~/projects
git clone <your-repository-url> datapulse-commerce
cd datapulse-commerce
```

If the repository already exists as `datapulse-bi`, you may keep it:

```bash
cd ~/projects/datapulse-bi
```

## 4. Validate Existing BI Baseline

Before adding commerce code, validate the existing baseline.

Start PostgreSQL:

```bash
docker compose up -d
```

Backend validation:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
alembic upgrade head
python scripts/check_db_connection.py
pytest
```

Frontend validation:

```bash
cd ../frontend
npm install
npm run lint
npm run build
```

Expected:

- database connection works
- existing migrations apply
- backend tests pass
- frontend lint succeeds
- frontend build succeeds

## 5. Environment Files

Create root or backend `.env` from `.env.example`.

Backend local example:

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

Frontend `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_STORE_NAME=DataPulse Commerce
NEXT_PUBLIC_DEMO_MODE=true
```

## 6. Docker Compose

The existing PostgreSQL service is enough for the first implementation.

Optional future local services:

```yaml
services:
  postgres:
    image: postgres:16
    container_name: datapulse_postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: datapulse
      POSTGRES_PASSWORD: datapulse
      POSTGRES_DB: datapulse
    ports:
      - "5432:5432"
    volumes:
      - datapulse_postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    container_name: datapulse_redis
    restart: unless-stopped
    ports:
      - "6379:6379"

volumes:
  datapulse_postgres_data:
```

Redis is optional until background jobs are implemented.

## 7. Backend Dependencies

Use existing backend dependencies first.

Commerce features may require adding packages for:

- password hashing
- token handling
- email validation
- multipart uploads if product images are uploaded through API

Update `requirements.txt` only when the dependency is actually used.

Then install:

```bash
cd backend
source .venv/bin/activate
pip install -r requirements.txt
```

## 8. Run Migrations

From `backend/`:

```bash
alembic upgrade head
```

Validate tables:

```bash
cd ..
docker exec datapulse_postgres psql -U datapulse -d datapulse -c "\dt"
```

Expected after commerce migrations:

- existing BI tables remain
- new commerce tables exist
- migration history is current

## 9. Seed Demo Data

Existing BI seed may remain:

```bash
cd backend
source .venv/bin/activate
python scripts/seed_demo_data.py
```

New commerce seed should be added:

```bash
python scripts/seed_commerce_demo_data.py
```

Expected commerce seed:

- admin demo user
- customer demo user
- categories
- products
- variants
- inventory
- coupon
- sample completed orders
- commerce events
- analytics projection data

## 10. Run Backend

From `backend/`:

```bash
source .venv/bin/activate
uvicorn app.main:app --reload
```

Validate:

```bash
curl http://localhost:8000/health
curl http://localhost:8000/catalog/products
curl http://localhost:8000/metrics/summary
```

Expected:

- healthcheck returns OK
- catalog endpoint returns products after seed
- metrics endpoint still works

## 11. Run Frontend

From `frontend/`:

```bash
npm install
npm run dev
```

Open:

- `http://localhost:3000`
- `http://localhost:3000/products`
- `http://localhost:3000/cart`
- `http://localhost:3000/checkout`
- `http://localhost:3000/account`
- `http://localhost:3000/admin`
- `http://localhost:3000/dashboard`

## 12. Manual Commerce Validation

After backend and frontend are running:

1. Open storefront.
2. Open product listing.
3. Open product detail.
4. Add product to cart.
5. Update quantity.
6. Go to checkout.
7. Fill safe demo checkout data.
8. Place order with mock payment.
9. Confirm order confirmation screen.
10. Open account order history.
11. Login as admin.
12. Check order in admin panel.
13. Check dashboard metrics.

## 13. API Smoke Checks

Suggested commerce smoke script:

```bash
cd backend
source .venv/bin/activate
python scripts/run_commerce_smoke_checks.py
```

Expected smoke behavior:

- healthcheck OK
- seed catalog exists
- product list endpoint returns products
- cart can be created
- item can be added
- checkout session can be created
- mock payment can succeed
- order is created once
- inventory reservation or sale movement exists
- metrics endpoint returns commerce order values

## 14. Test Commands

Backend:

```bash
cd backend
source .venv/bin/activate
python -m compileall app scripts
pytest
```

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

## 15. Production-Like Local Validation

After Dockerfiles and compose are updated for commerce:

```bash
cd ~/projects/datapulse-commerce
docker compose -p datapulse-commerce-prod -f docker-compose.production.yml up -d --build
docker exec datapulse_backend_prod alembic upgrade head
docker exec datapulse_backend_prod python scripts/seed_commerce_demo_data.py
curl http://localhost:8000/health
curl http://localhost:8000/catalog/products
curl http://localhost:8000/metrics/summary
docker compose -p datapulse-commerce-prod -f docker-compose.production.yml down
```

## 16. Daily Startup Commands

Terminal 1:

```bash
cd ~/projects/datapulse-commerce
docker compose up -d
```

Terminal 2:

```bash
cd ~/projects/datapulse-commerce/backend
source .venv/bin/activate
alembic upgrade head
uvicorn app.main:app --reload
```

Terminal 3:

```bash
cd ~/projects/datapulse-commerce/frontend
npm run dev
```

## 17. Daily Shutdown

```bash
cd ~/projects/datapulse-commerce
docker compose down
```

To reset database completely:

```bash
docker compose down -v
```

Then run migrations and seed again.

## 18. Final Local Checklist

- [ ] Docker services running
- [ ] Backend virtual environment active
- [ ] Dependencies installed
- [ ] Migrations applied
- [ ] BI baseline still works
- [ ] Commerce seed data loaded
- [ ] Backend starts
- [ ] Frontend starts
- [ ] Product list works
- [ ] Product detail works
- [ ] Cart works
- [ ] Checkout works in mock mode
- [ ] Order confirmation works
- [ ] Admin area works
- [ ] Dashboard shows commerce metrics
- [ ] Backend tests pass
- [ ] Frontend lint/build pass
