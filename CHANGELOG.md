# Changelog

## v1.0.0 — 2026-11-20

Initial demonstration release of the DAYSHIFT fashion commerce and retail management platform.

### Storefront
- Editorial home page, announcement bar, mega navigation, mobile menu, predictive search overlay.
- Category, collection and search listing with URL-driven size/colour/price/availability filters, sorting, active chips and pagination.
- Product detail with colour/size variants, live stock, quantity, size guide, materials/care, reviews, related products and recently viewed.
- Guest and account cart with merging, coupons, server-authoritative estimates.
- Guest/account checkout, sandbox card payment, cash on delivery, confirmation and order lookup.
- Account overview, orders, order detail, returns/exchanges, wishlist, addresses, loyalty, support, settings and data export.
- SEO metadata, product/breadcrumb structured data, sitemap and robots policy.

### Commerce API
- Session authentication with bcrypt, revocable hashed sessions, password reset and email verification.
- Granular role/permission model with 39 permissions across 10 staff roles.
- Catalogue with 40 products, 365 variants, configurable categories, collections, brands and size guides.
- Central integer-cents pricing engine with automatic promotions, coupons, caps, thresholds and tax.
- Idempotent checkout, atomic multi-warehouse reservations, commits, releases and expiry.
- Sandbox payments with HMAC webhooks, duplicate-event protection, refunds and reconciliation.
- Controlled order state machine, fulfilment, shipments and tracking events.
- Return/exchange lifecycle with inspection-gated restocking and staff-only refunds.
- Reviews with verified-purchase checks and moderation; loyalty with tiering.
- Support tickets with internal notes, CRM notes/tags/segments, audit log.
- Admin APIs for all modules, dashboard metrics, reports and CSV export, health checks.

### Platform
- pnpm/Turborepo monorepo, shared config/types/validation/db packages.
- Prisma schema, two migrations, deterministic seed.
- BullMQ worker: email delivery/retry, reservation expiry, payment reconciliation.
- Redis cache for taxonomy/settings with admin invalidation.
- Docker Compose, multi-stage Dockerfiles, GitHub Actions CI.
- Jest unit tests, live integration suite, API smoke suite and Playwright E2E.
- Full architecture, database, API, security, testing, deployment, operations, workflow and environment documentation.

### Known limitations
- Payments are simulated; no production provider.
- Product imagery is generated/illustrative; replace before launch.
- Content editing and purchase-order creation are API-only surfaces.
- Conversion analytics unavailable and intentionally not fabricated.
- Docker full-stack build not verified in this session.
