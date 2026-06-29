# Changelog

All notable changes to DataPulse Commerce will be documented in this file.

## [Unreleased]

### Changed

- Consolidated current portfolio documentation in `docs/current_state.md`.
- Moved historical planning and build-history documents into `docs/archive/`.
- Updated architecture, testing, deployment, and support docs to match current checkout, payment, and E2E workflows.
- Removed unused demo/payment configuration variables from environment examples, Render config, and CI.
- Marked the production-like Docker Compose file as local validation only.

## [0.1.0] - 2026-06-29

### Added

- Public portfolio deployment on Vercel, Render, and Supabase.
- Storefront, product listing, product detail, cart, checkout, customer account, admin back office, and analytics dashboard.
- Mock payment provider flow for safe public checkout demos.
- Demo customer and admin credentials with login-page autofill buttons.
- README portfolio sections for recruiters and clients.
- Screenshot gallery for the deployed application.
- Case study, demo video script, and portfolio readiness checklist.
- GitHub Actions CI workflow for backend pytest, frontend lint, and frontend build.
- Minimal Playwright E2E test for customer login.
- MIT license.

### Fixed

- Cart persistence after add-to-cart navigation.
- Cart CTA contrast in the portfolio screenshot and cart UI.

### Known Limitations

- Payments are mocked.
- Product data is synthetic.
- Render free-tier hosting may cold start after inactivity.
- Real email, shipping-rate, tax, and payment provider integrations are not implemented yet.
