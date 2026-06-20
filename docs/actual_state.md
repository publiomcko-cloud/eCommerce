# Actual State — DataPulse Commerce

## 1. Purpose

This document describes the current implementation state of DataPulse Commerce:
a complete local e-commerce portfolio project built on top of the completed
DataPulse BI foundation.

It is intended to help:

- future developers
- AI development agents
- reviewers
- portfolio evaluators
- maintainers who need to understand what already exists and what must be built next

This document is descriptive and directional. It separates what is implemented
locally from the remaining public deployment and roadmap work.

## 2. Baseline Assumption

The existing DataPulse BI project is treated as complete enough to become the analytical foundation of the new e-commerce product.

The current foundation already provides:

- a working full-stack application
- a PostgreSQL database
- a FastAPI backend
- a Next.js frontend
- a synthetic order and revenue dataset
- CSV ingestion
- data validation
- raw, staging, dimension, and fact tables
- metric endpoints
- dashboard screens
- a manual order testing flow
- local development documentation
- backend tests
- frontend linting
- production-like Docker validation assets

The new product must not discard this foundation. It must extend it.

## 3. Current Product Interpretation

The previous product can be understood as:

> A portfolio-grade business intelligence system focused on order, product, revenue, region, channel, ingestion status, and data quality metrics.

The current local product is:

> A complete e-commerce platform with a public storefront, customer account area, cart, checkout, payment abstraction, inventory control, order management, admin back office, and integrated BI dashboard powered by the existing DataPulse analytics foundation.

## 4. Current Implemented Foundation

### 4.1 Backend foundation

The existing backend already includes:

- FastAPI application bootstrap
- settings loaded from environment variables
- SQLAlchemy models
- Alembic migration setup
- PostgreSQL access through `psycopg`
- health endpoint
- ingestion status endpoints
- metric endpoints
- order endpoints
- ingestion services
- transformation services
- metric services
- test suite

### 4.2 Frontend foundation

The existing frontend already includes:

- Next.js App Router
- TypeScript
- Tailwind CSS
- Recharts
- TanStack Query
- dashboard page
- filter bar
- KPI cards
- charts
- recent orders table
- ingestion status panel
- manual order testing page
- shared top navigation

### 4.3 Data foundation

The existing data foundation already includes:

- `ingestion_runs`
- `raw_orders`
- `stg_orders`
- `dim_products`
- `dim_customers`
- `dim_regions`
- `dim_channels`
- `fact_orders`
- `data_quality_issues`

These structures are valuable and should remain available for analytics.

## 4.4 Stage 0 baseline validation snapshot

Stage 0 of the DataPulse Commerce development plan has been validated against the current repository state.

Validated on:

- 2026-05-19

Repository state:

- the DataPulse BI application code has been copied into this repository
- the DataPulse Commerce documentation package is present in `docs/`
- the repository directory is initialized as a Git repository
- a Stage 0 checkpoint commit exists before commerce implementation proceeds

Validated baseline checks:

- Alembic migrations apply successfully with `alembic upgrade head`
- backend test suite passes
- frontend lint passes
- frontend production build passes
- smoke checks pass end to end
- backend health endpoint responds successfully
- dashboard route responds successfully
- manual order page route responds successfully

Current local baseline behavior after smoke validation:

- the backend runs locally with PostgreSQL
- the frontend runs locally with `NEXT_PUBLIC_API_URL=http://localhost:8000`;
  for browser calls in local/WSL development it proxies local API requests
  through the Next.js rewrite at `/api/backend`
- the sample pipeline dataset is available after smoke validation
- `/metrics/summary` returns non-empty demo values
- `/ingestion/runs/latest` returns a successful `transform_orders` run

## 4.5 Stage 1 identity foundation snapshot

The first commerce stage is now implemented on top of the BI baseline.

Implemented Stage 1 capabilities:

- `commerce_users`, `commerce_customers`, and `commerce_customer_addresses` tables
- password hashing utility
- stateless bearer token strategy
- `/auth/register`
- `/auth/login`
- `/auth/me`
- `/auth/logout`
- admin-only route guard utility with a protected auth check route
- frontend login page
- frontend registration page
- frontend account shell page
- auth-aware top navigation
- backend auth test coverage

## 4.6 Stage 2 catalog and inventory foundation snapshot

The second commerce stage is now implemented on top of the identity layer.

Implemented Stage 2 capabilities:

- `commerce_categories`, `commerce_products`, `commerce_product_images`, `commerce_product_variants`, `commerce_inventory_items`, and `commerce_inventory_movements` tables
- public catalog endpoints for categories, product listing, and product detail by slug
- protected admin endpoints for product create, product update, product detail, product list, and inventory adjustments
- catalog and inventory service layer with slug, SKU, stock, and status rules
- demo catalog seed script with admin and customer demo user bootstrap
- frontend product listing page
- frontend product detail page
- frontend admin product list page
- frontend admin product editor page
- inventory adjustment controls in the admin editor
- backend catalog and inventory tests

## 4.7 Stage 3 cart foundation snapshot

The third commerce stage is now implemented on top of the catalog layer.

Implemented Stage 3 capabilities:

- `commerce_carts` and `commerce_cart_items` tables
- guest cart persistence through an anonymous cart token
- customer cart persistence linked to the authenticated customer profile
- automatic guest-cart-to-customer-cart merge after login or registration
- cart API for retrieval, add item, update quantity, and remove item
- server-side cart totals and line totals
- cart validation against active product and variant status
- cart validation against available stock with backorder awareness
- duplicate variant line merge behavior
- frontend cart page
- header cart summary and cart count
- product detail add-to-cart flow
- backend cart test coverage

## 4.8 Stage 4 checkout and order creation snapshot

The fourth commerce stage is now implemented on top of the cart foundation.

Implemented Stage 4 capabilities:

- `commerce_checkout_sessions`, `commerce_orders`, `commerce_order_items`, and `commerce_order_status_history` tables
- checkout session creation with shipping and billing address snapshots
- server-side totals snapshots captured on checkout sessions and orders
- idempotent order placement keyed by a client-supplied idempotency key
- order number generation for placed orders
- inventory reservation through `stock_reserved` updates and reservation movement records
- cart conversion after order placement
- checkout API for session creation, order placement, and order retrieval
- frontend checkout page for authenticated customers
- frontend order confirmation page
- backend checkout and reservation test coverage

## 4.9 Stage 5 payment abstraction snapshot

The fifth commerce stage is now implemented on top of the checkout foundation.

Implemented Stage 5 capabilities:

- `commerce_payments` table
- payment provider adapter boundary with a mock provider implementation
- payment intent creation for placed orders
- mock payment success simulation
- mock payment failure simulation
- mock webhook endpoint skeleton with idempotent event handling
- order status transition from `pending_payment` to `paid` on successful payment
- inventory reservation capture into `sale` movements on successful payment
- reservation release into `release` movements on failed payment
- frontend payment state section on the order confirmation page
- backend payment test coverage for success, failure, and idempotent webhook replay

## 4.10 Stage 6 customer account snapshot

The sixth commerce stage is now implemented on top of the payment foundation.

Implemented Stage 6 capabilities:

- protected account API for customer profile, address CRUD, order list, and order detail
- server-side ownership checks for addresses and orders
- frontend account overview backed by the dedicated account profile endpoint
- frontend address management UI with add, edit, and delete flows
- frontend order history list in the account area
- frontend owned order detail panel with item and payment snapshot visibility
- backend ownership and account flow test coverage

## 4.11 Stage 7 admin back office snapshot

The seventh commerce stage is now implemented on top of the customer account foundation.

Implemented Stage 7 capabilities:

- admin overview API with product, order, shipment, and low-stock summary metrics
- admin order list API with status, payment, and shipment filters
- admin order detail API with payment, shipment, and status-history visibility
- admin order status transition API with guarded lifecycle rules
- `commerce_shipments` table and shipment upsert API
- existing inventory adjustment API expanded into a dedicated admin inventory workspace
- frontend admin dashboard page
- frontend admin order list page
- frontend admin order detail page
- frontend admin inventory page
- backend admin authorization and order transition test coverage
- `commerce_refunds` table
- protected admin refund creation API for successfully paid orders
- refund visibility in admin order detail
- refund amount validation against remaining paid balance

## 4.12 Stage 8 commerce analytics integration snapshot

The eighth commerce stage is now implemented on top of the admin back office.

Implemented Stage 8 capabilities:

- `commerce_events` table
- commerce event emission for product views, cart item adds, checkout start, order creation, payment success/failure, shipment updates, and refund creation
- commerce analytics projection service from paid commerce order items into the existing dimensional `fact_orders` analytics model
- projection script at `backend/scripts/project_commerce_analytics.py`
- product, customer, region, and channel dimension mapping for projected commerce facts
- commerce revenue by category metric
- conversion funnel metric
- cart abandonment metric
- payment health metric with refund impact
- inventory risk metric
- dashboard widgets for commerce GMV, payment success, cart abandonment, inventory risk, funnel counts, and revenue by category
- backend tests for commerce events, operational metrics, and idempotent analytics projection

## 4.13 Stage 9 testing, hardening, and validation snapshot

The ninth commerce stage is now implemented as a validation layer over the completed transactional and analytics flows.

Implemented Stage 9 capabilities:

- backend test suite covering BI baseline, ingestion, transformation, metrics, auth, catalog, cart, checkout, payments, account ownership, admin operations, refunds, commerce events, and analytics projection
- commerce smoke script at `backend/scripts/run_commerce_smoke_checks.py`
- commerce smoke validates health, catalog seed, customer registration, product detail, cart, checkout, idempotent order placement, mock payment success, customer order visibility, operational metrics, and analytics projection
- existing BI smoke script retained at `backend/scripts/run_smoke_checks.py`
- frontend lint validation
- frontend production build validation
- testing documentation updated with current validation commands

## 4.14 Stage 10 deployment and portfolio polish snapshot

Stage 10 is partially implemented locally. External deployment tasks still require hosted service access and final public URLs.

Implemented Stage 10 preparation:

- README rewritten as a portfolio case study with local setup, validation commands, demo credentials, known limitations, and roadmap
- production environment examples updated for commerce demo mode
- Render blueprint renamed for DataPulse Commerce and expanded with commerce-related environment variables
- frontend Docker build fixed for standalone Next.js output
- production-like Docker compose configuration validated with `docker compose -f docker-compose.production.yml config`
- backend healthcheck now reports commerce readiness with `commerce: ok`
- deployment documentation updated with current seed, projection, healthcheck, and validation commands
- local pre-deployment validation completed on June 1, 2026:
  - frontend lint passed
  - frontend production build passed
  - Alembic migrations applied successfully
  - backend test suite passed with 40 tests
  - BI and commerce smoke checks passed
  - local storefront, login, products, admin, and dashboard routes returned `200`
- deterministic demo credentials are available:
  - customer: `customer@datapulse.local` / `customer123-local-only`
  - admin: `admin@datapulse.local` / `admin123-local-only`
- login page includes demo-user autofill buttons for the customer and admin accounts

Still pending for final public portfolio release:

- hosted PostgreSQL deployment
- hosted backend deployment
- hosted frontend deployment
- public checkout validation
- public admin demo validation
- public dashboard validation
- screenshots
- live links

## 4.15 E-Commerce Redesign And Navigation Snapshot

The ecommerce redesign plan in `docs/design_plan.md` is implemented locally.

Implemented design and flow capabilities:

- `/` is now a product-led storefront home rather than the analytics dashboard
- `/dashboard` is the analytics route
- product listing, product detail, cart, checkout, confirmation, login,
  register, account, admin, and dashboard pages have been redesigned around the
  ecommerce flow
- header navigation changes by user state:
  - guest: Store, Products, Cart, Login, Register
  - customer: Store, Products, Cart, Account, Logout
  - admin: Store, Products, Cart, Account, Admin, Analytics, Logout
- cart count badge is shown in the header
- admin routes include a compact admin subnav
- footer utility links and a demo safety note are present
- reusable product visual fallback prevents generic framework SVGs from reading
  as product imagery
- login page exposes customer/admin demo credential autofill buttons
- contrast fixes were applied to affected CTA buttons such as `Shop products`,
  `Continue shopping`, and the logged-out account `Login` action

Still pending for portfolio presentation:

- public deployment screenshots
- live frontend/backend links
- manual visual QA on the final hosted mobile, tablet, and desktop URLs

## 5. What Changes in the New Product

DataPulse Commerce adds transactional commerce behavior in front of the existing analytics system.

The new system must support:

- product catalog browsing
- product details
- categories and collections
- search and filtering
- product variants
- product images
- inventory availability
- cart management
- checkout
- customer accounts
- addresses
- order creation
- order status lifecycle
- payment provider abstraction
- payment webhook handling
- refund representation
- shipping method selection
- shipment tracking representation
- admin catalog management
- admin inventory management
- admin order management
- customer order history
- e-commerce event logging
- analytics synchronization into the existing BI layer

## 6. Core Design Principle

The transactional commerce layer and the analytical BI layer must be connected but not mixed.

```text
Commerce transaction tables
        |
        v
Commerce events / order projection
        |
        v
Existing ingestion and transformation style
        |
        v
Analytics tables and dashboard metrics
```

The checkout flow must write reliable transactional records first. Analytics should be updated from those records or from an event projection.

## 7. Main Modules to Add

## 7.1 Identity and access

Required capabilities:

- customer registration
- customer login
- admin login
- password hashing
- session or token handling
- role-based authorization
- protected admin routes
- protected customer account routes

Initial roles:

- `guest`
- `customer`
- `admin`
- `analyst`

## 7.2 Catalog

Required capabilities:

- categories
- products
- variants
- product images
- prices
- sale status
- stock status
- product search
- product filters
- product detail page

## 7.3 Cart

Required capabilities:

- anonymous cart
- customer cart
- add item
- update quantity
- remove item
- cart totals
- stock validation before checkout

## 7.4 Checkout

Required capabilities:

- shipping address
- billing address
- shipping method
- payment method selection
- order review
- idempotent order placement
- inventory reservation
- payment intent/session creation
- final order confirmation

## 7.5 Payment abstraction

The platform should start with a payment adapter interface.

Initial implementation may use:

- mock payment provider for local development and portfolio demo
- sandbox provider adapter later
- production payment provider later

The checkout design must not hardcode one provider into business logic.

## 7.6 Order lifecycle

Implemented order statuses:

- `pending_payment`
- `paid`
- `cancelled`

Every status change must be recorded in an order status history table.

Shipment and refund state are represented separately through shipment and
refund records.

## 7.7 Inventory

Required capabilities:

- current stock by product variant
- reserved stock
- available stock
- inventory movements
- stock adjustments by admin
- automatic reservation during checkout
- release reservation if payment fails or checkout expires

## 7.8 Admin back office

Required screens:

- admin overview
- product list
- product editor
- category management
- inventory adjustments
- order list
- order detail
- payment/refund status
- shipment status
- analytics shortcut

## 7.9 BI integration

The existing dashboard must evolve from a static/synthetic BI demo into an operational commerce analytics module.

Metrics should include:

- gross merchandise value
- net revenue
- orders
- average order value
- conversion funnel
- cart abandonment
- revenue by category
- revenue by product
- revenue by channel
- revenue by region
- payment success rate
- refund rate
- inventory risk
- top customers or customer segments when safe

## 8. What Must Be Preserved

The implementation must preserve:

- existing backend structure where practical
- existing database migration strategy
- existing dashboard screens until replaced or upgraded
- existing metric endpoints until new versions are implemented
- existing tests unless they become obsolete by documented migration
- existing local startup flow
- existing Docker validation approach
- existing documentation discipline

## 9. Remaining Gaps After Stage 10 Local Prep

The local portfolio MVP is complete, tested, and documented. Remaining gaps are
publication or roadmap work:

- public hosted database/backend/frontend deployment
- public screenshots and live links in the README
- real payment provider integration
- coupon and promotion engine
- tax calculation
- live shipping-rate providers
- email delivery provider
- object storage for uploaded product media
- broader browser E2E and load testing
- production e-commerce security hardening

## 10. Implementation Strategy

The safest strategy is incremental expansion:

1. freeze the completed BI baseline
2. add commerce database migrations without breaking old tables
3. add authentication and roles
4. add catalog and inventory models
5. add catalog storefront screens
6. add cart API and UI
7. add checkout API and UI with mock payment
8. add order lifecycle and admin screens
9. connect commerce orders to analytics projections
10. upgrade dashboard metrics to use live commerce data
11. add tests and production deployment preparation

## 11. Target Repository Identity

The repository may keep the original name for continuity, but the product identity should become:

```text
DataPulse Commerce
```

Recommended tagline:

```text
A full-stack e-commerce platform with built-in business intelligence.
```

## 12. Acceptance Criteria for the New Actual State

The new e-commerce stage can be considered complete when:

- a visitor can browse products
- a visitor can add products to cart
- a customer can create an account or checkout through a safe demo flow
- the system creates orders transactionally
- inventory is reserved and updated correctly
- payment status is represented through a provider abstraction
- admins can manage products, inventory, and orders
- customers can view order history
- the analytics dashboard reflects real commerce orders
- tests cover checkout, inventory, orders, and metrics
- local setup and deployment documentation are accurate
- no secrets or real customer data are committed
