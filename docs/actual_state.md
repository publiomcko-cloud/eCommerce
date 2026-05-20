# Actual State — DataPulse Commerce

## 1. Purpose

This document describes the implementation baseline for transforming the completed DataPulse BI project into a complete e-commerce platform.

It is intended to help:

- future developers
- AI development agents
- reviewers
- portfolio evaluators
- maintainers who need to understand what already exists and what must be built next

This document is descriptive and directional. It separates the current implemented foundation from the new commerce layer that will be implemented on top of it.

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

The new product will become:

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
- the frontend runs locally against `NEXT_PUBLIC_API_URL=http://localhost:8000`
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
- demo catalog seed script with admin demo user bootstrap
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
- coupons and promotions
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
- coupon preview
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

Required statuses:

- `draft`
- `pending_payment`
- `paid`
- `payment_failed`
- `processing`
- `shipped`
- `delivered`
- `cancelled`
- `refunded`

Every status change must be recorded in an order status history table.

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

## 9. Known Gaps After Stage 1

The current foundation still does not yet include:

- product administration
- real catalog model
- cart persistence
- checkout state machine
- inventory reservation
- payment provider integration
- webhook handling
- shipping method logic
- customer order history
- admin back office
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
