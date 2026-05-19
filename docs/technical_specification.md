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
