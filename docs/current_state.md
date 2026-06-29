# Current State — DataPulse Commerce

This document describes the current public portfolio state of DataPulse Commerce.
Historical planning notes are kept in `docs/archive/`.

## Public Demo

- Frontend: https://e-commerce-omega-nine-82.vercel.app
- Backend health: https://ecommerce-8ngt.onrender.com/health
- API docs: https://ecommerce-8ngt.onrender.com/docs
- Demo video: https://youtu.be/hUUpPVHVA40

## Current Stack

- Frontend hosting: Vercel
- Backend hosting: Render
- Database hosting: Supabase PostgreSQL
- Frontend: Next.js App Router, TypeScript, Tailwind CSS, TanStack Query
- Backend: FastAPI, SQLAlchemy, Alembic, PostgreSQL
- Testing and validation: pytest, Playwright, frontend lint/build
- Automation: GitHub Actions CI and manual E2E workflow

## Implemented Features

- Storefront home page
- Product catalog and product detail pages
- Persistent cart
- Authenticated checkout
- Mock payment flow
- Customer account page with profile, addresses, and order history
- Admin overview
- Admin order management
- Admin product and inventory management
- Shipment and refund representation for admin order workflows
- Commerce analytics dashboard
- Commerce events and projection into the BI metrics layer

## Current Validation Commands

Backend validation:

```bash
cd backend
source .venv/bin/activate
python -m pytest
python scripts/run_smoke_checks.py
python scripts/run_commerce_smoke_checks.py
```

Frontend validation:

```bash
cd frontend
npm run lint
npm run build
npm run test:e2e
```

The repository also includes a manual GitHub Actions E2E workflow in
`.github/workflows/e2e.yml` for validating the deployed Vercel frontend against
the Render backend.

The public demo video is available at https://youtu.be/hUUpPVHVA40.

## Current Limitations

- Payments are mocked.
- Product and order data are synthetic.
- No real email engine is implemented.
- No real freight/shipping-rate engine is implemented.
- No real tax engine is implemented.
- No promotion/coupon engine is implemented.
- No load test has been completed.
- Render free-tier hosting may cold start after inactivity.
