# DataPulse Commerce Design Plan

## 1. Purpose

This document records the ecommerce redesign work for DataPulse Commerce. The
customer-facing pages were reshaped so a portfolio reviewer can immediately
understand this as a commerce product, not only as a BI/admin system with a
store attached.

The plan focused on redesigning the storefront and checkout experience first.
Admin and analytics pages should remain operational, dense, and useful, but they
should not drive the first impression of the product.

## 2. Design Goal

Make DataPulse Commerce feel like a credible modern online store:

- product-first
- image-led
- easy to browse
- clear about price, stock, variants, cart, and checkout
- polished enough for a public portfolio
- still honest about demo mode and mock payments

The desired first impression:

```text
This is a real e-commerce platform with a built-in analytics and admin layer.
```

Not:

```text
This is a dashboard project with some commerce endpoints.
```

## 3. Design Principles

- Storefront pages should look customer-facing, visual, and product-driven.
- Admin pages should look work-focused, compact, and operational.
- Analytics pages should look like business intelligence, but with commerce
  metrics clearly connected to orders, revenue, inventory, and payments.
- The customer path must be obvious: browse, view product, add to cart, checkout,
  confirmation.
- Page content should be useful, not explanatory documentation inside the UI.
- Product images should be prominent and stable in layout.
- Buttons should use clear e-commerce actions such as `Add to cart`, `Checkout`,
  `View order`, and `Continue shopping`.
- Demo mode should be visible where payment or admin safety matters, but it
  should not dominate the storefront.

## 4. Main Problems To Fix

Issues this redesign addressed:

- The homepage does not read strongly enough as a store.
- Product presentation needs stronger image, price, and action hierarchy.
- Product cards need more commerce conventions: price, badge, stock state,
  category, and clear call to action.
- Product detail pages need a more complete buying surface.
- Cart and checkout should feel like a guided purchase flow.
- Account/order pages need more customer-commerce framing.
- Admin and dashboard visual language should be distinct from the storefront.
- Placeholder assets should be replaced or styled so the catalog feels more
  intentional.

## 5. Target Page Structure

## 5.1 Storefront Home

Goal: the first screen must immediately feel like an e-commerce store.

Required changes:

- Add a product-led hero area with store identity, featured product/category, and
  shopping CTA.
- Show featured categories near the top.
- Show featured products above the fold or immediately after the hero.
- Add product cards with image, category, name, price, stock/availability, and
  `Add to cart` or `View product`.
- Include trust/store signals such as safe demo checkout, inventory-backed
  orders, and mock payment safety in a restrained way.
- Avoid making the first screen feel like a technical dashboard or documentation
  page.

Acceptance criteria:

- A reviewer can identify the app as an e-commerce store within 3 seconds.
- The first viewport includes product or category content.
- The main CTA leads to shopping, not analytics or admin.

Implementation status:

- [x] `/` now renders a storefront home instead of the analytics dashboard.
- [x] Analytics moved to `/dashboard`.
- [x] Header branding updated from DataPulse BI to DataPulse Commerce.
- [x] First viewport includes product-led hero, featured product, store stats,
  and shopping CTAs.
- [x] Homepage includes category tiles and featured product cards.

## 5.2 Product Listing Page

Goal: make browsing products feel natural and useful.

Required changes:

- Add category/filter/search layout suitable for a small catalog.
- Improve product grid spacing and responsiveness.
- Use consistent product image ratios.
- Make price visually prominent.
- Show category and stock state.
- Add quick actions where appropriate.
- Preserve accessible links to product detail pages.

Acceptance criteria:

- Product cards scan clearly on desktop and mobile.
- The user can search/filter without losing context.
- Product price and primary action are easy to find.

Implementation status:

- [x] Product listing redesigned as a shopper-facing catalog page.
- [x] Homepage category links open filtered product listing pages.
- [x] Added department, search, and availability filters.
- [x] Replaced stage/admin language with customer catalog language.
- [x] Product cards now emphasize image, category, stock, price, variants, and
  `View product`.

## 5.3 Product Detail Page

Goal: create a convincing product purchase page.

Required changes:

- Add a larger product media area.
- Add breadcrumbs or category context.
- Show title, brand/category, price, stock state, description, variants, quantity,
  and add-to-cart action.
- Add secondary commerce details: shipping estimate placeholder, return/demo
  safety note, SKU/variant metadata.
- Keep the buying panel stable and readable.

Acceptance criteria:

- The page clearly answers: what is it, how much is it, is it available, and how
  do I buy it?
- Variant and quantity controls are obvious.
- The add-to-cart action is visually dominant.

Implementation status:

- [x] Product detail redesigned around a sticky buying panel.
- [x] Added breadcrumb/category context.
- [x] Added larger product media area and thumbnail gallery support.
- [x] Variant selector now shows SKU, attributes, price, and availability.
- [x] Quantity control uses stepper buttons plus numeric input.
- [x] Add-to-cart, view-cart, and continue-shopping actions are clear.
- [x] Added safe demo checkout and inventory-backed order notes.

## 5.4 Cart Page

Goal: make the cart feel like a real purchase checkpoint.

Required changes:

- Separate cart items and order summary clearly.
- Show item image, name, variant, unit price, quantity controls, line total, and
  remove action.
- Make checkout CTA visually dominant.
- Add continue-shopping action.
- Keep totals clear and server-backed.
- Avoid coupon UI until coupon support is implemented.

Acceptance criteria:

- The user can understand and modify the cart quickly.
- Checkout action is always easy to find.
- No UI suggests unsupported coupon/promotion behavior.

Implementation status:

- [x] Cart redesigned as a purchase checkpoint.
- [x] Cart item rows show image, product, variant, SKU, unit price, line total,
  quantity controls, stock state, and remove action.
- [x] Order summary is visually separated and keeps the checkout action dominant.
- [x] Empty cart state now points customers back to shopping.
- [x] No coupon/promotion UI is shown.

## 5.5 Checkout Page

Goal: make checkout feel guided, safe, and demo-aware.

Required changes:

- Structure checkout into clear sections: contact/account, address, payment demo,
  order summary.
- Show mock payment clearly and safely.
- Keep order summary visible and readable.
- Make final placement action clear.
- Improve form spacing and field grouping.

Acceptance criteria:

- The user understands no real card data is required.
- Required fields and order summary are clear.
- The checkout flow feels intentional, not like a raw form.

Implementation status:

- [x] Checkout redesigned as a guided flow with contact, shipping, billing,
  payment, and order summary sections.
- [x] Mock payment is clearly labeled and safe.
- [x] Order summary remains visible on desktop.
- [x] Form fields are grouped and spaced for customer checkout.
- [x] Final action is now `Place demo order`.

## 5.6 Order Confirmation

Goal: make the purchase completion feel complete and credible.

Required changes:

- Add clear success state.
- Show order number, payment state, items, totals, and next actions.
- Add links to account orders and continue shopping.
- Make mock payment/demo status explicit but not alarming.

Acceptance criteria:

- The user knows the order was created.
- The user can continue shopping or inspect the order.

Implementation status:

- [x] Order confirmation redesigned as a receipt-style page.
- [x] Success state, order number, order status, timestamps, items, totals,
  shipping, and billing snapshots are visible.
- [x] Payment simulation is grouped into a clear mock payment panel.
- [x] Added next actions for continuing shopping and viewing account orders.

## 5.7 Login And Register

Goal: make auth pages feel like part of the store.

Required changes:

- Use store branding and customer-friendly copy.
- Make forms compact and focused.
- Provide clear movement between login/register.
- Avoid making auth feel like an admin-only system.

Acceptance criteria:

- Customer account creation feels natural from checkout or account access.

Implementation status:

- [x] Login redesigned as a customer account entry page.
- [x] Register redesigned as a customer storefront signup page.
- [x] Removed stage/roadmap language from auth pages.
- [x] Auth pages now explain saved cart, demo checkout, and order history in
  customer-facing language.

## 5.8 Account And Orders

Goal: make customer account pages feel like commerce self-service.

Required changes:

- Add account overview with profile, saved addresses, and recent orders.
- Improve order list cards/table for customer readability.
- Improve order detail with item summaries, payment status, and shipment/refund
  state when available.

Acceptance criteria:

- Customers can understand their order history without admin terminology.

Implementation status:

- [x] Account page redesigned as customer self-service.
- [x] Added customer-facing account stats and shopping/cart actions.
- [x] Address management copy now focuses on checkout use.
- [x] Order history and order detail use customer language instead of API or
  ownership terminology.

## 5.9 Admin Pages

Goal: keep admin pages efficient, but visually separate from storefront.

Required changes:

- Keep dense operational layouts.
- Improve table readability, filters, status badges, and action placement.
- Do not make admin pages decorative or marketing-like.
- Preserve clear product, inventory, order, shipment, and refund workflows.

Acceptance criteria:

- Admin pages feel like a back office, not a storefront.
- Admin actions remain fast to scan and use.

Implementation status:

- [x] Admin dashboard, orders, products, and inventory pages received a
  restrained back-office polish.
- [x] Removed stage/roadmap language from primary admin surfaces.
- [x] Replaced decorative storefront styling with bordered operational panels.
- [x] Kept filters, status badges, metrics, tables/cards, and actions optimized
  for scanning.

## 5.10 Analytics Dashboard

Goal: make dashboard feel like commerce intelligence.

Required changes:

- Keep BI layout, but emphasize commerce metrics: GMV, orders, conversion,
  payment health, cart abandonment, inventory risk.
- Add clearer labels that connect metrics to commerce operations.
- Keep charts readable and not visually competing with storefront pages.

Acceptance criteria:

- Dashboard reads as the analytics layer of the store.

Implementation status:

- [x] Dashboard hero now frames the page as commerce intelligence.
- [x] Commerce metrics now lead the dashboard: paid GMV, payment success, cart
  abandonment, and inventory risk.
- [x] Legacy BI summary metrics remain visible as supporting analytical context.
- [x] Pipeline status remains available as operational data freshness context.
- [x] Chart and filter surfaces now match the redesigned commerce/back-office
  visual system.

## 5.11 Navigation And Flow Refinement

Goal: make the redesigned pages feel like one coherent e-commerce product with
clear shopping, account, admin, and analytics paths.

Required changes:

- make the customer purchase path obvious
- keep admin and analytics accessible without distracting from shopping
- reduce dead-end pages and confusing route order
- make navigation reflect user state: guest, customer, and admin
- remove development/test-only routes from customer navigation
- ensure every major page has a logical next action

## 5.11.1 Navigation structure

Primary customer navigation should prioritize:

- Store
- Products
- Cart
- Account or Login

Analytics should be secondary unless the user is an admin or the portfolio demo
needs to expose it.

Admin-only navigation should prioritize:

- Admin overview
- Products
- Orders
- Inventory
- Analytics

Recommended header behavior:

- Guest: Store, Products, Cart, Login, Register
- Customer: Store, Products, Cart, Account, Logout
- Admin: Store, Products, Cart, Account, Admin, Analytics, Logout

## 5.11.2 Customer flow

Main shopping sequence:

1. Home
2. Products
3. Product detail
4. Cart
5. Login/Register if needed
6. Checkout
7. Order confirmation
8. Account orders
9. Continue shopping

Refinements:

- Product detail `Add to cart` should offer `View cart` and `Continue shopping`.
- Cart should always show `Continue shopping`.
- Checkout should offer `Back to cart`.
- Confirmation should offer `Continue shopping` and `View account orders`.
- Account order history should link back to product pages and shopping.

## 5.11.3 Admin flow

Main admin sequence:

1. Admin overview
2. Admin products
3. Product editor
4. Admin inventory
5. Admin orders
6. Admin order detail
7. Dashboard analytics

Refinements:

- Admin pages should include a compact admin subnav.
- Admin overview should be the hub.
- Admin order detail should link back to orders.
- Admin product editor should link back to product list.
- Inventory should link to related product records where practical.

## 5.11.4 Analytics flow

Analytics should be secondary to the storefront.

Recommended behavior:

- Link analytics from admin and from the header for admin users.
- Let portfolio/demo users reach analytics without making it the homepage.
- Dashboard should link to admin orders, admin inventory, products, and API docs.

## 5.11.5 Route cleanup review

Review whether these routes still belong in primary UI:

- `/orders/new`
- `/dashboard`
- `/admin/products/new`
- `/checkout/confirmation/[orderId]`

Likely refinement:

- Remove `/orders/new` from main navigation permanently.
- Keep `/dashboard`, but do not make it primary for guests.
- Keep admin create/edit pages reachable only from admin product pages.
- Keep confirmation reachable from checkout and account order links.

## 5.11.6 Header improvements

Required changes:

- add clear cart count badge
- improve active section clarity
- show admin links only to admins
- make mobile nav compact and readable
- keep store name as the home link
- add compact admin subnav inside `/admin` routes

Avoid:

- too many top-level links
- mixing test/demo tools into customer nav
- showing admin links to non-admin users

## 5.11.7 Footer or utility links

Add a simple footer or utility link area with:

- Store
- Products
- Cart
- Account
- Admin
- Analytics
- Demo safety note

The footer should stay small and practical.

Acceptance criteria:

- A guest can go from home to checkout without confusion.
- A customer can find cart, account, and orders easily.
- Admin pages are grouped as an operational area.
- Analytics feels connected but secondary.
- No development/test-only route appears in customer navigation.
- Every major page has a logical next action.

Implementation status:

- [x] Header navigation now changes by user state: guest, customer, and admin.
- [x] Cart count is shown as a compact badge.
- [x] Analytics is secondary and only appears in the main/header/footer
  navigation for admin users.
- [x] Admin routes include a compact admin subnav for overview, orders,
  products, inventory, and analytics.
- [x] `/orders/new` is not exposed in customer navigation.
- [x] Product detail now includes continue-shopping and cart next actions.
- [x] A practical footer adds utility links and a demo safety note.

## 6. Visual Direction

Recommended direction:

- Modern retail SaaS/storefront hybrid.
- Clean white or near-white storefront background.
- Strong product imagery.
- Neutral text with clear accent colors for actions and statuses.
- Avoid a one-color dashboard-like palette.
- Use badges sparingly for stock, demo mode, new/featured, and status.
- Use consistent card sizing and product image ratios.
- Keep border radius modest and consistent.

Avoid:

- BI dashboard styling on storefront pages.
- Large explanatory text blocks.
- Placeholder SVGs as the dominant product identity.
- Unsupported coupon/promotion UI.
- Overly decorative gradients or abstract backgrounds.
- Nested cards and heavy visual containers.

## 7. Component Work

Components likely to create or redesign:

- storefront header
- storefront footer
- product card
- category tile
- product gallery
- variant selector
- quantity stepper
- cart item row
- order summary panel
- checkout section layout
- status badge
- empty state
- account order card
- admin status/filter controls

## 8. Asset Work

The current placeholder product images should be improved.

Options:

- add generated product images to the frontend public assets
- use consistent styled product placeholders as a temporary portfolio-safe option
- assign each demo product a meaningful image

Acceptance criteria:

- Product images look intentional.
- Image dimensions do not cause layout shift.
- Product cards and detail media are visually consistent.

Implementation status:

- [x] Added a reusable product visual fallback for seeded demo products.
- [x] Generic framework SVG seed images no longer appear as product visuals in
  storefront, listing, detail, or cart views.
- [x] Product visuals use stable aspect-ratio containers across cards, detail
  media, and cart items.

## 9. Responsive Requirements

Every redesigned page must be checked at:

- mobile width
- tablet width
- desktop width

Required behavior:

- no text overflow in buttons, cards, or panels
- product grid adapts cleanly
- cart and checkout remain usable on mobile
- sticky or side summaries do not overlap content
- controls remain large enough to tap

Implementation status:

- [x] Layouts use responsive grids and constrained button/card dimensions.
- [x] Frontend lint and production build pass after the redesign.
- [ ] Final public mobile/tablet/desktop screenshot QA remains pending until
  the hosted portfolio URL exists.

## 10. Implementation Order

Recommended order:

1. Define storefront visual system: colors, spacing, buttons, badges, product
   image ratios, and layout constraints.
2. Redesign storefront home.
3. Redesign product listing and product cards.
4. Redesign product detail and add-to-cart area.
5. Redesign cart.
6. Redesign checkout.
7. Redesign order confirmation.
8. Polish login/register.
9. Polish account/orders.
10. Polish admin pages.
11. Polish analytics dashboard.
12. Add screenshots for README after the design is stable.

## 11. Validation Checklist

Before considering the redesign complete:

- [x] storefront first viewport clearly reads as e-commerce
- [x] product listing looks like a real catalog
- [x] product detail has a complete buying panel
- [x] cart has clear totals and checkout action
- [x] checkout clearly communicates mock payment
- [x] account/order pages are customer-friendly
- [x] admin pages remain operational
- [x] dashboard still loads commerce metrics
- [x] frontend lint passes
- [x] frontend build passes
- [x] backend tests still pass if API contracts are touched
- [ ] screenshots are refreshed for portfolio use after deployment

## 12. Portfolio Acceptance Criteria

The design stage is complete when:

- [x] a reviewer can understand the store without reading docs
- [x] the customer flow feels polished from home to order confirmation
- [x] admin and analytics look like supporting professional systems
- [x] no page advertises unsupported features
- [x] the app is visually credible enough for screenshots and a public demo link
- [ ] public screenshots and live demo link are still pending deployment
