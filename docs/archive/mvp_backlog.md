# MVP Backlog - DataPulse Commerce

## Status

This file is kept as an archived planning note. The current source of truth is
[`development_plan.md`](development_plan.md), which tracks the implemented
stages and remaining portfolio publication work.

## Implemented MVP Scope

The local portfolio MVP now covers the complete demo flow:

```text
storefront -> product detail -> cart -> checkout -> mock payment -> order
-> inventory update -> admin management -> analytics dashboard
```

Completed locally:

- BI baseline preservation
- authentication and role-based access
- customer accounts and addresses
- catalog, categories, products, variants, and images
- inventory tracking and reservations
- persistent cart
- checkout and transactional order creation
- mock payment success/failure flow
- customer order history
- admin product, inventory, order, shipment, and refund workflows
- commerce event logging
- commerce analytics projection and dashboard metrics
- backend tests, smoke checks, frontend lint, and frontend build validation
- production configuration preparation

## Explicitly Not Implemented Yet

These items are roadmap work and must not be described as current behavior:

- coupons and promotions
- real payment provider integration
- tax calculation
- live shipping-rate providers
- email delivery provider
- object storage for uploaded product media
- public hosted deployment links and screenshots

## Remaining Stage 10 Portfolio Work

The repository is ready as a local portfolio project. To publish it as a public
portfolio demo, finish the unchecked Stage 10 items in
[`development_plan.md`](development_plan.md):

- deploy a managed database
- deploy the backend API
- deploy the frontend
- validate the public storefront, checkout, admin, and dashboard flows
- add screenshots
- add live links to the README
