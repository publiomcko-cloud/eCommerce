# Deployment Strategy — DataPulse Commerce

## 1. Purpose

This document describes how DataPulse Commerce should be deployed as a portfolio-ready e-commerce product built on top of the existing DataPulse BI foundation.

The first public deployment should be simple, low-cost, safe, and convincing.

It must demonstrate:

- public storefront
- working catalog
- cart and checkout using safe demo payment
- customer account area
- admin back office access through protected credentials
- analytics dashboard
- backend healthcheck
- hosted PostgreSQL database
- documented environment variables
- no real payment secrets committed

## 2. Deployment Goals

The deployment must provide:

- public frontend URL
- backend API URL
- hosted PostgreSQL database
- safe demo seed data
- mock or sandbox payment mode
- demo credentials configured for synthetic public portfolio review
- environment variable documentation
- healthcheck validation
- dashboard validation
- README links

## 2.1 Current Public Deployment

Current portfolio deployment:

- Frontend: https://e-commerce-omega-nine-82.vercel.app
- Backend health: https://ecommerce-8ngt.onrender.com/health
- API docs: https://ecommerce-8ngt.onrender.com/docs
- Frontend hosting: Vercel
- Backend hosting: Render
- Database hosting: Supabase PostgreSQL
- Payment mode: mock payment flow only
- Demo data: synthetic portfolio data

## 3. Recommended Deployment Architecture

```text
User Browser
    |
    v
Frontend on Vercel or container platform
    |
    v
FastAPI backend on Render / Railway / Fly.io / VPS
    |
    v
Managed PostgreSQL
    |
    +--> optional object storage for product images
    +--> optional email provider
    +--> optional payment sandbox
```

For the first portfolio release, a mock payment provider is acceptable and safer than a real provider.

## 4. Frontend Deployment

Recommended service:

- Vercel for Next.js

Required environment variables:

```env
NEXT_PUBLIC_API_URL=https://your-backend-url
```

Deployment steps:

1. Push repository to GitHub.
2. Import the frontend project into Vercel.
3. Set root directory to `frontend`.
4. Add environment variables.
5. Deploy.
6. Validate storefront, product listing, product detail, cart, checkout, account, admin login, and dashboard pages.

## 5. Backend Deployment

Recommended services:

- Render
- Railway
- Fly.io
- VPS with Docker

Required environment variables:

```env
DATABASE_URL=postgresql+psycopg://user:password@host:5432/database
ENVIRONMENT=production
CORS_ORIGINS=https://your-frontend-url
SECRET_KEY=
ACCESS_TOKEN_EXPIRE_MINUTES=30
STORE_CURRENCY=BRL
ADMIN_DEMO_EMAIL=
ADMIN_DEMO_PASSWORD=
```

Future production variables, once the matching code exists:

```env
REFRESH_TOKEN_EXPIRE_DAYS=7
PAYMENT_WEBHOOK_SECRET=
```

Recommended production command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

## 6. Database Deployment

Recommended options:

- Render PostgreSQL
- Railway PostgreSQL
- Supabase PostgreSQL
- Neon PostgreSQL
- VPS PostgreSQL for advanced control

Production database rules:

- never use local credentials in production
- run migrations before loading seed data
- keep a backup/export plan once real data exists
- use synthetic demo data for portfolio mode

## 7. Object Storage and Images

For MVP, product images may be:

- static frontend assets
- external placeholder URLs
- local uploaded files in development

For production-like deployment, prefer:

- S3-compatible object storage
- Cloudflare R2
- Supabase Storage
- provider-specific object storage

Do not store large image binaries directly in PostgreSQL.

## 8. Payment Deployment Modes

## 8.1 Mock mode

Recommended for public portfolio demo.

Capabilities:

- simulate payment success
- simulate payment failure
- avoid real credentials
- allow reviewers to complete checkout safely

## 8.2 Sandbox mode

Use when a real payment provider adapter is implemented.

Requirements:

- sandbox API keys in environment variables
- webhook secret in environment variables
- webhook endpoint exposed publicly
- idempotent webhook processing

## 8.3 Production mode

Only use after security review.

Requirements:

- provider terms understood
- HTTPS everywhere
- secure webhook validation
- no card data handled by the app
- production logs sanitized

## 9. Publication Order

Recommended order:

1. Confirm local tests pass.
2. Build production-like Docker stack locally.
3. Create hosted PostgreSQL database.
4. Deploy backend with production environment variables.
5. Run migrations.
6. Seed demo catalog, customer, orders, and analytics data.
7. Validate `/health`.
8. Validate Swagger/OpenAPI docs if public.
9. Deploy frontend with backend URL.
10. Validate storefront.
11. Validate cart and checkout in demo mode.
12. Validate admin login.
13. Validate dashboard metrics.
14. Add live links and demo credentials guidance to README.

## 9.1 Local Pre-Deployment Validation

Run these checks before creating or updating the public deployment:

```bash
cd frontend
npm run lint
npm run build

cd ../backend
.venv/bin/alembic upgrade head
.venv/bin/python -m pytest
.venv/bin/python scripts/seed_demo_data.py
.venv/bin/python scripts/seed_commerce_demo_data.py
.venv/bin/python scripts/run_smoke_checks.py
.venv/bin/python scripts/run_commerce_smoke_checks.py
```

Latest documentation cleanup validation, June 29, 2026:

- backend test suite passed: 40 tests
- frontend lint passed
- frontend production build passed
- Playwright customer-login E2E passed against the deployed demo

Demo credentials validated locally:

- customer: `customer@datapulse.local` / `customer123-local-only`
- admin: `admin@datapulse.local` / `admin123-local-only`

## 9.2 During Deployment Checklist

Use this checklist after choosing the hosting platform.

- create a managed PostgreSQL database
- configure backend environment variables:
  - `DATABASE_URL`
  - `SECRET_KEY`
  - `CORS_ORIGINS`
  - `ENVIRONMENT=production`
  - `ADMIN_DEMO_EMAIL`
  - `ADMIN_DEMO_PASSWORD`
- deploy the backend API
- run `alembic upgrade head` against the hosted database
- run `python scripts/seed_demo_data.py`
- run `python scripts/seed_commerce_demo_data.py`
- if paid demo commerce orders are created during validation, run `python scripts/project_commerce_analytics.py`
- validate the backend `/health` endpoint
- configure frontend environment variables:
  - `NEXT_PUBLIC_API_URL`
- deploy the frontend
- confirm the deployed frontend can call the deployed backend without CORS errors

## 9.3 Redeployment Validation Checklist

Use this checklist after future public deployment changes.

- test customer registration and login
- test admin login
- test product listing and product detail pages
- add a product to cart
- complete checkout with mock payment success
- confirm order confirmation renders
- confirm customer account order history renders
- confirm admin order list and order detail render
- confirm admin product and inventory pages render
- confirm dashboard metrics render
- test mobile layout on the deployed URL
- verify no secret values are visible in frontend source or browser network payloads
- update `README.md` with:
  - live frontend link
  - live backend/API docs link if public
  - demo credentials
  - screenshots from the deployed app
  - short feature list
  - architecture explanation
  - known limitations: mock payments and synthetic data

## 10. Migrations in Production

After backend deployment, run:

```bash
alembic upgrade head
```

Possible execution methods:

- platform shell
- release command
- CI/CD migration step
- local command pointed at production database
- one-off backend container command

Do not run seed commands before migrations succeed.

## 11. Demo Data Loading

The demo seed should create:

- admin user
- customer demo user
- categories
- products
- variants
- inventory

Example command:

```bash
python scripts/seed_commerce_demo_data.py
```

The existing `seed_demo_data.py` remains for the BI layer. Use `project_commerce_analytics.py` after paid demo commerce orders exist to project commerce order items into the analytics model.

Recommended demo data sequence:

```bash
python scripts/seed_demo_data.py
python scripts/seed_commerce_demo_data.py
python scripts/project_commerce_analytics.py
```

## 12. Healthcheck

Backend must expose:

```http
GET /health
```

Expected response shape:

```json
{
  "status": "ok",
  "database": "ok",
  "environment": "production",
  "commerce": "ok"
}
```

## 13. Post-Deployment Validation

After deployment, validate:

- frontend opens
- backend healthcheck works
- product list loads
- product detail loads
- cart operations work
- checkout can be completed in demo payment mode
- order confirmation appears
- customer order history works
- admin login works
- admin product list loads
- admin order list loads
- dashboard loads KPI cards
- commerce metrics reflect seeded orders
- no secrets are visible in frontend source
- API rejects unauthorized admin access
- README contains live links and known demo limitations

## 14. CORS

The backend must allow requests from the deployed frontend URL.

Example:

```env
CORS_ORIGINS=https://datapulse-commerce.vercel.app
```

Do not use wildcard origins in production unless the app is intentionally public API only.

## 15. Logging

Minimum logs to check:

- backend startup
- database connection
- authentication failures
- checkout failures
- payment adapter failures
- webhook processing
- inventory reservation failures
- API validation errors
- analytics projection errors

Logs must not expose:

- passwords
- access tokens
- refresh tokens
- payment secrets
- private provider payloads without sanitization

## 16. Production-Like Local Validation

This compose file is for local validation only. Do not use it as real production infrastructure.

Current command:

```bash
docker compose -p datapulse-commerce-prod -f docker-compose.production.yml up -d --build
docker exec datapulse_backend_prod alembic upgrade head
docker exec datapulse_backend_prod python scripts/seed_demo_data.py
docker exec datapulse_backend_prod python scripts/seed_commerce_demo_data.py
docker exec datapulse_backend_prod python scripts/project_commerce_analytics.py
curl http://localhost:8000/health
curl http://localhost:8000/catalog/products
curl http://localhost:8000/metrics/payment-health
curl http://localhost:8000/metrics/summary
docker compose -p datapulse-commerce-prod -f docker-compose.production.yml down
```

## 17. Deployment Risks

### Risk 1 — Checkout creates duplicate orders

Mitigation:

- require idempotency keys
- test retry behavior

### Risk 2 — Inventory inconsistency

Mitigation:

- reserve stock transactionally
- add inventory movement records
- test concurrent checkout scenarios

### Risk 3 — CORS misconfiguration

Mitigation:

- configure deployed frontend origin explicitly
- test browser requests after deployment

### Risk 4 — Missing migrations

Mitigation:

- run `alembic upgrade head`
- verify tables exist

### Risk 5 — Demo payment misunderstood as real payment

Mitigation:

- label demo checkout clearly
- use mock payment provider in public portfolio mode

### Risk 6 — Admin demo exposed dangerously

Mitigation:

- restrict demo admin capabilities if needed
- use synthetic data only
- avoid destructive public actions in live demo

## 18. Deployment Acceptance Criteria

Deployment is acceptable when:

- public storefront loads
- backend healthcheck is OK
- hosted database is connected
- migrations are applied
- demo data exists
- checkout works in safe demo mode
- admin back office works
- dashboard displays commerce metrics
- README has live links
- limitations are documented
- secrets are not committed
