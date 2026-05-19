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
