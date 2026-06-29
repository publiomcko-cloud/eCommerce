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

- [x] Run backend tests
- [x] Run frontend lint and build
- [x] Run smoke checks
- [x] Confirm existing dashboard works
- [x] Confirm manual order page still works
- [x] Create Git checkpoint before commerce changes
- [x] Document baseline version in `actual_state.md`

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

- [x] Add `commerce_users`
- [x] Add `commerce_customers`
- [x] Add `commerce_customer_addresses`
- [x] Add password hashing utility
- [x] Add token/session strategy
- [x] Implement `/auth/register`
- [x] Implement `/auth/login`
- [x] Implement `/auth/me`
- [x] Implement logout behavior
- [x] Add role-based guard for admin endpoints
- [x] Add frontend auth state handling
- [x] Add login page
- [x] Add registration page
- [x] Add account shell page
- [x] Add tests for auth flow

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

- [x] Add category tables
- [x] Add product tables
- [x] Add product variant tables
- [x] Add product image tables
- [x] Add inventory tables
- [x] Add inventory movement table
- [x] Implement product listing endpoint
- [x] Implement product detail endpoint by slug
- [x] Implement category endpoint
- [x] Implement admin product create/update endpoints
- [x] Implement admin inventory adjustment endpoint
- [x] Add demo product seed script
- [x] Add product card UI
- [x] Add product listing page
- [x] Add product detail page
- [x] Add admin product list page
- [x] Add admin product editor page
- [x] Add tests for catalog and inventory rules

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

- [x] Add `commerce_carts`
- [x] Add `commerce_cart_items`
- [x] Implement cart creation/retrieval
- [x] Implement add item
- [x] Implement update quantity
- [x] Implement remove item
- [x] Implement cart totals service
- [x] Validate variant status and stock availability
- [x] Merge duplicate cart items
- [x] Support customer cart association after login
- [x] Add cart page
- [x] Add mini cart or cart summary
- [x] Add tests for cart operations

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

- [x] Add checkout session table
- [x] Add order table
- [x] Add order item table
- [x] Add order status history table
- [x] Add idempotency key support
- [x] Implement checkout session creation
- [x] Implement shipping and billing address snapshots
- [x] Implement totals snapshot
- [x] Implement order number generation
- [x] Implement inventory reservation
- [x] Implement order creation from cart
- [x] Mark cart as converted
- [x] Add checkout page
- [x] Add order confirmation page
- [x] Add tests for idempotent order placement
- [x] Add tests for inventory reservation

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

- [x] Add payment table
- [x] Add payment adapter interface
- [x] Add mock provider
- [x] Implement payment intent/session creation
- [x] Implement payment success simulation
- [x] Implement payment failure simulation
- [x] Implement webhook endpoint skeleton
- [x] Update order status on payment success
- [x] Release reservation on payment failure where appropriate
- [x] Add payment state to order confirmation
- [x] Add tests for payment success
- [x] Add tests for payment failure
- [x] Add tests for idempotent webhook handling

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

- [x] Implement customer profile endpoint
- [x] Implement address CRUD endpoints
- [x] Implement customer order list endpoint
- [x] Implement customer order detail endpoint
- [x] Protect customer data by ownership
- [x] Add account overview UI
- [x] Add address UI
- [x] Add order history UI
- [x] Add order detail UI
- [x] Add tests for customer ownership restrictions

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

- [x] Add admin overview API
- [x] Add admin order list API
- [x] Add admin order detail API
- [x] Add admin status update API
- [x] Add inventory adjustment API
- [x] Add shipment table and API if not already added
- [x] Add refund table and API if implementing refunds
- [x] Add admin dashboard page
- [x] Add admin order list page
- [x] Add admin order detail page
- [x] Add admin inventory page
- [x] Add tests for admin authorization
- [x] Add tests for order status transitions

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

- [x] Add `commerce_events`
- [x] Emit events for cart, checkout, order, payment, shipment, and refund actions
- [x] Create projection script or service from commerce orders into analytics tables
- [x] Map products to dimensions
- [x] Map customers safely to dimensions
- [x] Map channels and regions
- [x] Add conversion funnel metric
- [x] Add cart abandonment metric
- [x] Add payment health metric
- [x] Add inventory risk metric
- [x] Update dashboard UI
- [x] Preserve existing summary metrics
- [x] Add tests for analytics projection correctness

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

- [x] Add auth tests
- [x] Add catalog tests
- [x] Add cart tests
- [x] Add checkout tests
- [x] Add inventory tests
- [x] Add payment tests
- [x] Add order lifecycle tests
- [x] Add admin authorization tests
- [x] Add analytics projection tests
- [x] Add smoke script for commerce flow
- [x] Run frontend lint
- [x] Run frontend build
- [x] Update testing documentation

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

- [x] Update production environment variables
- [x] Validate production-like Docker stack configuration
- [ ] Deploy database
- [ ] Deploy backend
- [x] Run migrations locally and document production migration command
- [x] Seed demo commerce data locally and document production seed command
- [x] Run local pre-deployment validation checklist
- [ ] Deploy frontend
- [ ] Validate public checkout
- [ ] Validate admin demo
- [x] Validate local dashboard
- [ ] Add screenshots
- [ ] Add live links
- [x] Add known limitations
- [x] Add roadmap
- [x] Add customer and admin demo credential guidance

Agent command:

```text
Prepare DataPulse Commerce for public portfolio review. Deploy the storefront, backend, database, demo seed data, safe checkout, admin demo, and analytics dashboard. Update README with links, screenshots, demo instructions, limitations, and roadmap.
```

## 4. Completion Criteria

The local commerce MVP is complete when:

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

The public portfolio demo is complete when the remaining Stage 10 deployment
tasks are done and public links/screenshots are added.

## 5. Recommendations

- Do not add real payment processing before mock checkout works.
- Do not allow dashboard analytics to create or mutate transactional order records.
- Keep checkout logic in backend services, not frontend components.
- Use database transactions for checkout, inventory reservation, and order creation.
- Add tests before expanding business complexity.
- Keep all demo data synthetic.
