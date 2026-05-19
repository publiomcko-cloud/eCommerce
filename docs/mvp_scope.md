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
