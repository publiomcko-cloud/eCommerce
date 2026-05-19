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
