# Portfolio Readiness — DataPulse Commerce

## Completed

- [x] Public frontend deployed on Vercel.
- [x] FastAPI backend deployed on Render.
- [x] PostgreSQL database hosted on Supabase.
- [x] Production migrations applied.
- [x] Demo seed data loaded.
- [x] Storefront, product listing, product detail, cart, checkout, account, admin, and analytics pages implemented.
- [x] Customer and admin demo credentials documented.
- [x] Mock payment mode used for safe public checkout.
- [x] README includes live links.
- [x] README includes screenshots.
- [x] README includes recruiter and client review guidance.
- [x] Case study document created.
- [x] Demo video script created.
- [x] Cart CTA contrast fixed.
- [x] Browser screenshots captured for portfolio review.
- [x] Minimal Playwright customer login test added.
- [x] GitHub Actions CI workflow added for backend pytest, frontend lint, and frontend build.
- [x] E2E strategy selected: manual GitHub Actions `workflow_dispatch` against the deployed demo.
- [x] README screenshot references verified against local files.
- [x] README public links verified to use deployed URLs.
- [x] Environment examples warn that real secrets must never be committed.
- [x] MIT license added.
- [x] Changelog added with the first public portfolio release.
- [x] Silent 60-120 second demo video recorded and converted to MP4.
- [x] Demo video link added to the README.
- [x] Publish the latest repository changes so the GitHub README can serve the demo video link.

## Pending

- [ ] Confirm the GitHub Actions CI badge resolves after the first workflow run.
- [ ] Run the manual E2E workflow after future deployment-sensitive changes.
- [ ] Add a custom domain if desired.
- [ ] Replace styled fallback product visuals with hosted product images if desired.
- [ ] Add sandbox payment provider integration if desired.
- [ ] Add real email, shipping-rate, tax, and promotion integrations if the project moves beyond portfolio demo scope.

## Review Checklist

- [x] Public frontend link opens.
- [x] Backend `/health` responds.
- [x] API docs open.
- [x] Products load.
- [x] Cart persists after add-to-cart.
- [x] Customer login works.
- [x] Minimal customer login E2E can run locally with `npm run test:e2e`.
- [x] Admin login works.
- [x] Dashboard loads.
- [x] README avoids production links pointing to localhost.
- [x] Known limitations are documented honestly.
- [x] Screenshot files referenced by README exist and are valid PNG images.
