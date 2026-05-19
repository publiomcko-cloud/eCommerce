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
