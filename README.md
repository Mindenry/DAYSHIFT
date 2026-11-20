# DAYSHIFT — Enterprise Fashion Commerce & Retail Management

**Everyday style. Your way.**

DAYSHIFT is a full-stack contemporary fashion retailer: a customer storefront, a staff operations portal, a modular commerce API, transactional inventory, sandbox payments, background processing and an auditable returns/refund workflow.

This repository is a working, locally runnable demonstration built as a production-shaped monorepo. It deliberately does **not** pretend to be a live store: payments are simulated, product imagery is illustrative studio art, and email is written to local files.

---

## What is included

| Area | Implemented |
| --- | --- |
| Storefront | Editorial home, mega navigation, category/collection/search listing with URL filters, product detail with colour/size variants, cart, wishlist, guest + account checkout, sandbox payment, order tracking, account dashboard, orders, returns, addresses, loyalty, support |
| Catalogue | Configurable category tree, collections, brands, products, colour/size variants, per-variant SKU/price, media, SEO, lifecycle states |
| Inventory | Multiple warehouses, on-hand/reserved/damaged/incoming, atomic reservations, timed expiry, auditable movements, transfers, low-stock alerts |
| Orders | Server-authoritative pricing, immutable snapshots, controlled status machine, fulfilment, shipments and tracking events |
| Payments | Sandbox provider, HMAC-signed webhooks, event idempotency, refunds, reconciliation |
| Returns | Request → review → approve → receive → inspect → refund / exchange, restocking only after inspection |
| Admin | Dashboard, products, categories, collections, brands, stock, warehouses, suppliers, purchase orders, orders, returns, customers, tickets, reviews, coupons, promotions, loyalty, staff, roles, audit log, reports, settings, system health |
| Platform | PostgreSQL + Prisma, Redis, BullMQ worker, structured errors, permission-guarded API, Swagger, tests, Docker, GitHub Actions |

Full module-by-module status and limitations: **[docs/RELEASE_REPORT.md](docs/RELEASE_REPORT.md)**.

---

## Technology

- **Storefront / Admin:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4
- **API:** NestJS 11, REST, Swagger/OpenAPI, class-validator
- **Data:** PostgreSQL 16, Prisma ORM, versioned migrations
- **Async:** Redis 7, BullMQ (email delivery, reservation expiry, reconciliation)
- **Monorepo:** pnpm workspaces + Turborepo
- **Testing:** Jest unit tests, Node integration suite, Playwright E2E
- **Infrastructure:** Docker Compose, multi-stage Dockerfiles, GitHub Actions

---

## Quick start

Prerequisites: Node 20+ (22 recommended), pnpm 10, Docker Desktop (or local PostgreSQL 16+ and Redis 7).

```bash
pnpm install
cp .env.example .env
node scripts/setup-env.mjs          # writes git-ignored env files for each app
docker compose up -d postgres redis
pnpm --filter @dayshift/db generate # Prisma client
pnpm build:packages
pnpm --filter @dayshift/db exec prisma migrate dev
pnpm db:seed                        # 40 products, 365 variants, demo orders/returns
pnpm dev
```

| Service | URL |
| --- | --- |
| Storefront | http://localhost:3000 |
| Admin portal | http://localhost:3001 |
| API | http://localhost:4000/api/v1 |
| Swagger (dev only) | http://localhost:4000/api/docs |
| PostgreSQL | localhost:5433 (Docker) |
| Redis | localhost:6380 (Docker) |

`pnpm dev` runs API, storefront, admin and worker together. The worker is required for emails and reservation expiry.

To run apps individually: `pnpm dev:api`, `pnpm dev:web`, `pnpm dev:admin`, `pnpm dev:worker`.

---

## Demo accounts

All accounts use `.example` emails and local-only passwords. Demo data is seeded; no production credentials exist.

| Role | Email | Password |
| --- | --- | --- |
| Customer (Gold, orders/returns) | `customer@dayshift.example` | `Customer1234!Pass` |
| Customer | `james@example.com` | `Customer1234!Pass` |
| Customer | `nora@example.com` | `Customer1234!Pass` |
| Super admin | `admin@dayshift.example` | `Admin1234!Pass` |
| Store manager | `manager@dayshift.example` | `Manager1234!Pass` |
| Warehouse staff | `warehouse@dayshift.example` | `Warehouse1234!Pass` |
| Customer support | `support@dayshift.example` | `Support1234!Pass` |
| Analyst | `analyst@dayshift.example` | `Analyst1234!Pass` |

Coupons: `WELCOME10` (first order), `DAYSHIFT15` (15% over $120), `STYLE20` (sale collection), `FLAT25` ($25 over $150).

### Guided demo (10 minutes)

1. Storefront → New Arrivals → product → choose colour/size → add to bag.
2. Cart → apply `DAYSHIFT15` → checkout as guest with any `.example` email.
3. Pay with the sandbox card (`4242…`) → confirmation → `/track` lookup.
4. Admin (`admin@…`) → Orders → open the new order → advance status → create shipment → add tracking events.
5. Inventory → adjust stock → Movement history shows the audit trail.
6. Returns → open `RT-2026-000031` → approve → receive → inspect → refund.
7. Warehouse login sees fulfilment/inventory but not staff or refund permissions.

---

## Repository layout

```
apps/
  api/        NestJS commerce API (Swagger, guards, modules)
  web/        Next.js storefront
  admin/      Next.js operations portal
  worker/     BullMQ background worker
packages/
  db/         Prisma schema, migrations, seed, shared reservation logic
  config/     Permissions, order state machine, pricing/shipping/return constants
  types/      Shared API contract types
  validation/ Shared Zod schemas
prisma/       (schema lives in packages/db/prisma)
tests/e2e/    Playwright configuration, specs and screenshots
scripts/      env setup, art generation, API smoke, integration, backup/restore
docs/         architecture, database, API, security, testing, operations, workflows
infrastructure/docker/  Dockerfiles, Postgres init
.github/workflows/      CI
```

---

## Quality commands

```bash
pnpm typecheck                  # all apps and packages
pnpm lint                       # ESLint (flat config)
pnpm test                       # API unit tests (pricing, state machine, money)
pnpm --filter @dayshift/api build
pnpm --filter @dayshift/web build
pnpm --filter @dayshift/admin build
node scripts/api-smoke.mjs      # live API smoke (24 checks)
node scripts/integration-test.mjs # return lifecycle, concurrency, permissions
pnpm --filter @dayshift/e2e test # Playwright purchase + admin flows
```

**Verified in this environment:** typecheck ✓, lint ✓, API Jest 16/16 ✓, API/web/admin production builds ✓, integration 10/10 ✓, smoke 24/24 ✓, Playwright 7/7 ✓. See [TESTING.md](docs/TESTING.md) for exact results and known gaps.

---

## Useful scripts

| Command | Purpose |
| --- | --- |
| `pnpm db:migrate` | Create/apply a development migration |
| `pnpm db:deploy` | Apply committed migrations (deploy) |
| `pnpm db:seed` | Seed demo catalogue (safe; refuses to overwrite unless `SEED_RESET=1`) |
| `pnpm db:backup` | `pg_dump` the Docker database into `backups/` |
| `node scripts/db-restore.mjs <file> --yes` | Restore a dump (destructive, explicit flag required) |
| `node scripts/setup-env.mjs` | Regenerate per-app env files from `.env` |
| `node scripts/generate-product-art.mjs` | Regenerate 546 studio illustrations |
| `pnpm format` | Prettier |

---

## Honest limitations

- **Payments are simulated.** The sandbox provider never contacts a card network. Do not enter real card data.
- **Product images are generated studio illustrations**, not photographs of real inventory. Replace `/art/*` and `/images/*` with licensed photography before launch.
- **No real email/SMS provider.** Emails are written to `apps/worker/.mail` unless `MAIL_MODE=smtp` is configured.
- **No analytics traffic provider**, so conversion is reported as `null` rather than invented.
- **Single-currency (USD)** demo; tax is a flat configurable estimate, not jurisdiction-aware.
- The admin portal manages content through the API/seed; there is no dedicated content-block editor page yet.
- Purchase-order creation is API-only; receiving is available in the UI.
- Loyalty redemption is API-backed; the customer-facing redeem control is not exposed yet.

These are documented in the release report rather than hidden.

---

## License

Demonstration project. Third-party editorial photographs are used under the Unsplash License (see `docs/ENVIRONMENT.md`). Studio illustrations are original generated assets for this project.
