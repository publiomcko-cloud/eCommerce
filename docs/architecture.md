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

Planned/reference backend domain modules:

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

Current frontend route structure:

```text
frontend/src/
├── app/
│   ├── page.tsx
│   ├── products/
│   │   ├── page.tsx
│   │   └── [slug]/page.tsx
│   ├── cart/page.tsx
│   ├── checkout/page.tsx
│   ├── checkout/confirmation/[orderId]/page.tsx
│   ├── account/page.tsx
│   ├── admin/
│   │   ├── page.tsx
│   │   ├── orders/page.tsx
│   │   ├── orders/[id]/page.tsx
│   │   ├── products/page.tsx
│   │   ├── products/new/page.tsx
│   │   ├── products/[id]/page.tsx
│   │   └── inventory/page.tsx
│   ├── orders/new/page.tsx
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

Current flow:

1. customer opens checkout from cart
2. backend validates cart items
3. backend validates stock availability
4. backend calculates totals
5. backend creates checkout session
6. backend reserves inventory
7. backend creates order with `pending_payment`
8. backend creates payment intent through adapter
9. payment provider confirms or fails payment
10. backend updates payment and order status
11. backend records status history
12. backend emits commerce event
13. order confirmation/account/admin views read the resulting order state
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
- `shipment_updated`

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
PUT /cart/items/{item_id}
DELETE /cart/items/{item_id}
```

### Checkout

```http
POST /checkout/sessions
POST /checkout/orders
GET /checkout/orders/{order_id}
```

### Payments

```http
POST /payments/orders/{order_id}
POST /payments/{payment_id}/simulate-success
POST /payments/{payment_id}/simulate-failure
POST /payments/webhooks/mock
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
