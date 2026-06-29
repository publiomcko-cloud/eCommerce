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

## Current Validation

- Backend pytest suite
- Backend smoke checks
- Commerce smoke checks
- Frontend lint
- Frontend production build
- Manual Playwright E2E test for customer login
- Manual GitHub Actions E2E workflow for the deployed demo
- Public demo video

## Current Limitations

- Payments are mocked.
- Product and order data are synthetic.
- No real email engine is implemented.
- No real freight/shipping-rate engine is implemented.
- No real tax engine is implemented.
- No promotion/coupon engine is implemented.
- No load test has been completed.
- Render free-tier hosting may cold start after inactivity.
