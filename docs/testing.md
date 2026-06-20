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

The implemented commerce smoke script is:

```bash
cd backend
source .venv/bin/activate
python scripts/run_commerce_smoke_checks.py
```

The existing BI baseline smoke script remains:

```bash
python scripts/run_smoke_checks.py
```

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
- mock payment success marks order paid
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
- cancelled orders and succeeded refund records are handled according to metric definition
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
├── test_cart.py
├── test_checkout.py
├── test_payments.py
├── test_account.py
├── test_admin.py
├── test_commerce_analytics.py
├── test_api.py
├── test_ingestion.py
├── test_metrics.py
├── test_smoke.py
└── test_transformation.py
```

Inventory coverage currently lives in `test_catalog.py`, `test_admin.py`, `test_checkout.py`, `test_payments.py`, and `test_commerce_analytics.py`.

## 6.1 Current Validation Commands

Run backend migrations and tests:

```bash
cd backend
source .venv/bin/activate
alembic upgrade head
python -m pytest -q
```

Run smoke checks:

```bash
python scripts/run_smoke_checks.py
python scripts/run_commerce_smoke_checks.py
```

Run frontend validation:

```bash
cd ../frontend
npm run lint
npm run build
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

Use deterministic synthetic data. The seed script provides the baseline catalog,
admin account, and customer demo account; tests and smoke checks create orders
and payment states as part of their own isolated flows.

Baseline catalog seed:

- 1 admin user
- 1 customer demo user
- 4 categories
- 4 products
- 7 variants
- inventory for every variant

Test and smoke flows should exercise:

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
