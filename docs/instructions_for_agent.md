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
2. `docs/current_state.md`
3. `docs/architecture.md`
4. `docs/database_modeling.md`
5. `docs/archive/development_plan.md`
6. `docs/archive/mvp_backlog.md`
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
PUT /cart/items/{item_id}
DELETE /cart/items/{item_id}
POST /checkout/sessions
POST /checkout/orders
GET /checkout/orders/{order_id}
GET /orders
GET /orders/{order_number}
POST /payments/orders/{order_id}
POST /payments/{payment_id}/simulate-success
POST /payments/{payment_id}/simulate-failure
POST /payments/webhooks/mock
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
