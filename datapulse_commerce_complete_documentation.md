# DataPulse Commerce — Complete Documentation


---

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

## 9. Known Gaps Before Commerce Implementation

The current foundation does not yet include:

- authentication
- customer accounts
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


---

# MVP Scope — DataPulse Commerce

## 1. Purpose

This document defines what belongs to the first complete e-commerce MVP of DataPulse Commerce and what must be postponed.

The goal is to transform the completed DataPulse BI project into a complete commerce product without uncontrolled scope growth.

## 2. MVP Objective

The MVP must prove that the system can:

1. display a public product catalog
2. show product detail pages
3. manage a cart
4. run checkout safely
5. create orders transactionally
6. simulate payment through a mock provider
7. reserve and update inventory
8. provide customer account and order history
9. provide admin product, inventory, and order management
10. project commerce data into the existing BI dashboard
11. run locally with documented instructions
12. demonstrate portfolio-level engineering quality

## 3. Included Features

## 3.1 Storefront

Included:

- home page
- category navigation
- product listing
- product search/filter basics
- product detail page
- product images
- price display
- stock availability display
- add to cart

Not included:

- advanced personalization
- AI recommendation engine
- native mobile app
- complex CMS

## 3.2 Authentication and customer accounts

Included:

- customer registration
- customer login
- customer logout
- current user endpoint
- customer profile
- customer addresses
- customer order history
- customer order detail

Not included:

- social login
- SSO
- two-factor authentication
- loyalty program

## 3.3 Catalog management

Included:

- categories
- products
- product slugs
- product variants
- SKUs
- product images as URLs or static references
- active/draft status
- admin product create/update

Not included:

- complex product bundles
- marketplace seller catalogs
- advanced SEO CMS
- product import from ERP

## 3.4 Inventory

Included:

- stock on hand
- reserved stock
- available stock calculation
- inventory movements
- admin adjustments
- stock validation during checkout
- reservation release on failure or expiration where implemented

Not included:

- multi-warehouse routing
- purchase orders
- supplier management
- barcode scanning

## 3.5 Cart

Included:

- anonymous cart
- logged-in customer cart
- add item
- update quantity
- remove item
- cart totals
- stock validation before checkout

Not included:

- saved carts
- gift wrapping
- subscription carts

## 3.6 Checkout

Included:

- checkout session
- shipping address
- billing address if needed
- shipping method placeholder or simple fixed shipping
- server-side total calculation
- idempotent order placement
- inventory reservation
- order confirmation

Not included:

- advanced tax engine
- real-time shipping carrier quotes
- split shipments
- one-click checkout

## 3.7 Payments

Included:

- payment table
- provider adapter interface
- mock payment provider
- payment success/failure simulation
- webhook endpoint structure
- payment status on orders

Not included:

- real card handling by the app
- production payment provider as first requirement
- PCI-sensitive storage
- installments as first requirement

## 3.8 Orders

Included:

- order header
- order items
- order number
- price snapshots
- address snapshots
- payment status
- fulfillment status
- order status history
- customer order history
- admin order view
- admin status update

Not included:

- return merchandise authorization workflow
- complex fraud review
- external ERP sync

## 3.9 Admin back office

Included:

- admin login
- admin dashboard
- product management
- inventory management
- order management
- status updates
- analytics navigation

Not included:

- role permission matrix beyond basic roles
- staff activity analytics beyond audit/status history
- custom dashboard builder

## 3.10 Analytics integration

Included:

- commerce events
- projection from commerce orders/events into analytics
- revenue metrics
- top products
- revenue by category
- revenue by region/channel if data exists
- conversion funnel basics
- cart abandonment basics
- payment health
- inventory risk

Not included:

- big-data warehouse
- streaming pipeline
- real-time event bus
- machine learning forecasting

## 3.11 Testing

Included:

- backend tests for critical commerce flows
- checkout idempotency tests
- inventory tests
- payment mock tests
- admin authorization tests
- metric tests
- frontend lint
- frontend production build
- smoke script

Not included:

- full browser E2E as mandatory MVP requirement
- load testing as mandatory MVP requirement
- chaos testing

## 3.12 Deployment

Included:

- documented deployment path
- environment variable strategy
- safe demo mode
- public frontend if possible
- backend healthcheck
- hosted database
- seed demo data

Not included:

- Kubernetes
- high availability
- multi-region deployment
- autoscaling rules

## 4. User Roles

## 4.1 Guest

Can:

- browse catalog
- view product detail
- add items to cart
- start checkout
- register or login

## 4.2 Customer

Can:

- login
- manage profile
- manage addresses
- checkout
- view own orders
- view own order detail

## 4.3 Admin

Can:

- manage products
- manage inventory
- manage orders
- update order status
- view operational dashboard

## 4.4 Analyst

Can:

- view analytics dashboard
- inspect metrics
- inspect ingestion/projection status

## 5. Scope Boundaries

The MVP must stay focused on the complete commerce loop.

The following rule should guide decisions:

> If a feature does not help demonstrate storefront, cart, checkout, order management, inventory, admin operation, or analytics value, it should wait.

## 6. Done Criteria

The MVP is done when:

- a developer can run the project locally
- products are seeded and visible
- a visitor can add products to cart
- checkout creates one order idempotently
- mock payment can mark an order paid
- inventory is reserved or reduced correctly
- customer can see order history
- admin can manage products, inventory, and orders
- analytics dashboard reflects commerce data
- backend tests pass
- frontend lint/build pass
- deployment path is documented
- demo uses synthetic data only


---

# Technical Specification — DataPulse Commerce

## 1. Overview

DataPulse Commerce is a full-stack e-commerce platform with built-in business intelligence.

It is built on top of the completed DataPulse BI foundation, reusing the existing FastAPI backend, Next.js frontend, PostgreSQL database, analytics pipeline, metric endpoints, and dashboard patterns.

The new product adds a complete commerce layer:

- catalog
- cart
- checkout
- payments
- orders
- inventory
- admin
- customer account
- analytics integration

## 2. Project Objective

The objective is to build a complete, reproducible, testable, and deployable e-commerce system that demonstrates:

- transactional business workflows
- relational commerce modeling
- API design
- frontend product experience
- checkout correctness
- inventory consistency
- payment abstraction
- admin workflows
- analytics from real commerce data
- strong portfolio engineering quality

## 3. Product Context

The product simulates a small or medium online store that wants both commerce operations and business intelligence in the same platform.

Instead of using spreadsheets after the fact, the store records commerce operations directly and projects them into the existing DataPulse BI dashboard.

## 4. Target Audience

### Primary portfolio audience

- recruiters
- technical interviewers
- freelance clients
- small business owners
- software engineering reviewers
- data engineering reviewers

### End users in product simulation

- store visitor
- customer
- store admin
- operations manager
- analyst

## 5. Core Use Cases

A visitor can:

- browse products
- view details
- add products to cart
- checkout safely in demo mode

A customer can:

- create an account
- login
- manage addresses
- view order history

An admin can:

- manage products
- manage inventory
- manage orders
- update order statuses

An analyst can:

- view sales metrics
- inspect product performance
- inspect checkout funnel
- inspect payment health
- inspect inventory risk

## 6. Functional Requirements

### FR-001 — Authentication

The system must support customer and admin authentication.

Required:

- register
- login
- logout or token invalidation strategy
- current user endpoint
- password hashing
- protected routes
- role checks

### FR-002 — Customer profiles

The system must support customer profiles and addresses.

Required:

- customer profile
- address list
- create address
- update address
- delete address
- default shipping address

### FR-003 — Product catalog

The system must support a public product catalog.

Required:

- categories
- products
- product slugs
- product variants
- SKUs
- prices
- product images
- product status
- product listing
- product detail
- search/filter basics

### FR-004 — Inventory

The system must track inventory.

Required:

- stock on hand
- reserved stock
- available stock calculation
- inventory movements
- admin stock adjustments
- stock validation during checkout

### FR-005 — Cart

The system must support persistent carts.

Required:

- anonymous cart
- customer cart
- add item
- update quantity
- remove item
- cart totals
- coupon placeholder or basic coupon support
- stock validation before checkout

### FR-006 — Checkout

The system must convert a valid cart into an order.

Required:

- checkout session
- shipping address
- billing address if needed
- shipping method placeholder
- total recalculation server-side
- idempotent order placement
- inventory reservation
- order confirmation

### FR-007 — Payment abstraction

The system must support a payment provider abstraction.

Required:

- payment table
- payment service
- provider adapter interface
- mock provider
- payment success/failure simulation
- webhook endpoint structure
- order payment status updates

### FR-008 — Orders

The system must support customer and admin order workflows.

Required:

- order number
- order items
- price snapshots
- address snapshots
- order status
- payment status
- fulfillment status
- order status history
- customer order history
- admin order list
- admin order detail
- admin status update

### FR-009 — Admin back office

The system must provide admin management screens.

Required:

- admin overview
- product list
- product create/update
- inventory list
- stock adjustment
- order list
- order detail
- order status update

### FR-010 — Commerce events

The system must record important commerce events.

Required events:

- product viewed
- cart item added
- checkout started
- order created
- payment succeeded
- payment failed
- order cancelled
- refund created if refunds are implemented

### FR-011 — Analytics integration

The system must project commerce data into analytics.

Required:

- revenue summary
- order count
- average order value
- top products
- revenue by category
- conversion funnel
- cart abandonment
- payment health
- inventory risk
- recent orders

### FR-012 — Existing BI preservation

The existing BI functionality must continue to work unless intentionally replaced by documented commerce metrics.

Required:

- `/health` remains available
- existing metric endpoints remain available or compatible
- existing dashboard remains reachable or evolves into `/dashboard`
- existing tests are updated rather than silently removed

## 7. Non-Functional Requirements

### NFR-001 — Reproducibility

A developer must be able to run the project locally by following the setup guide.

### NFR-002 — Maintainability

The code must preserve separation between:

- routes
- schemas
- models
- services
- adapters
- frontend components
- API client

### NFR-003 — Transactional correctness

Checkout, order creation, inventory reservation, and payment updates must avoid inconsistent states.

### NFR-004 — Security

The system must:

- hash passwords
- protect admin routes
- protect customer data
- avoid storing card data
- avoid logging secrets
- validate inputs

### NFR-005 — Performance

The MVP should handle at least:

- 1,000 products in local demo data
- 10,000 orders in local analytics validation
- common catalog filters with indexes
- dashboard queries with reasonable response time for portfolio demo

### NFR-006 — Observability

The system should log:

- checkout failures
- payment failures
- inventory reservation failures
- webhook processing
- analytics projection failures

### NFR-007 — Demo safety

The public portfolio demo must:

- use synthetic data
- use mock or sandbox payment
- clearly label demo checkout
- avoid destructive public admin actions where possible

## 8. API Requirements

## 8.1 Authentication

```http
POST /auth/register
POST /auth/login
POST /auth/logout
GET /auth/me
```

## 8.2 Catalog

```http
GET /catalog/categories
GET /catalog/products
GET /catalog/products/{slug}
GET /catalog/search
```

## 8.3 Cart

```http
GET /cart
POST /cart/items
PATCH /cart/items/{item_id}
DELETE /cart/items/{item_id}
POST /cart/apply-coupon
DELETE /cart/coupon
```

## 8.4 Checkout

```http
POST /checkout/session
GET /checkout/session/{id}
POST /checkout/place-order
```

## 8.5 Payments

```http
POST /payments/webhook
GET /payments/{payment_id}
```

## 8.6 Customer orders

```http
GET /orders
GET /orders/{order_number}
```

## 8.7 Admin

```http
GET /admin/overview
GET /admin/products
POST /admin/products
PATCH /admin/products/{id}
GET /admin/inventory
POST /admin/inventory/adjustments
GET /admin/orders
GET /admin/orders/{order_number}
PATCH /admin/orders/{order_number}/status
```

## 8.8 Metrics

```http
GET /metrics/summary
GET /metrics/revenue-over-time
GET /metrics/top-products
GET /metrics/revenue-by-category
GET /metrics/conversion-funnel
GET /metrics/cart-abandonment
GET /metrics/payment-health
GET /metrics/inventory-risk
```

## 9. Business Rules

## 9.1 Pricing

- frontend prices are display-only
- backend recalculates prices
- order item prices are snapshotted
- discounts cannot reduce total below zero

## 9.2 Inventory

- checkout must validate stock
- reservation must be transactional
- failed payment should release reservation where appropriate
- paid order should convert reserved stock to sale

## 9.3 Orders

- order number must be unique
- order placement must be idempotent
- status changes must be recorded
- customer can only see own orders
- admin can see all orders

## 9.4 Payments

- app must not store card details
- provider adapter owns provider-specific behavior
- webhook processing must be idempotent
- payment status must update order status consistently

## 10. Acceptance Criteria

The technical implementation is acceptable when:

- all critical commerce flows work locally
- checkout retry does not duplicate orders
- stock is not oversold in normal checkout tests
- payment mock can succeed and fail
- customer ownership rules are enforced
- admin role rules are enforced
- analytics dashboard reflects commerce orders
- tests pass
- frontend lint/build pass
- deployment instructions are current


---

# Architecture — DataPulse Commerce

## 1. Architectural Overview

DataPulse Commerce is a full-stack e-commerce platform built on top of the completed DataPulse BI foundation.

The architecture keeps the original strengths of DataPulse BI:

- clear separation between frontend, backend, database, and analytics pipeline
- PostgreSQL as the central source of truth
- FastAPI for typed backend APIs
- Next.js for frontend screens
- documented local execution
- reproducible tests
- deployment readiness

It adds a transactional commerce domain:

- identity and access control
- product catalog
- cart
- checkout
- payments
- inventory
- orders
- shipping representation
- admin back office
- operational commerce analytics

## 2. Architecture Goals

The architecture must support:

- complete e-commerce flow from catalog to order confirmation
- safe local demo without real payment credentials
- future real payment provider integration
- reliable transactional order creation
- inventory consistency
- customer account management
- admin order and product management
- analytics powered by commerce events and order records
- compatibility with the existing BI dashboard
- portfolio-grade clarity and maintainability

## 3. High-Level System Flow

```text
Visitor / Customer Browser
        |
        v
Next.js Storefront + Account + Admin UI
        |
        v
FastAPI Commerce API
        |
        +--------------------------+
        |                          |
        v                          v
PostgreSQL Transactional Tables    Payment / Shipping / Email Adapters
        |
        v
Commerce Events and Order Projection
        |
        v
Existing DataPulse BI Analytics Layer
        |
        v
Dashboard Metrics and Charts
```

## 4. Main Applications

## 4.1 Public storefront

The storefront is the customer-facing part of the product.

Responsibilities:

- render home page
- render category pages
- render product listing pages
- render product detail pages
- handle product search and filters
- manage cart UI
- collect checkout information
- show order confirmation
- provide login and registration entry points

## 4.2 Customer account area

Responsibilities:

- show profile summary
- manage addresses
- show order history
- show order detail
- show payment and shipment status
- allow safe account logout

## 4.3 Admin back office

Responsibilities:

- manage catalog
- manage categories
- manage product variants
- manage product images
- manage inventory
- view orders
- update order status
- inspect payment state
- inspect shipment state
- access analytics dashboard

## 4.4 BI dashboard

The existing dashboard becomes the analytics module.

Responsibilities:

- show revenue metrics
- show order metrics
- show product performance
- show channel and region analysis
- show data quality status
- show ingestion or event processing status
- show operational commerce metrics

## 5. Main Backend Domains

Recommended backend domain modules:

```text
backend/app/
├── api/
│   ├── routes_auth.py
│   ├── routes_catalog.py
│   ├── routes_cart.py
│   ├── routes_checkout.py
│   ├── routes_orders.py
│   ├── routes_payments.py
│   ├── routes_admin.py
│   ├── routes_inventory.py
│   ├── routes_metrics.py
│   ├── routes_ingestion.py
│   └── routes_health.py
├── core/
│   ├── config.py
│   ├── security.py
│   ├── logging.py
│   └── errors.py
├── db/
│   └── session.py
├── models/
│   ├── user.py
│   ├── customer.py
│   ├── address.py
│   ├── product.py
│   ├── category.py
│   ├── inventory.py
│   ├── cart.py
│   ├── order.py
│   ├── payment.py
│   ├── shipment.py
│   ├── promotion.py
│   ├── commerce_event.py
│   └── analytics_existing_models.py
├── schemas/
│   ├── auth.py
│   ├── catalog.py
│   ├── cart.py
│   ├── checkout.py
│   ├── orders.py
│   ├── payments.py
│   ├── admin.py
│   ├── inventory.py
│   └── metrics.py
├── services/
│   ├── auth_service.py
│   ├── catalog_service.py
│   ├── cart_service.py
│   ├── checkout_service.py
│   ├── order_service.py
│   ├── payment_service.py
│   ├── inventory_service.py
│   ├── shipment_service.py
│   ├── promotion_service.py
│   ├── commerce_event_service.py
│   ├── commerce_analytics_service.py
│   ├── metrics_service.py
│   └── transformation_service.py
└── adapters/
    ├── payments/
    │   ├── base.py
    │   ├── mock_provider.py
    │   └── provider_placeholder.py
    ├── shipping/
    │   ├── base.py
    │   └── mock_provider.py
    └── email/
        ├── base.py
        └── console_provider.py
```

## 6. Frontend Structure

Recommended frontend structure:

```text
frontend/src/
├── app/
│   ├── page.tsx
│   ├── products/
│   │   ├── page.tsx
│   │   └── [slug]/page.tsx
│   ├── cart/page.tsx
│   ├── checkout/page.tsx
│   ├── order-confirmation/[orderNumber]/page.tsx
│   ├── account/
│   │   ├── page.tsx
│   │   ├── orders/page.tsx
│   │   └── orders/[orderNumber]/page.tsx
│   ├── admin/
│   │   ├── page.tsx
│   │   ├── products/page.tsx
│   │   ├── products/[id]/page.tsx
│   │   ├── inventory/page.tsx
│   │   └── orders/[orderNumber]/page.tsx
│   └── dashboard/page.tsx
├── components/
│   ├── layout/
│   ├── storefront/
│   ├── cart/
│   ├── checkout/
│   ├── account/
│   ├── admin/
│   └── dashboard/
├── lib/
│   ├── api-client.ts
│   ├── auth.ts
│   ├── formatters.ts
│   └── query-keys.ts
└── types/
```

## 7. Database Architecture

PostgreSQL remains the central database.

The system should use one of two approaches:

### Option A — Table prefixes in the default schema

This is closest to the existing DataPulse BI implementation.

Examples:

- `commerce_products`
- `commerce_orders`
- `commerce_payments`
- `commerce_inventory_items`
- `raw_orders`
- `fact_orders`

### Option B — PostgreSQL schemas

This is cleaner for a larger product.

Examples:

```text
commerce.products
commerce.orders
commerce.payments
commerce.inventory_items
analytics.fact_orders
ops.ingestion_runs
```

Recommended path:

- keep table prefixes if the repository already uses them
- avoid a large schema migration before the commerce layer works
- introduce schemas later only if the project needs stronger separation

## 8. Transactional vs Analytical Separation

Commerce tables are the operational source of truth.

Analytics tables are reporting projections.

Do not allow the dashboard to become the source of truth for orders, stock, payments, or customers.

```text
commerce_orders + commerce_order_items
        |
        v
commerce_events / projection job
        |
        v
stg_orders + dimensions + fact_orders
        |
        v
metrics endpoints
```

## 9. Checkout Architecture

Checkout must be treated as a controlled workflow.

Recommended flow:

1. customer opens checkout from cart
2. backend validates cart items
3. backend validates stock availability
4. backend calculates totals
5. backend applies coupon rules
6. backend creates checkout session
7. backend reserves inventory
8. backend creates order with `pending_payment`
9. backend creates payment intent through adapter
10. payment provider confirms or fails payment
11. backend updates payment and order status
12. backend records status history
13. backend emits commerce event
14. analytics projection updates BI tables

## 10. Idempotency

Critical write operations must support idempotency keys.

Required idempotent operations:

- create checkout session
- place order
- create payment intent
- handle payment webhook
- apply refund webhook

Business rule:

> Retrying the same checkout request must not create duplicate paid orders.

## 11. Inventory Architecture

Inventory must distinguish:

- stock on hand
- stock reserved
- stock available
- stock sold
- stock returned
- stock adjusted

Recommended formula:

```text
available_stock = stock_on_hand - reserved_stock
```

Inventory reservation should happen before payment finalization. If payment fails or checkout expires, reservation should be released.

## 12. Payment Architecture

Payment logic must use adapters.

```text
CheckoutService
    |
    v
PaymentService
    |
    v
PaymentProviderAdapter
    |
    +--> MockProvider for local demo
    +--> SandboxProvider later
    +--> ProductionProvider later
```

The database should store provider references, but business logic must not depend on provider-specific fields outside the adapter boundary.

## 13. Event and Analytics Architecture

Add a commerce event log table to connect operations with analytics.

Important events:

- `product_viewed`
- `cart_created`
- `cart_item_added`
- `checkout_started`
- `order_created`
- `payment_succeeded`
- `payment_failed`
- `order_cancelled`
- `refund_created`
- `shipment_created`
- `order_delivered`

Events can support:

- conversion funnel
- cart abandonment
- payment success rate
- customer behavior analytics
- operational BI

## 14. API Design

### Health

```http
GET /health
```

### Authentication

```http
POST /auth/register
POST /auth/login
POST /auth/logout
GET /auth/me
POST /auth/refresh
```

### Catalog

```http
GET /catalog/categories
GET /catalog/products
GET /catalog/products/{slug}
GET /catalog/search
```

### Cart

```http
GET /cart
POST /cart/items
PATCH /cart/items/{item_id}
DELETE /cart/items/{item_id}
POST /cart/apply-coupon
DELETE /cart/coupon
```

### Checkout

```http
POST /checkout/session
GET /checkout/session/{id}
POST /checkout/place-order
```

### Payments

```http
POST /payments/webhook
GET /payments/{payment_id}
```

### Orders

```http
GET /orders
GET /orders/{order_number}
```

### Admin

```http
GET /admin/overview
GET /admin/products
POST /admin/products
PATCH /admin/products/{id}
GET /admin/inventory
POST /admin/inventory/adjustments
GET /admin/orders
GET /admin/orders/{order_number}
PATCH /admin/orders/{order_number}/status
```

### Metrics

Keep existing metrics and add commerce metrics:

```http
GET /metrics/summary
GET /metrics/revenue-over-time
GET /metrics/top-products
GET /metrics/revenue-by-region
GET /metrics/revenue-by-channel
GET /metrics/conversion-funnel
GET /metrics/cart-abandonment
GET /metrics/payment-health
GET /metrics/inventory-risk
```

## 15. Authentication and Authorization

Recommended initial approach:

- email and password authentication
- hashed passwords
- short-lived access token
- refresh token or secure session strategy
- role stored in user record
- admin routes protected by role check
- customer routes protected by ownership checks

Security rules:

- never return password hashes
- never log secrets or tokens
- never allow a customer to read another customer's order
- admin writes must be explicit and audited

## 16. Background Jobs

Initial local implementation may run jobs synchronously or through scripts.

Future background tasks:

- release expired inventory reservations
- send order confirmation email
- send shipment email
- update analytics projections
- recompute dashboard aggregates
- process failed webhooks

Redis and a worker can be added later if necessary.

## 17. Deployment Architecture

Recommended portfolio deployment:

```text
Vercel or containerized frontend
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

## 18. Architectural Acceptance Criteria

The architecture is acceptable when:

- BI baseline still works
- storefront works
- checkout works with mock payment
- orders are persisted transactionally
- inventory rules are enforced
- admin can manage core commerce data
- metrics reflect commerce data
- tests cover critical flows
- local execution remains clear
- deployment path is documented


---

# Database Modeling — DataPulse Commerce

## 1. Purpose

This document defines the relational model for building a complete e-commerce platform on top of the existing DataPulse BI foundation.

The database must support:

- transactional commerce operations
- customer accounts
- catalog browsing
- product variants
- inventory control
- carts
- checkout sessions
- orders
- payments
- refunds
- shipments
- promotions
- admin operations
- auditability
- analytics projections
- compatibility with the existing BI tables

PostgreSQL remains the recommended database.

## 2. Modeling Principles

The model should follow these principles:

- keep transactional commerce data separate from analytical projections
- preserve the existing BI tables until replacement is intentional
- use explicit primary keys
- use timestamps consistently
- use status history for important lifecycle changes
- avoid storing secrets
- avoid storing complete payment card data
- index lookup, filter, and join columns
- enforce business constraints at the database layer where practical
- make checkout operations idempotent
- track inventory movements instead of silently changing stock

## 3. Suggested Naming Strategy

Because the existing project uses table prefixes, the first commerce implementation should also use prefixes.

Recommended prefixes:

```text
commerce_  transactional e-commerce tables
analytics_ optional future analytical tables
raw_       existing raw ingestion tables
stg_       existing staging tables
dim_       existing dimension tables
fact_      existing fact tables
ops_       optional operational/audit tables
```

Existing tables may remain as:

- `ingestion_runs`
- `raw_orders`
- `stg_orders`
- `dim_products`
- `dim_customers`
- `dim_regions`
- `dim_channels`
- `fact_orders`
- `data_quality_issues`

## 4. Commerce Entity Map

```text
users
  |
  +-- customers
        |
        +-- customer_addresses
        +-- carts
        +-- orders

categories
  |
  +-- products
        |
        +-- product_variants
              |
              +-- inventory_items
              +-- cart_items
              +-- order_items

orders
  |
  +-- order_items
  +-- payments
  +-- refunds
  +-- shipments
  +-- order_status_history

commerce_events
  |
  +-- analytics projection into BI layer
```

## 5. Core Tables

## 5.1 commerce_users

Stores authentication identities for customers and staff.

| Field | Type | Notes |
|---|---:|---|
| id | UUID | Primary key |
| email | VARCHAR(255) | Unique, normalized lowercase |
| password_hash | TEXT | Required for password auth |
| role | VARCHAR(30) | customer, admin, analyst |
| is_active | BOOLEAN | Default true |
| email_verified_at | TIMESTAMP | Nullable |
| last_login_at | TIMESTAMP | Nullable |
| created_at | TIMESTAMP | Default now |
| updated_at | TIMESTAMP | Default now |

Business rules:

- email must be unique
- password hash must never be returned by API
- inactive users cannot login
- admin routes require admin role

## 5.2 commerce_customers

Stores customer profile data.

| Field | Type | Notes |
|---|---:|---|
| id | UUID | Primary key |
| user_id | UUID | FK to commerce_users |
| first_name | VARCHAR(120) | Nullable for quick checkout |
| last_name | VARCHAR(120) | Nullable |
| phone | VARCHAR(40) | Nullable |
| marketing_opt_in | BOOLEAN | Default false |
| created_at | TIMESTAMP | Default now |
| updated_at | TIMESTAMP | Default now |

Business rules:

- one user can have one customer profile
- avoid storing unnecessary sensitive data
- public demo seed data must be synthetic

## 5.3 commerce_customer_addresses

Stores shipping and billing addresses.

| Field | Type | Notes |
|---|---:|---|
| id | UUID | Primary key |
| customer_id | UUID | FK to commerce_customers |
| type | VARCHAR(30) | shipping, billing, both |
| recipient_name | VARCHAR(255) | Required |
| phone | VARCHAR(40) | Nullable |
| line1 | VARCHAR(255) | Required |
| line2 | VARCHAR(255) | Nullable |
| city | VARCHAR(120) | Required |
| region | VARCHAR(120) | State/province |
| postal_code | VARCHAR(40) | Required |
| country | VARCHAR(120) | Required |
| is_default | BOOLEAN | Default false |
| created_at | TIMESTAMP | Default now |
| updated_at | TIMESTAMP | Default now |

Business rules:

- a customer may have multiple addresses
- one default shipping address should be supported
- order records should snapshot address values to preserve history

## 5.4 commerce_categories

Stores product taxonomy.

| Field | Type | Notes |
|---|---:|---|
| id | UUID | Primary key |
| parent_id | UUID | Self FK, nullable |
| name | VARCHAR(160) | Required |
| slug | VARCHAR(180) | Unique |
| description | TEXT | Nullable |
| is_active | BOOLEAN | Default true |
| sort_order | INTEGER | Default 0 |
| created_at | TIMESTAMP | Default now |
| updated_at | TIMESTAMP | Default now |

Business rules:

- slug must be unique
- inactive categories should not appear in storefront navigation
- products may belong to one primary category first; many-to-many can be added later

## 5.5 commerce_products

Stores product master data.

| Field | Type | Notes |
|---|---:|---|
| id | UUID | Primary key |
| category_id | UUID | FK to commerce_categories |
| name | VARCHAR(255) | Required |
| slug | VARCHAR(280) | Unique |
| description | TEXT | Nullable |
| short_description | TEXT | Nullable |
| status | VARCHAR(30) | draft, active, archived |
| brand | VARCHAR(120) | Nullable |
| base_price | NUMERIC(12,2) | Required, non-negative |
| compare_at_price | NUMERIC(12,2) | Nullable |
| currency | VARCHAR(3) | Default BRL or configured currency |
| seo_title | VARCHAR(255) | Nullable |
| seo_description | TEXT | Nullable |
| created_at | TIMESTAMP | Default now |
| updated_at | TIMESTAMP | Default now |

Business rules:

- only `active` products appear publicly
- product price must be non-negative
- product slug must be stable for SEO
- base price can be overridden by variant price

## 5.6 commerce_product_images

Stores product image metadata.

| Field | Type | Notes |
|---|---:|---|
| id | UUID | Primary key |
| product_id | UUID | FK to commerce_products |
| url | TEXT | Required |
| alt_text | VARCHAR(255) | Nullable |
| sort_order | INTEGER | Default 0 |
| is_primary | BOOLEAN | Default false |
| created_at | TIMESTAMP | Default now |

Business rules:

- product images may use local static files in MVP
- future production may use object storage
- do not store image binary data in PostgreSQL for normal product images

## 5.7 commerce_product_variants

Stores purchasable product variants.

| Field | Type | Notes |
|---|---:|---|
| id | UUID | Primary key |
| product_id | UUID | FK to commerce_products |
| sku | VARCHAR(100) | Unique |
| name | VARCHAR(255) | Required |
| attributes | JSONB | Example: size, color |
| price | NUMERIC(12,2) | Nullable override |
| weight_grams | INTEGER | Nullable |
| status | VARCHAR(30) | active, inactive, archived |
| created_at | TIMESTAMP | Default now |
| updated_at | TIMESTAMP | Default now |

Business rules:

- SKU must be unique
- only active variants can be added to cart
- effective price is variant price if present, otherwise product base price

## 5.8 commerce_inventory_items

Stores inventory state by variant.

| Field | Type | Notes |
|---|---:|---|
| id | UUID | Primary key |
| variant_id | UUID | FK to commerce_product_variants, unique |
| stock_on_hand | INTEGER | Default 0 |
| stock_reserved | INTEGER | Default 0 |
| low_stock_threshold | INTEGER | Default 5 |
| allow_backorder | BOOLEAN | Default false |
| updated_at | TIMESTAMP | Default now |

Business rules:

- stock values cannot be negative
- available stock is `stock_on_hand - stock_reserved`
- reserved stock cannot exceed stock on hand unless backorder is allowed

## 5.9 commerce_inventory_movements

Stores inventory changes.

| Field | Type | Notes |
|---|---:|---|
| id | UUID | Primary key |
| variant_id | UUID | FK to commerce_product_variants |
| movement_type | VARCHAR(40) | adjustment, reservation, release, sale, return |
| quantity_delta | INTEGER | Positive or negative |
| reason | TEXT | Nullable |
| reference_type | VARCHAR(40) | order, checkout, admin, refund |
| reference_id | UUID | Nullable |
| created_by_user_id | UUID | Nullable FK |
| created_at | TIMESTAMP | Default now |

Business rules:

- all admin stock changes must create a movement
- checkout reservation must create a movement
- sale finalization must create a movement

## 5.10 commerce_carts

Stores active shopping carts.

| Field | Type | Notes |
|---|---:|---|
| id | UUID | Primary key |
| customer_id | UUID | Nullable FK |
| anonymous_token_hash | TEXT | Nullable |
| status | VARCHAR(30) | active, converted, abandoned, expired |
| currency | VARCHAR(3) | Required |
| coupon_code | VARCHAR(80) | Nullable |
| created_at | TIMESTAMP | Default now |
| updated_at | TIMESTAMP | Default now |
| expires_at | TIMESTAMP | Nullable |

Business rules:

- anonymous carts should be recoverable by safe token strategy
- cart becomes converted after order placement
- expired carts should not be used for checkout

## 5.11 commerce_cart_items

Stores cart lines.

| Field | Type | Notes |
|---|---:|---|
| id | UUID | Primary key |
| cart_id | UUID | FK to commerce_carts |
| variant_id | UUID | FK to commerce_product_variants |
| quantity | INTEGER | Positive |
| unit_price_snapshot | NUMERIC(12,2) | Price when added or recalculated |
| created_at | TIMESTAMP | Default now |
| updated_at | TIMESTAMP | Default now |

Business rules:

- quantity must be greater than zero
- duplicate variant lines in same cart should be merged
- cart totals must be recalculated server-side

## 5.12 commerce_coupons

Stores coupon definitions.

| Field | Type | Notes |
|---|---:|---|
| id | UUID | Primary key |
| code | VARCHAR(80) | Unique uppercase |
| description | TEXT | Nullable |
| discount_type | VARCHAR(30) | fixed_amount, percentage |
| discount_value | NUMERIC(12,2) | Required |
| starts_at | TIMESTAMP | Nullable |
| ends_at | TIMESTAMP | Nullable |
| max_redemptions | INTEGER | Nullable |
| redemptions_count | INTEGER | Default 0 |
| is_active | BOOLEAN | Default true |
| created_at | TIMESTAMP | Default now |
| updated_at | TIMESTAMP | Default now |

Business rules:

- expired or inactive coupons cannot be applied
- discount cannot reduce order total below zero
- percentage discounts must be within safe limits

## 5.13 commerce_checkout_sessions

Stores checkout workflow state.

| Field | Type | Notes |
|---|---:|---|
| id | UUID | Primary key |
| cart_id | UUID | FK to commerce_carts |
| customer_id | UUID | Nullable FK |
| status | VARCHAR(40) | open, order_created, expired, cancelled |
| idempotency_key | VARCHAR(160) | Unique nullable |
| shipping_address_snapshot | JSONB | Required before order placement |
| billing_address_snapshot | JSONB | Nullable |
| selected_shipping_method | JSONB | Nullable |
| totals_snapshot | JSONB | Required before order placement |
| expires_at | TIMESTAMP | Required |
| created_at | TIMESTAMP | Default now |
| updated_at | TIMESTAMP | Default now |

Business rules:

- expired sessions cannot place orders
- placing order must be idempotent
- totals must be recomputed by backend before order creation

## 5.14 commerce_orders

Stores finalized order headers.

| Field | Type | Notes |
|---|---:|---|
| id | UUID | Primary key |
| order_number | VARCHAR(40) | Unique customer-facing number |
| customer_id | UUID | Nullable FK |
| cart_id | UUID | Nullable FK |
| status | VARCHAR(40) | pending_payment, paid, processing, shipped, delivered, cancelled, refunded |
| payment_status | VARCHAR(40) | unpaid, authorized, paid, failed, refunded, partially_refunded |
| fulfillment_status | VARCHAR(40) | unfulfilled, processing, shipped, delivered, returned |
| currency | VARCHAR(3) | Required |
| subtotal_amount | NUMERIC(12,2) | Required |
| discount_amount | NUMERIC(12,2) | Default 0 |
| shipping_amount | NUMERIC(12,2) | Default 0 |
| tax_amount | NUMERIC(12,2) | Default 0 |
| total_amount | NUMERIC(12,2) | Required |
| email | VARCHAR(255) | Snapshot |
| shipping_address_snapshot | JSONB | Required |
| billing_address_snapshot | JSONB | Nullable |
| placed_at | TIMESTAMP | Default now |
| created_at | TIMESTAMP | Default now |
| updated_at | TIMESTAMP | Default now |

Business rules:

- total amount must equal subtotal minus discounts plus shipping plus tax
- order number must be unique and stable
- order address data must be snapshotted
- status changes must be tracked separately

## 5.15 commerce_order_items

Stores order line items.

| Field | Type | Notes |
|---|---:|---|
| id | UUID | Primary key |
| order_id | UUID | FK to commerce_orders |
| product_id | UUID | FK to commerce_products |
| variant_id | UUID | FK to commerce_product_variants |
| sku_snapshot | VARCHAR(100) | Required |
| product_name_snapshot | VARCHAR(255) | Required |
| variant_name_snapshot | VARCHAR(255) | Required |
| category_name_snapshot | VARCHAR(160) | Nullable |
| quantity | INTEGER | Positive |
| unit_price | NUMERIC(12,2) | Required |
| line_total | NUMERIC(12,2) | Required |
| created_at | TIMESTAMP | Default now |

Business rules:

- snapshots preserve order history even if product changes later
- quantity must be positive
- line total must equal quantity times unit price after discounts if line-level discounts are implemented

## 5.16 commerce_payments

Stores payment records and provider references.

| Field | Type | Notes |
|---|---:|---|
| id | UUID | Primary key |
| order_id | UUID | FK to commerce_orders |
| provider | VARCHAR(60) | mock, sandbox, production provider name |
| provider_payment_id | VARCHAR(255) | Nullable |
| status | VARCHAR(40) | pending, authorized, paid, failed, cancelled, refunded |
| amount | NUMERIC(12,2) | Required |
| currency | VARCHAR(3) | Required |
| idempotency_key | VARCHAR(160) | Nullable unique |
| failure_code | VARCHAR(120) | Nullable |
| failure_message | TEXT | Nullable |
| raw_provider_response | JSONB | Nullable and sanitized |
| created_at | TIMESTAMP | Default now |
| updated_at | TIMESTAMP | Default now |

Business rules:

- never store card numbers or CVV
- webhooks must update this table idempotently
- provider fields must be sanitized before storage

## 5.17 commerce_refunds

Stores refund records.

| Field | Type | Notes |
|---|---:|---|
| id | UUID | Primary key |
| order_id | UUID | FK to commerce_orders |
| payment_id | UUID | FK to commerce_payments |
| amount | NUMERIC(12,2) | Required |
| reason | TEXT | Nullable |
| status | VARCHAR(40) | pending, succeeded, failed |
| provider_refund_id | VARCHAR(255) | Nullable |
| created_at | TIMESTAMP | Default now |
| updated_at | TIMESTAMP | Default now |

Business rules:

- refund amount cannot exceed paid amount minus previous refunds
- refund should update order payment status

## 5.18 commerce_shipments

Stores shipment representation.

| Field | Type | Notes |
|---|---:|---|
| id | UUID | Primary key |
| order_id | UUID | FK to commerce_orders |
| carrier | VARCHAR(120) | Nullable |
| service_name | VARCHAR(120) | Nullable |
| tracking_code | VARCHAR(120) | Nullable |
| status | VARCHAR(40) | pending, shipped, in_transit, delivered, failed, returned |
| shipped_at | TIMESTAMP | Nullable |
| delivered_at | TIMESTAMP | Nullable |
| created_at | TIMESTAMP | Default now |
| updated_at | TIMESTAMP | Default now |

Business rules:

- shipment status should update fulfillment status when appropriate
- tracking code is optional in MVP

## 5.19 commerce_order_status_history

Stores lifecycle history.

| Field | Type | Notes |
|---|---:|---|
| id | UUID | Primary key |
| order_id | UUID | FK to commerce_orders |
| from_status | VARCHAR(40) | Nullable |
| to_status | VARCHAR(40) | Required |
| reason | TEXT | Nullable |
| changed_by_user_id | UUID | Nullable FK |
| created_at | TIMESTAMP | Default now |

Business rules:

- every important status change must insert a history row
- admin changes must record the admin user

## 5.20 commerce_events

Stores business events for analytics and audit.

| Field | Type | Notes |
|---|---:|---|
| id | UUID | Primary key |
| event_type | VARCHAR(80) | Required |
| actor_user_id | UUID | Nullable FK |
| customer_id | UUID | Nullable FK |
| session_id | VARCHAR(160) | Nullable |
| entity_type | VARCHAR(80) | Example: order, cart, product |
| entity_id | UUID | Nullable |
| payload | JSONB | Sanitized event payload |
| created_at | TIMESTAMP | Default now |

Business rules:

- do not store raw secrets
- use events to project commerce data into analytics
- events should not replace transactional tables

## 6. Analytics Projection Tables

The existing `fact_orders` and dimension tables can be retained first.

For a stronger commerce analytics layer, add:

- `fact_order_items`
- `fact_payments`
- `fact_inventory_movements`
- `fact_checkout_funnel`
- `dim_products` mapped from commerce catalog
- `dim_customers` anonymized or privacy-safe
- `dim_channels`
- `dim_regions`

## 7. Index Recommendations

Recommended indexes:

- `commerce_users.email`
- `commerce_categories.slug`
- `commerce_products.slug`
- `commerce_products.status`
- `commerce_product_variants.sku`
- `commerce_inventory_items.variant_id`
- `commerce_carts.customer_id`
- `commerce_carts.status`
- `commerce_cart_items.cart_id`
- `commerce_orders.order_number`
- `commerce_orders.customer_id`
- `commerce_orders.status`
- `commerce_orders.placed_at`
- `commerce_order_items.order_id`
- `commerce_payments.order_id`
- `commerce_payments.provider_payment_id`
- `commerce_events.event_type`
- `commerce_events.created_at`

## 8. Data Privacy Rules

The platform must not store:

- complete card numbers
- CVV codes
- raw payment secrets
- private production customer data in demo seed files
- password values in plain text

The platform may store:

- synthetic customer data for portfolio demo
- sanitized provider IDs
- order totals
- address snapshots necessary for order representation

## 9. Migration Strategy

Recommended migration order:

1. preserve existing BI migration as baseline
2. create auth/customer tables
3. create catalog/category/product/variant/image tables
4. create inventory tables
5. create cart tables
6. create coupon tables
7. create checkout and order tables
8. create payment/refund/shipment tables
9. create status history and event tables
10. create analytics projection tables or extend existing dimensions/facts

## 10. Database Acceptance Criteria

The database model is acceptable when:

- existing BI tables remain usable
- commerce products can be listed publicly
- carts can persist lines
- checkout can create a single order idempotently
- inventory is reserved and released safely
- payment records can be updated by adapter/webhook
- order history is preserved through snapshots
- admin changes are auditable
- analytics can be generated from commerce records


---

# DataPulse Commerce Development Plan

## 1. Project Summary

DataPulse Commerce is the next stage of the completed DataPulse BI project.

The objective is to build a complete e-commerce platform on top of the existing analytics foundation.

The completed BI foundation already demonstrates:

- data ingestion
- validation
- transformation
- PostgreSQL modeling
- FastAPI API
- Next.js dashboard
- revenue and order metrics
- local reproducibility
- tests
- deployment preparation

The new commerce project must add:

- storefront
- product catalog
- customer accounts
- cart
- checkout
- payment abstraction
- order lifecycle
- inventory control
- admin back office
- commerce analytics integration

## 2. Development Strategy

The project should be implemented incrementally without breaking the existing BI dashboard.

Guiding rule:

> Build the transactional commerce system first, then project its events and orders into the analytics layer.

The existing dashboard should remain functional during implementation. New commerce metrics may gradually replace synthetic or manual order metrics.

## 3. Stages

### Stage 0 — Preserve and Freeze BI Baseline

Objective: ensure the existing DataPulse BI foundation remains stable before commerce work starts.

Deliverables:

- baseline tests passing
- current dashboard still loading
- current migrations working
- current Docker validation documented
- new branch or checkpoint created

Tasks:

- [ ] Run backend tests
- [ ] Run frontend lint and build
- [ ] Run smoke checks
- [ ] Confirm existing dashboard works
- [ ] Confirm manual order page still works
- [ ] Create Git checkpoint before commerce changes
- [ ] Document baseline version in `actual_state.md`

Agent command:

```text
Validate the existing DataPulse BI baseline before adding commerce features. Do not refactor unrelated code. Confirm tests, dashboard, API, migrations, and smoke checks still work.
```

### Stage 1 — Commerce Foundation and Identity

Objective: add the security and user foundation required for e-commerce.

Deliverables:

- user model
- customer profile model
- admin role
- authentication endpoints
- password hashing
- protected route utilities
- frontend login/register screens
- auth-aware navigation

Tasks:

- [ ] Add `commerce_users`
- [ ] Add `commerce_customers`
- [ ] Add `commerce_customer_addresses`
- [ ] Add password hashing utility
- [ ] Add token/session strategy
- [ ] Implement `/auth/register`
- [ ] Implement `/auth/login`
- [ ] Implement `/auth/me`
- [ ] Implement logout behavior
- [ ] Add role-based guard for admin endpoints
- [ ] Add frontend auth state handling
- [ ] Add login page
- [ ] Add registration page
- [ ] Add account shell page
- [ ] Add tests for auth flow

Agent command:

```text
Implement the commerce identity foundation using the existing FastAPI, SQLAlchemy, Alembic, Next.js, and TanStack Query structure. Add user, customer, address, authentication, and role-based authorization without breaking existing DataPulse BI endpoints.
```

### Stage 2 — Catalog and Inventory Foundation

Objective: create a real product catalog with variants and stock tracking.

Deliverables:

- category model
- product model
- product image model
- product variant model
- inventory item model
- inventory movement model
- public catalog API
- admin catalog API
- seed commerce catalog

Tasks:

- [ ] Add category tables
- [ ] Add product tables
- [ ] Add product variant tables
- [ ] Add product image tables
- [ ] Add inventory tables
- [ ] Add inventory movement table
- [ ] Implement product listing endpoint
- [ ] Implement product detail endpoint by slug
- [ ] Implement category endpoint
- [ ] Implement admin product create/update endpoints
- [ ] Implement admin inventory adjustment endpoint
- [ ] Add demo product seed script
- [ ] Add product card UI
- [ ] Add product listing page
- [ ] Add product detail page
- [ ] Add admin product list page
- [ ] Add admin product editor page
- [ ] Add tests for catalog and inventory rules

Agent command:

```text
Implement catalog and inventory foundations for DataPulse Commerce. Products must support categories, slugs, variants, images, active/draft status, prices, SKUs, stock on hand, reserved stock, and inventory movement history.
```

### Stage 3 — Cart

Objective: allow guests and customers to build carts safely.

Deliverables:

- cart model
- cart item model
- anonymous cart support
- customer cart support
- cart API
- cart UI
- server-side total calculation
- stock validation before checkout

Tasks:

- [ ] Add `commerce_carts`
- [ ] Add `commerce_cart_items`
- [ ] Implement cart creation/retrieval
- [ ] Implement add item
- [ ] Implement update quantity
- [ ] Implement remove item
- [ ] Implement cart totals service
- [ ] Validate variant status and stock availability
- [ ] Merge duplicate cart items
- [ ] Support customer cart association after login
- [ ] Add cart page
- [ ] Add mini cart or cart summary
- [ ] Add tests for cart operations

Agent command:

```text
Implement cart persistence and cart UI. Cart totals must be calculated server-side, duplicate variant lines should merge, inactive variants cannot be added, and stock availability must be checked before checkout.
```

### Stage 4 — Checkout and Order Creation

Objective: convert a valid cart into a transactional order.

Deliverables:

- checkout session model
- order model
- order item model
- status history model
- checkout API
- order placement service
- inventory reservation
- idempotency handling
- checkout UI
- order confirmation page

Tasks:

- [ ] Add checkout session table
- [ ] Add order table
- [ ] Add order item table
- [ ] Add order status history table
- [ ] Add idempotency key support
- [ ] Implement checkout session creation
- [ ] Implement shipping and billing address snapshots
- [ ] Implement totals snapshot
- [ ] Implement order number generation
- [ ] Implement inventory reservation
- [ ] Implement order creation from cart
- [ ] Mark cart as converted
- [ ] Add checkout page
- [ ] Add order confirmation page
- [ ] Add tests for idempotent order placement
- [ ] Add tests for inventory reservation

Agent command:

```text
Implement checkout and order creation as a transactional workflow. Placing an order must be idempotent, must reserve inventory, must snapshot addresses and prices, must create order items, and must not duplicate orders on retry.
```

### Stage 5 — Payment Abstraction and Mock Provider

Objective: represent payment flow safely without requiring real payment credentials.

Deliverables:

- payment model
- payment service
- provider adapter interface
- mock payment provider
- webhook endpoint structure
- payment status updates
- checkout integration

Tasks:

- [ ] Add payment table
- [ ] Add payment adapter interface
- [ ] Add mock provider
- [ ] Implement payment intent/session creation
- [ ] Implement payment success simulation
- [ ] Implement payment failure simulation
- [ ] Implement webhook endpoint skeleton
- [ ] Update order status on payment success
- [ ] Release reservation on payment failure where appropriate
- [ ] Add payment state to order confirmation
- [ ] Add tests for payment success
- [ ] Add tests for payment failure
- [ ] Add tests for idempotent webhook handling

Agent command:

```text
Implement payment abstraction with a safe mock provider. Do not add real payment credentials. The payment service must update payment and order statuses through a clear adapter boundary and support idempotent webhook-style updates.
```

### Stage 6 — Customer Account and Order History

Objective: allow customers to manage their account and view past orders.

Deliverables:

- account overview page
- address management
- customer order list
- customer order detail
- ownership checks

Tasks:

- [ ] Implement customer profile endpoint
- [ ] Implement address CRUD endpoints
- [ ] Implement customer order list endpoint
- [ ] Implement customer order detail endpoint
- [ ] Protect customer data by ownership
- [ ] Add account overview UI
- [ ] Add address UI
- [ ] Add order history UI
- [ ] Add order detail UI
- [ ] Add tests for customer ownership restrictions

Agent command:

```text
Implement customer account screens and APIs. Customers must only see their own profile, addresses, and orders. Existing admin and dashboard functionality must continue to work.
```

### Stage 7 — Admin Back Office

Objective: provide operational management screens.

Deliverables:

- admin dashboard
- product management
- inventory management
- order management
- order status update
- payment/refund status visibility
- shipment status representation

Tasks:

- [ ] Add admin overview API
- [ ] Add admin order list API
- [ ] Add admin order detail API
- [ ] Add admin status update API
- [ ] Add inventory adjustment API
- [ ] Add shipment table and API if not already added
- [ ] Add refund table and API if implementing refunds
- [ ] Add admin dashboard page
- [ ] Add admin order list page
- [ ] Add admin order detail page
- [ ] Add admin inventory page
- [ ] Add tests for admin authorization
- [ ] Add tests for order status transitions

Agent command:

```text
Implement the admin back office for product, inventory, and order operations. Admin actions must be protected by role checks, important changes must be auditable, and order status transitions must follow allowed business rules.
```

### Stage 8 — Commerce Analytics Integration

Objective: connect live commerce records to the existing BI layer.

Deliverables:

- commerce event log
- projection service
- updated metrics endpoints
- updated dashboard widgets
- operational commerce metrics

Tasks:

- [ ] Add `commerce_events`
- [ ] Emit events for cart, checkout, order, payment, shipment, and refund actions
- [ ] Create projection script or service from commerce orders into analytics tables
- [ ] Map products to dimensions
- [ ] Map customers safely to dimensions
- [ ] Map channels and regions
- [ ] Add conversion funnel metric
- [ ] Add cart abandonment metric
- [ ] Add payment health metric
- [ ] Add inventory risk metric
- [ ] Update dashboard UI
- [ ] Preserve existing summary metrics
- [ ] Add tests for analytics projection correctness

Agent command:

```text
Integrate commerce data into the existing DataPulse BI analytics layer. Use commerce orders and events as source-of-truth records, project them into analytics tables, and update dashboard metrics without breaking existing metric endpoints.
```

### Stage 9 — Testing, Hardening, and Validation

Objective: make the product credible and safe to modify.

Deliverables:

- backend test suite covering commerce flows
- frontend lint/build passing
- smoke checks
- seed validation
- checkout retry validation
- security validation

Tasks:

- [ ] Add auth tests
- [ ] Add catalog tests
- [ ] Add cart tests
- [ ] Add checkout tests
- [ ] Add inventory tests
- [ ] Add payment tests
- [ ] Add order lifecycle tests
- [ ] Add admin authorization tests
- [ ] Add analytics projection tests
- [ ] Add smoke script for commerce flow
- [ ] Run frontend lint
- [ ] Run frontend build
- [ ] Update testing documentation

Agent command:

```text
Expand the test suite to protect the full commerce flow. The project cannot be considered complete until auth, catalog, cart, checkout, payments, inventory, orders, admin authorization, analytics projection, smoke checks, frontend lint, and frontend build all pass.
```

### Stage 10 — Deployment and Portfolio Polish

Objective: publish a strong portfolio demo.

Deliverables:

- deployed storefront
- deployed backend
- hosted PostgreSQL
- demo seed data
- safe demo checkout
- README case study
- screenshots
- demo instructions

Tasks:

- [ ] Update production environment variables
- [ ] Validate production-like Docker stack
- [ ] Deploy database
- [ ] Deploy backend
- [ ] Run migrations
- [ ] Seed demo commerce data
- [ ] Deploy frontend
- [ ] Validate public checkout
- [ ] Validate admin demo
- [ ] Validate dashboard
- [ ] Add screenshots
- [ ] Add live links
- [ ] Add known limitations
- [ ] Add roadmap

Agent command:

```text
Prepare DataPulse Commerce for public portfolio review. Deploy the storefront, backend, database, demo seed data, safe checkout, admin demo, and analytics dashboard. Update README with links, screenshots, demo instructions, limitations, and roadmap.
```

## 4. Completion Criteria

The commerce project is complete when:

- BI baseline remains functional
- products can be browsed publicly
- products can be added to cart
- checkout creates orders idempotently
- payment is represented through a mock or sandbox provider
- inventory is reserved and updated correctly
- customers can view order history
- admins can manage products, inventory, and orders
- analytics dashboard reflects commerce data
- tests pass
- frontend lint/build pass
- deployment documentation is updated
- public demo is safe and usable

## 5. Recommendations

- Do not add real payment processing before mock checkout works.
- Do not allow dashboard analytics to create or mutate transactional order records.
- Keep checkout logic in backend services, not frontend components.
- Use database transactions for checkout, inventory reservation, and order creation.
- Add tests before expanding business complexity.
- Keep all demo data synthetic.


---

# MVP Backlog — DataPulse Commerce

## 1. Purpose

This backlog turns the DataPulse Commerce concept into an implementation sequence.

The goal is to build a complete e-commerce MVP on top of the completed DataPulse BI foundation while keeping development practical and testable.

## 2. MVP Strategy

The MVP must prove this complete flow:

```text
storefront → product detail → cart → checkout → payment simulation → order → inventory update → admin management → analytics dashboard
```

The first version must be complete enough to demonstrate a real commerce system, but safe enough for public portfolio review.

## 3. Phase 0 — BI Baseline Preservation

### Objective

Confirm the existing DataPulse BI project remains stable before commerce implementation.

### Deliverables

- tests passing
- dashboard still working
- backend still running
- existing docs updated with new commerce direction

### Tasks

- [ ] Run existing backend tests
- [ ] Run frontend lint
- [ ] Run frontend build
- [ ] Run smoke checks
- [ ] Confirm `/health`
- [ ] Confirm `/metrics/summary`
- [ ] Confirm dashboard loads
- [ ] Create Git checkpoint

### Priority

Critical

## 4. Phase 1 — Authentication and Customer Foundation

### Objective

Add users, customers, addresses, and protected routes.

### Deliverables

- authentication backend
- customer model
- address model
- login/register UI
- customer account shell
- admin role support

### Tasks

- [ ] Create user model
- [ ] Create customer model
- [ ] Create address model
- [ ] Add Alembic migration
- [ ] Add password hashing
- [ ] Add token/session utilities
- [ ] Implement registration endpoint
- [ ] Implement login endpoint
- [ ] Implement `/auth/me`
- [ ] Implement admin role guard
- [ ] Implement customer ownership guard
- [ ] Create login page
- [ ] Create register page
- [ ] Create account layout
- [ ] Add auth tests

### Priority

Critical

## 5. Phase 2 — Catalog

### Objective

Create the public product catalog.

### Deliverables

- categories
- products
- product images
- product variants
- public catalog API
- product listing page
- product detail page

### Tasks

- [ ] Create category model
- [ ] Create product model
- [ ] Create product image model
- [ ] Create product variant model
- [ ] Add migrations
- [ ] Add seed categories
- [ ] Add seed products
- [ ] Implement category list endpoint
- [ ] Implement product list endpoint
- [ ] Implement product detail by slug endpoint
- [ ] Add search/filter support
- [ ] Build storefront home section
- [ ] Build product listing page
- [ ] Build product cards
- [ ] Build product detail page
- [ ] Add catalog tests

### Priority

Critical

## 6. Phase 3 — Inventory

### Objective

Track stock and support reservations.

### Deliverables

- inventory item table
- inventory movement table
- inventory service
- admin stock adjustment
- low-stock support

### Tasks

- [ ] Create inventory item model
- [ ] Create inventory movement model
- [ ] Add migrations
- [ ] Seed inventory
- [ ] Implement stock availability service
- [ ] Implement reservation service
- [ ] Implement release reservation service
- [ ] Implement sale finalization movement
- [ ] Implement admin inventory adjustment endpoint
- [ ] Build admin inventory page
- [ ] Add inventory tests

### Priority

Critical

## 7. Phase 4 — Cart

### Objective

Allow visitors and customers to manage a cart.

### Deliverables

- cart model
- cart item model
- cart API
- cart page
- cart summary
- server-side totals

### Tasks

- [ ] Create cart model
- [ ] Create cart item model
- [ ] Add migrations
- [ ] Implement cart retrieval
- [ ] Implement add item
- [ ] Implement update quantity
- [ ] Implement remove item
- [ ] Implement cart total calculation
- [ ] Validate active product and variant
- [ ] Validate stock before checkout
- [ ] Build cart page
- [ ] Build cart item component
- [ ] Build cart summary component
- [ ] Add cart tests

### Priority

Critical

## 8. Phase 5 — Checkout and Orders

### Objective

Convert carts into orders transactionally.

### Deliverables

- checkout session
- order table
- order item table
- order status history
- checkout page
- order confirmation page

### Tasks

- [ ] Create checkout session model
- [ ] Create order model
- [ ] Create order item model
- [ ] Create order status history model
- [ ] Add migrations
- [ ] Implement checkout session endpoint
- [ ] Implement address snapshots
- [ ] Implement total recalculation
- [ ] Implement idempotent order placement
- [ ] Implement order number generation
- [ ] Reserve inventory during checkout
- [ ] Mark cart as converted
- [ ] Build checkout page
- [ ] Build order confirmation page
- [ ] Add checkout tests
- [ ] Add idempotency tests

### Priority

Critical

## 9. Phase 6 — Payment Mock Provider

### Objective

Simulate payment safely while keeping provider integration clean.

### Deliverables

- payment table
- payment adapter interface
- mock provider
- payment webhook skeleton
- payment success/failure behavior

### Tasks

- [ ] Create payment model
- [ ] Add migration
- [ ] Create payment adapter interface
- [ ] Implement mock provider
- [ ] Implement payment creation
- [ ] Implement payment success simulation
- [ ] Implement payment failure simulation
- [ ] Implement webhook endpoint skeleton
- [ ] Update order payment status
- [ ] Update order status on payment success
- [ ] Release stock on payment failure if needed
- [ ] Add payment tests

### Priority

Critical

## 10. Phase 7 — Customer Account

### Objective

Allow customers to view and manage their data.

### Deliverables

- account overview
- address management
- order history
- order detail

### Tasks

- [ ] Implement profile endpoint
- [ ] Implement address CRUD
- [ ] Implement customer order list
- [ ] Implement customer order detail
- [ ] Enforce ownership checks
- [ ] Build account overview
- [ ] Build address form
- [ ] Build order history page
- [ ] Build order detail page
- [ ] Add tests for ownership rules

### Priority

High

## 11. Phase 8 — Admin Back Office

### Objective

Provide operational management for products, inventory, and orders.

### Deliverables

- admin dashboard
- product management
- inventory management
- order management
- status updates

### Tasks

- [ ] Implement admin overview endpoint
- [ ] Implement admin product list
- [ ] Implement admin product create/update
- [ ] Implement admin inventory view
- [ ] Implement inventory adjustments
- [ ] Implement admin order list
- [ ] Implement admin order detail
- [ ] Implement order status update
- [ ] Build admin dashboard
- [ ] Build admin product pages
- [ ] Build admin inventory page
- [ ] Build admin order pages
- [ ] Add admin authorization tests

### Priority

High

## 12. Phase 9 — Promotions

### Objective

Add basic coupon support.

### Deliverables

- coupon table
- coupon validation service
- cart coupon application
- checkout discount calculation

### Tasks

- [ ] Create coupon model
- [ ] Add migration
- [ ] Implement coupon validation
- [ ] Implement apply coupon endpoint
- [ ] Implement remove coupon endpoint
- [ ] Recalculate cart totals with discount
- [ ] Recalculate checkout totals with discount
- [ ] Add coupon admin seed
- [ ] Add coupon tests

### Priority

Medium

## 13. Phase 10 — Commerce Analytics Integration

### Objective

Make the existing BI dashboard reflect commerce data.

### Deliverables

- commerce event table
- analytics projection service
- updated metrics
- updated dashboard widgets

### Tasks

- [ ] Create commerce event model
- [ ] Emit product/cart/checkout/order/payment events
- [ ] Create projection script
- [ ] Map commerce orders to analytics facts
- [ ] Map products/categories to dimensions
- [ ] Add conversion funnel metric
- [ ] Add cart abandonment metric
- [ ] Add payment success metric
- [ ] Add inventory risk metric
- [ ] Update dashboard UI
- [ ] Add analytics projection tests

### Priority

High

## 14. Phase 11 — Testing and Hardening

### Objective

Make the project credible, reliable, and safe to modify.

### Deliverables

- expanded backend tests
- smoke checks
- frontend lint/build
- security validations

### Tasks

- [ ] Test auth
- [ ] Test catalog
- [ ] Test inventory
- [ ] Test cart
- [ ] Test checkout
- [ ] Test payment
- [ ] Test orders
- [ ] Test admin authorization
- [ ] Test metrics
- [ ] Create commerce smoke script
- [ ] Run compile checks
- [ ] Run frontend lint
- [ ] Run frontend build
- [ ] Update testing docs

### Priority

Critical

## 15. Phase 12 — Deployment and Portfolio Polish

### Objective

Prepare the public demo.

### Deliverables

- public storefront
- backend API
- hosted database
- demo data
- demo credentials guidance
- screenshots
- README case study

### Tasks

- [ ] Update deployment variables
- [ ] Validate production-like Docker stack
- [ ] Deploy database
- [ ] Deploy backend
- [ ] Run migrations
- [ ] Seed commerce demo data
- [ ] Deploy frontend
- [ ] Validate checkout in demo mode
- [ ] Validate admin
- [ ] Validate dashboard
- [ ] Add screenshots
- [ ] Add live links
- [ ] Add limitations
- [ ] Add roadmap

### Priority

High


---

# Screen Flows and Navigation — DataPulse Commerce

## 1. Purpose

This document guides frontend construction and user experience for DataPulse Commerce.

The product must present both:

- a customer-facing e-commerce storefront
- an admin and analytics experience built on the DataPulse BI foundation

## 2. User Roles

## 2.1 Guest

Can:

- browse products
- search products
- filter products
- view product details
- add items to cart
- start checkout
- register or login

## 2.2 Customer

Can:

- manage account
- manage addresses
- checkout
- view orders
- view order detail

## 2.3 Admin

Can:

- access admin dashboard
- manage products
- manage inventory
- manage orders
- update order statuses
- access analytics dashboard

## 2.4 Analyst

Can:

- view analytics dashboard
- inspect commerce KPIs
- inspect ingestion/projection status

## 3. Global Navigation

## 3.1 Public navigation

Main items:

- Home
- Products
- Categories
- Cart
- Account
- Dashboard link if public portfolio mode allows it

Rules:

- cart count should be visible
- active page should be highlighted
- demo mode should be clearly labeled

## 3.2 Customer navigation

Main items:

- Account Overview
- Addresses
- Orders
- Logout

## 3.3 Admin navigation

Main items:

- Admin Overview
- Products
- Inventory
- Orders
- Analytics Dashboard
- Storefront

## 4. Planned Screens

## 4.1 Home Screen

### Purpose

Introduce the store and guide users to products.

### Main sections

- hero section
- featured categories
- featured products
- value proposition
- demo mode notice
- link to analytics case study if portfolio mode

### Data loaded from API

- `GET /catalog/categories`
- `GET /catalog/products?featured=true`

## 4.2 Product Listing Screen

### Purpose

Allow users to browse and filter products.

### Main sections

- page title
- category/filter sidebar
- search input
- sort selector
- product grid
- pagination or load more
- empty state

### Available actions

- search products
- filter by category
- filter by price range if implemented
- sort by relevance, price, or newest
- open product detail
- add quick item to cart if variant is unambiguous

### Data loaded from API

- `GET /catalog/products`
- `GET /catalog/categories`

## 4.3 Product Detail Screen

### Purpose

Present product information and conversion action.

### Main sections

- image gallery
- product name
- price
- variant selector
- stock availability
- quantity selector
- add to cart button
- description
- related products optional

### Available actions

- select variant
- select quantity
- add to cart
- continue shopping
- go to cart

### Data loaded from API

- `GET /catalog/products/{slug}`
- `POST /cart/items`

## 4.4 Cart Screen

### Purpose

Let user review selected items before checkout.

### Main sections

- cart item list
- quantity controls
- remove item action
- coupon input
- subtotal
- discount
- shipping estimate placeholder
- total
- checkout button

### Available actions

- update quantity
- remove item
- apply coupon
- remove coupon
- continue shopping
- proceed to checkout

### Data loaded from API

- `GET /cart`
- `POST /cart/items`
- `PATCH /cart/items/{item_id}`
- `DELETE /cart/items/{item_id}`
- `POST /cart/apply-coupon`

## 4.5 Checkout Screen

### Purpose

Collect checkout data and place the order.

### Main sections

- authentication prompt or guest checkout notice
- contact information
- shipping address
- billing address option
- shipping method
- order summary
- payment method demo selector
- place order button
- error/success messages

### Available actions

- enter address
- select shipping method
- review totals
- place order
- simulate payment success or failure in demo mode

### Data loaded from API

- `POST /checkout/session`
- `GET /checkout/session/{id}`
- `POST /checkout/place-order`

## 4.6 Order Confirmation Screen

### Purpose

Confirm that the order was created.

### Main sections

- success message
- order number
- payment status
- order summary
- shipping address
- next steps
- account/order history link
- dashboard note for portfolio reviewers

### Data loaded from API

- `GET /orders/{order_number}`

## 4.7 Login Screen

### Purpose

Allow customers and admins to authenticate.

### Main sections

- email field
- password field
- submit button
- registration link
- demo credentials note if portfolio mode

### Data loaded from API

- `POST /auth/login`
- `GET /auth/me`

## 4.8 Register Screen

### Purpose

Allow new customers to create accounts.

### Main sections

- name fields
- email
- password
- password confirmation
- terms notice
- submit button

### Data loaded from API

- `POST /auth/register`

## 4.9 Account Overview Screen

### Purpose

Show customer profile summary.

### Main sections

- customer name/email
- default address summary
- recent orders
- account navigation

### Data loaded from API

- `GET /auth/me`
- `GET /account/profile`
- `GET /orders?limit=5`

## 4.10 Address Management Screen

### Purpose

Allow customers to manage shipping and billing addresses.

### Main sections

- address list
- create/edit form
- default address marker
- delete action

### Data loaded from API

- `GET /account/addresses`
- `POST /account/addresses`
- `PATCH /account/addresses/{id}`
- `DELETE /account/addresses/{id}`

## 4.11 Customer Order History Screen

### Purpose

Show customer orders.

### Main sections

- order list
- order number
- date
- status
- payment status
- total
- detail link

### Data loaded from API

- `GET /orders`

## 4.12 Customer Order Detail Screen

### Purpose

Show one customer order.

### Main sections

- order header
- status timeline
- items
- payment state
- shipment state
- totals
- address snapshot

### Data loaded from API

- `GET /orders/{order_number}`

## 4.13 Admin Overview Screen

### Purpose

Give admins an operational summary.

### Main sections

- orders today
- pending orders
- low stock products
- revenue summary
- payment issues
- quick links

### Data loaded from API

- `GET /admin/overview`
- `GET /metrics/summary`
- `GET /metrics/inventory-risk`

## 4.14 Admin Product List Screen

### Purpose

Manage products.

### Main sections

- product table
- search/filter
- status filter
- create product button
- edit action

### Data loaded from API

- `GET /admin/products`

## 4.15 Admin Product Editor Screen

### Purpose

Create and edit products.

### Main sections

- product basic data
- category selector
- pricing fields
- status selector
- variant editor
- image URL editor
- save button

### Data loaded from API

- `GET /admin/products/{id}`
- `POST /admin/products`
- `PATCH /admin/products/{id}`

## 4.16 Admin Inventory Screen

### Purpose

Manage stock.

### Main sections

- inventory table
- SKU
- stock on hand
- reserved stock
- available stock
- low-stock indicator
- adjustment form
- movement history link

### Data loaded from API

- `GET /admin/inventory`
- `POST /admin/inventory/adjustments`

## 4.17 Admin Order List Screen

### Purpose

Manage orders.

### Main sections

- order table
- status filters
- date filters
- payment filters
- search by order number/email
- order detail link

### Data loaded from API

- `GET /admin/orders`

## 4.18 Admin Order Detail Screen

### Purpose

Inspect and update an order.

### Main sections

- order summary
- customer summary
- item list
- payment status
- shipment status
- status history
- admin status update action

### Data loaded from API

- `GET /admin/orders/{order_number}`
- `PATCH /admin/orders/{order_number}/status`

## 4.19 Analytics Dashboard Screen

### Purpose

Extend the existing DataPulse BI dashboard with commerce metrics.

### Main sections

- KPI cards
- revenue over time
- top products
- revenue by category
- revenue by channel
- conversion funnel
- cart abandonment
- payment health
- inventory risk
- recent orders
- data pipeline status

### Available actions

- filter by date
- filter by category
- filter by channel
- filter by region
- change trend grouping
- open admin order detail

### Data loaded from API

- `GET /metrics/summary`
- `GET /metrics/revenue-over-time`
- `GET /metrics/top-products`
- `GET /metrics/revenue-by-category`
- `GET /metrics/conversion-funnel`
- `GET /metrics/cart-abandonment`
- `GET /metrics/payment-health`
- `GET /metrics/inventory-risk`
- `GET /ingestion/runs/latest`

## 5. Storefront Layout Example

```text
+------------------------------------------------------+
| DataPulse Commerce | Products | Cart | Account       |
+------------------------------------------------------+
| Hero: Full-stack commerce with built-in analytics    |
+------------------------------------------------------+
| Featured Categories                                  |
+------------------------------------------------------+
| Product Grid                                         |
+------------------------------------------------------+
| Demo mode notice + dashboard case study link         |
+------------------------------------------------------+
```

## 6. Checkout Layout Example

```text
+------------------------------------------------------+
| Checkout                                             |
+----------------------------+-------------------------+
| Contact and Address Form   | Order Summary           |
| Shipping Method            | Items / Totals          |
| Payment Demo Selector      | Place Order Button      |
+----------------------------+-------------------------+
```

## 7. Admin Layout Example

```text
+------------------------------------------------------+
| Admin: Overview | Products | Inventory | Orders | BI |
+------------------------------------------------------+
| KPI cards                                            |
+------------------------------------------------------+
| Pending Orders       | Low Stock Products            |
+------------------------------------------------------+
| Recent Activity                                      |
+------------------------------------------------------+
```

## 8. UX Rules

- Always show loading states for API data.
- Always show empty states for no products, no cart items, or no orders.
- Always show clear checkout errors.
- Do not trust frontend totals.
- Clearly label mock payment mode.
- Keep admin actions visually separate from customer actions.
- Keep dashboard accessible for portfolio reviewers.


---

# Instructions for Development Agent — DataPulse Commerce

## 1. Purpose

This document guides an AI development agent or human developer responsible for implementing DataPulse Commerce on top of the completed DataPulse BI project.

The project must be developed as a professional full-stack e-commerce product with built-in analytics, not as a quick tutorial.

## 2. Project Objective

Build a complete e-commerce platform that demonstrates:

- storefront development
- customer authentication
- product catalog modeling
- cart management
- checkout workflow
- payment abstraction
- order lifecycle management
- inventory control
- admin back office
- PostgreSQL transactional modeling
- FastAPI backend architecture
- Next.js frontend architecture
- business intelligence integration
- local reproducibility
- automated tests
- deployment readiness
- strong documentation

## 3. Foundation Assumption

The existing DataPulse BI project is complete and must be preserved.

It already provides:

- FastAPI backend
- Next.js dashboard
- PostgreSQL database
- ingestion pipeline
- transformation pipeline
- analytics tables
- metric endpoints
- tests
- local and production-like validation assets

The commerce implementation must extend this foundation without breaking it.

## 4. Document Hierarchy

In case of conflict, follow this order:

1. `docs/mvp_scope.md`
2. `docs/actual_state.md`
3. `docs/architecture.md`
4. `docs/database_modeling.md`
5. `docs/development_plan.md`
6. `docs/mvp_backlog.md`
7. `docs/technical_specification.md`
8. `docs/screen_flows.md`
9. `docs/testing.md`
10. `docs/local_setup_execution.md`
11. `docs/local_environment_architecture.md`
12. `docs/deployment.md`
13. `README.md`

The MVP scope controls what must be built first. The actual state controls what already exists. The architecture and database model define how the extension must be structured.

## 5. Required Stack

### Frontend

- Next.js
- TypeScript
- Tailwind CSS
- TanStack Query
- Recharts for dashboard charts

### Backend

- FastAPI
- Python
- Pydantic
- SQLAlchemy 2.x or compatible current project style
- Alembic
- PostgreSQL driver already used by the project

### Database

- PostgreSQL

### Data and analytics

- Existing Python ingestion/transformation style
- Pandas where useful
- structured logging
- commerce event projection into analytics

### Local infrastructure

- Docker
- Docker Compose
- WSL2 or Linux recommended

### Testing

- Pytest for backend and pipeline tests
- frontend linting and production build
- optional browser E2E later

## 6. Implementation Order

Follow this order:

1. validate existing BI baseline
2. add auth and customer models
3. add catalog and inventory models
4. add catalog APIs
5. add storefront product pages
6. add cart API and UI
7. add checkout sessions
8. add order creation
9. add mock payment provider
10. add customer account screens
11. add admin back office
12. add commerce events
13. add analytics projection
14. update dashboard metrics
15. add tests
16. update deployment
17. polish README and portfolio narrative

Do not begin with advanced external integrations before the local commerce flow works.

## 7. Scope Rules

The commerce MVP must include:

- product catalog
- product variants
- inventory tracking
- cart
- checkout
- mock payment provider
- order creation
- order status lifecycle
- customer account area
- admin product management
- admin inventory management
- admin order management
- commerce analytics integration
- tests
- documentation

The MVP must not include yet:

- multi-vendor marketplace
- complex ERP integration
- real card handling by the application
- warehouse automation
- native mobile app
- Kubernetes
- Kafka
- Spark
- machine-learning recommendations
- real private customer data

## 8. Quality Rules

The agent must:

- preserve existing BI behavior
- use clear file organization
- use typed schemas
- keep business logic out of route functions
- use service classes/functions for workflows
- use migrations for database changes
- use environment variables for configuration
- avoid hardcoded secrets
- write deterministic seed scripts
- add tests for critical behavior
- keep demo data synthetic
- update documentation when behavior changes
- avoid unnecessary dependencies
- prefer simple, maintainable implementation over clever complexity

## 9. Backend Rules

The backend must:

- expose `/health`
- preserve existing metric routes
- add commerce route groups cleanly
- validate all request bodies
- return typed response schemas
- handle empty results gracefully
- return consistent error responses
- use database transactions for checkout/order creation
- protect admin routes with role checks
- protect customer routes with ownership checks
- avoid storing payment secrets
- avoid logging tokens or passwords

Recommended route groups:

```text
GET /health
POST /auth/register
POST /auth/login
GET /auth/me
GET /catalog/categories
GET /catalog/products
GET /catalog/products/{slug}
GET /cart
POST /cart/items
PATCH /cart/items/{item_id}
DELETE /cart/items/{item_id}
POST /checkout/session
POST /checkout/place-order
GET /orders
GET /orders/{order_number}
POST /payments/webhook
GET /admin/overview
GET /admin/products
POST /admin/products
PATCH /admin/products/{id}
GET /admin/inventory
POST /admin/inventory/adjustments
GET /admin/orders
PATCH /admin/orders/{order_number}/status
GET /metrics/summary
GET /metrics/conversion-funnel
GET /metrics/payment-health
GET /metrics/inventory-risk
```

## 10. Checkout Rules

Checkout must:

- validate cart ownership
- validate cart is active
- validate all items are active
- validate stock availability
- recalculate totals server-side
- snapshot product names, SKUs, prices, and addresses
- reserve inventory transactionally
- create an order idempotently
- create payment record through the payment service
- mark cart as converted only after order creation
- emit commerce events

The frontend must not be trusted for prices, totals, discounts, or stock.

## 11. Inventory Rules

Inventory must:

- maintain stock on hand
- maintain reserved stock
- calculate available stock
- create movement records for adjustments
- create movement records for reservations
- release reservations on failed or expired checkout
- convert reservation to sale after payment success
- prevent negative available stock unless backorder is explicitly allowed

## 12. Payment Rules

Payment must:

- use an adapter interface
- start with mock provider
- never store raw card data
- validate webhooks if using real providers later
- process webhook events idempotently
- update payment and order statuses consistently
- record failure reason safely

## 13. Frontend Rules

The frontend must:

- keep API calls in a shared client
- use TanStack Query for server state
- avoid duplicating backend business calculations
- show loading, error, and empty states
- provide responsive storefront layout
- protect admin pages at UI level and rely on backend for true authorization
- clearly label demo checkout mode
- maintain dashboard access

## 14. Database Rules

The database must:

- keep existing BI tables working
- add commerce tables through Alembic migrations
- use UUID primary keys consistently if that is the current style
- use unique slugs for public pages
- use unique SKUs for variants
- snapshot order line values
- use status history for orders
- use inventory movement history
- index common filters
- avoid real private customer data in seeds

## 15. Testing Rules

Minimum test coverage must include:

- auth registration/login
- protected route access
- product listing
- product detail
- inventory adjustment
- add to cart
- update cart quantity
- checkout success
- checkout retry idempotency
- payment success
- payment failure
- inventory reservation/release
- order history ownership
- admin authorization
- analytics projection
- healthcheck
- at least one commerce metric endpoint

## 16. Git and Development Workflow

Recommended workflow:

- one feature per branch or logical commit sequence
- run tests before important commits
- keep migrations small and clear
- commit documentation with related feature changes
- do not commit `.env`
- do not commit generated secrets
- use clear commit messages

## 17. Definition of Done

A commerce feature is done only when:

- backend behavior works
- frontend behavior works when applicable
- database migration is included when needed
- tests are added or updated
- existing BI behavior still works
- documentation is updated
- no secrets are committed


---

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


---

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


---

# Testing Strategy — DataPulse Commerce

## 1. Purpose

This document defines the testing strategy for DataPulse Commerce.

The goal is to protect the core promise of the product:

```text
commerce actions create reliable orders, correct inventory, safe payment state, and accurate analytics
```

Because the project is built on the DataPulse BI foundation, testing must protect both:

- existing analytics behavior
- new transactional commerce behavior

## 2. Testing Objective

Testing must prove that:

- users can authenticate safely
- products can be browsed
- carts behave correctly
- checkout creates exactly one order per idempotent request
- inventory is reserved and updated correctly
- payment status updates order status
- customers cannot access other customers' orders
- admins can manage operations only when authorized
- commerce data appears in analytics metrics

## 3. Minimum Testing Scope

The MVP must include tests for:

- auth registration and login
- protected routes
- catalog listing
- product detail
- inventory adjustment
- cart add/update/remove
- checkout success
- checkout retry idempotency
- payment success
- payment failure
- inventory reservation
- inventory release or sale movement
- customer order history ownership
- admin authorization
- order status transition
- analytics projection
- metric endpoint correctness
- backend healthcheck
- empty result behavior

## 4. Testing Types

## 4.1 Unit Tests

Use for pure or isolated logic.

Examples:

- password verification helper
- price calculation
- discount calculation
- cart total calculation
- available stock calculation
- order number format helper
- status transition validator
- payment adapter mock behavior

## 4.2 Integration Tests

Use for database and service flows.

Examples:

- create user and customer profile
- create product and variant
- adjust inventory
- add item to cart
- place order from cart
- reserve inventory
- update payment status
- project order into analytics

## 4.3 API Tests

Use for route behavior.

Examples:

- `/health`
- `/auth/login`
- `/catalog/products`
- `/cart`
- `/checkout/place-order`
- `/admin/orders`
- `/metrics/summary`

## 4.4 Smoke Tests

Use to confirm the system works end to end.

Commerce smoke should:

1. check health
2. seed catalog
3. create or login customer
4. list products
5. add product to cart
6. create checkout session
7. place order
8. simulate payment success
9. verify inventory movement
10. verify order appears in metrics

## 4.5 Frontend Validation

Minimum frontend validation:

- lint passes
- production build passes
- important screens render without type errors

Optional later:

- browser E2E for catalog/cart/checkout

## 5. Critical Flows to Test

## 5.1 Authentication flow

Test that:

- new customer can register
- customer can login
- wrong password fails
- inactive user cannot login
- admin route rejects customer
- protected customer route rejects anonymous user

## 5.2 Catalog flow

Test that:

- active products appear in public listing
- draft products do not appear publicly
- product detail works by slug
- variants return SKU and price information
- missing product returns clear 404

## 5.3 Cart flow

Test that:

- item can be added
- duplicate item merges quantity
- quantity can be updated
- item can be removed
- inactive variant cannot be added
- quantity greater than stock is rejected before checkout

## 5.4 Checkout flow

Test that:

- checkout validates active cart
- checkout recalculates totals server-side
- checkout snapshots prices and addresses
- checkout creates order items
- checkout reserves inventory
- checkout marks cart converted
- retrying same idempotency key returns same order

## 5.5 Payment flow

Test that:

- mock payment success marks payment paid
- mock payment success marks order paid or processing
- mock payment failure marks payment failed
- payment failure does not produce duplicate order
- webhook-style updates are idempotent

## 5.6 Inventory flow

Test that:

- admin adjustment changes stock on hand
- adjustment creates movement record
- checkout reservation increases reserved stock
- payment success converts reservation to sale
- failed checkout releases reservation when applicable
- available stock never becomes negative unless backorder is allowed

## 5.7 Order ownership flow

Test that:

- customer sees own orders
- customer cannot see another customer's order
- admin can see all orders
- anonymous user cannot access customer orders

## 5.8 Analytics flow

Test that:

- paid orders appear in revenue metrics
- failed payments do not count as paid revenue
- cancelled/refunded orders are handled according to metric definition
- top products match order item totals
- payment health metric reflects payment statuses
- inventory risk metric reflects low stock products

## 6. Recommended Backend Test Structure

```text
backend/tests/
├── conftest.py
├── test_foundation.py
├── test_auth.py
├── test_catalog.py
├── test_inventory.py
├── test_cart.py
├── test_checkout.py
├── test_payments.py
├── test_orders.py
├── test_admin.py
├── test_commerce_events.py
├── test_commerce_analytics.py
├── test_metrics.py
└── test_smoke.py
```

## 7. Example Test Cases

## 7.1 Cart total calculation

Given:

```text
2 units x 50.00
1 unit x 30.00
```

Expected:

```text
subtotal = 130.00
```

## 7.2 Inventory availability

Given:

```text
stock_on_hand = 10
stock_reserved = 3
```

Expected:

```text
available_stock = 7
```

## 7.3 Checkout idempotency

Given:

```text
same cart
same idempotency key
two repeated place-order requests
```

Expected:

```text
one order exists
same order returned for retry
inventory is reserved once
```

## 7.4 Unauthorized admin access

Given:

```text
customer token
GET /admin/orders
```

Expected:

```text
403 Forbidden
```

## 7.5 Paid revenue metric

Given:

```text
one paid order total 100.00
one failed payment order total 200.00
```

Expected:

```text
paid revenue = 100.00
```

## 8. Test Commands

Backend:

```bash
cd backend
source .venv/bin/activate
python -m compileall app scripts
pytest
```

Commerce smoke:

```bash
cd backend
source .venv/bin/activate
python scripts/run_commerce_smoke_checks.py
```

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

## 9. Test Data Strategy

Use deterministic synthetic data.

Minimum data set:

- 1 admin user
- 2 customer users
- 3 categories
- 5 products
- 8 variants
- inventory for every variant
- 1 active coupon
- 1 paid order
- 1 failed payment order
- 1 cancelled order
- 1 low-stock variant

Do not use real customer data.

## 10. Minimum Validation Criteria

The MVP should not be considered ready unless:

- backend tests pass
- auth tests pass
- checkout idempotency test passes
- inventory tests pass
- payment mock tests pass
- customer ownership tests pass
- admin authorization tests pass
- analytics metric tests pass
- smoke script passes
- frontend lint succeeds
- frontend build succeeds
- no secrets are committed
- dashboard loads commerce metrics

## 11. Future Testing Improvements

Future versions may add:

- Playwright browser tests
- payment provider sandbox tests
- load tests for catalog and checkout
- concurrency tests for inventory
- security scanning
- CI/CD test workflow
- visual regression tests for storefront


---

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
- admin demo credentials stored securely
- environment variable documentation
- healthcheck validation
- dashboard validation
- README links

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
NEXT_PUBLIC_STORE_NAME=DataPulse Commerce
NEXT_PUBLIC_DEMO_MODE=true
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
REFRESH_TOKEN_EXPIRE_DAYS=7
PAYMENT_PROVIDER=mock
PAYMENT_WEBHOOK_SECRET=
STORE_CURRENCY=BRL
ADMIN_DEMO_EMAIL=
ADMIN_DEMO_PASSWORD=
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
- sample customers
- categories
- products
- variants
- inventory
- coupons
- sample carts if useful
- sample completed orders
- sample payment records
- commerce events
- analytics projections

Example command:

```bash
python scripts/seed_commerce_demo_data.py
```

The existing `seed_demo_data.py` may remain for the BI layer, but the commerce seed should become the main demo seed once commerce is implemented.

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

Recommended command once Docker files are updated:

```bash
docker compose -p datapulse-commerce-prod -f docker-compose.production.yml up -d --build
docker exec datapulse_backend_prod alembic upgrade head
docker exec datapulse_backend_prod python scripts/seed_commerce_demo_data.py
curl http://localhost:8000/health
curl http://localhost:8000/catalog/products
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
