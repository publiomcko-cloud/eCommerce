# Case Study — DataPulse Commerce

## Problem

Many portfolio e-commerce projects stop at a storefront mockup: product cards, a cart page, and a checkout-shaped screen. They often do not show the operational parts that make a commerce system credible, such as inventory, order state, payment state, admin workflows, or analytics.

DataPulse Commerce was built to answer a broader product question:

> Can a portfolio project show a complete commerce workflow from customer shopping behavior to back-office operations and business intelligence?

The project started from a completed DataPulse BI foundation and extended it into a transactional commerce product without discarding the analytics layer.

## Target Users

Primary users:

- Customers who browse products, manage a cart, complete demo checkout, and review account orders.
- Store operators who manage products, variants, inventory, orders, shipments, refunds, and payment status.
- Business stakeholders who need dashboard visibility into revenue, conversion, payment health, and inventory risk.

Portfolio users:

- Recruiters reviewing full-stack engineering skill.
- Clients evaluating whether the project can become a practical commerce/admin/analytics base.
- Developers who need a documented system with reproducible local setup and clear deployment structure.

## Solution

DataPulse Commerce is a full-stack e-commerce portfolio app with:

- public storefront
- product listing and product detail pages
- guest and customer cart persistence
- authenticated customer checkout
- mock payment flow
- customer account area
- admin back office
- inventory management
- order management
- refund and shipment representation
- commerce event logging
- analytics dashboard connected to commerce activity

Payments are intentionally mocked so the public demo is safe to test. Product and order data are synthetic so the app can be shared publicly without exposing real customer, payment, or business data.

## Architecture

The public deployment uses a low-cost portfolio stack:

```text
Browser
  -> Vercel Next.js frontend
  -> Render FastAPI backend
  -> Supabase PostgreSQL
```

Main application layers:

- `frontend/`: Next.js App Router, TypeScript, Tailwind CSS, TanStack Query, and Recharts.
- `backend/`: FastAPI, SQLAlchemy, Alembic, PostgreSQL access through `psycopg`, service-layer business rules, and pytest coverage.
- `docs/`: architecture, testing, deployment, actual state, design plan, screenshots, and this case study.

Main backend domains:

- authentication and role-aware access
- catalog and product variants
- cart and cart item persistence
- checkout sessions and idempotent order creation
- mock payment provider boundary
- inventory movements and reservations
- customer account orders
- admin operations
- commerce metrics and BI projection

## Technical Decisions

### FastAPI and SQLAlchemy

FastAPI provides typed API routes, automatic OpenAPI docs, and a clean structure for separating route handlers from service-layer business rules. SQLAlchemy and Alembic provide explicit relational modeling and migration control for commerce tables.

### PostgreSQL as the source of truth

The app uses PostgreSQL for transactional commerce data and analytics data. This keeps catalog, cart, checkout, order, payment, inventory, and BI records in one inspectable relational system.

### Mock payment provider

The payment layer is built behind an adapter boundary, but the public deployment uses a mock provider. This keeps the demo safe while still showing payment intent creation, success/failure simulation, payment status, and order status transitions.

### Inventory reservation model

Checkout reserves inventory before payment completion. Successful payment captures reserved inventory as a sale movement. Failed payment can release reservations. This makes inventory behavior visible and more realistic than a simple cart-only demo.

### Admin and analytics as first-class product areas

The project does not treat the admin area or dashboard as afterthoughts. Storefront actions connect to admin order management and operational metrics, which makes the product feel closer to a real commerce system.

### Low-cost deployment stack

Vercel, Render, and Supabase were chosen because they are practical for a public portfolio release. The trade-off is that free-tier infrastructure can cold start and is not tuned for production traffic.

## Trade-Offs

- Payments are mocked instead of integrated with Stripe, Mercado Pago, or another real provider.
- Product images use styled fallback visuals instead of production media storage.
- Email, tax, shipping-rate, and promotion engines are not implemented yet.
- Demo credentials are public and meant only for portfolio review.
- Render free-tier hosting may cold start after inactivity.
- The system has transactional design and test coverage, but it has not been load-tested.

These trade-offs were intentional for a portfolio release: they keep the project safe, inexpensive, and easy to review while still demonstrating product depth.

## Results

Implemented and deployed:

- public Vercel frontend
- Render FastAPI backend
- Supabase PostgreSQL database
- database migrations and demo seed data
- public API docs
- customer and admin demo accounts
- storefront, catalog, cart, checkout, account, admin, and dashboard pages
- mock payment and checkout flow
- commerce metrics and analytics dashboard
- README with live links and screenshots
- browser-verified cart, login, admin, and dashboard flows

Current live links:

- Frontend: https://e-commerce-omega-nine-82.vercel.app
- Backend health: https://ecommerce-8ngt.onrender.com/health
- API docs: https://ecommerce-8ngt.onrender.com/docs

## Next Steps

Recommended next portfolio improvements:

- Add a short demo video using `docs/demo_script.md`.
- Add GitHub Actions CI for backend tests, frontend lint, and frontend build.
- Add minimal Playwright E2E coverage for customer login and cart checkout.
- Add a custom domain for the Vercel frontend.
- Replace fallback product visuals with hosted product images.
- Add a sandbox payment adapter.
- Add email, shipping-rate, tax, and promotion integrations.
- Add richer analytics, such as cohort views and funnel timelines.
