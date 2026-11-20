# Testing

Three layers, all against real code and a real database. No fabricated results.

## Unit tests — `pnpm --filter @dayshift/api test`

Jest + ts-jest. Files: `apps/api/src/domain/*.spec.ts`.

Coverage:
- Pricing: subtotal/shipping/tax/total; free-shipping threshold after discount; best automatic promotion; minimum-spend rejection; coupon cap; coupon + promotion stacking; restricted eligible items; fixed coupon capping.
- Money: decimal parsing without drift, round-trip, malformed input rejection, shipping resolution.
- Order state machine: full fulfilment chain, skipped/backwards transitions rejected, terminal states, inventory-commit statuses.

Latest result: **3 suites, 18 tests, 18 passed** (pricing, order state/money, JSON-LD escaping).

## Integration suite — `node scripts/integration-test.mjs`

Runs against the live API, PostgreSQL and seed. Covers:

1. Staff and customer sessions.
2. Permission boundaries (`support` cannot manage staff or issue refunds).
3. Customer paid order → admin fulfils to `DELIVERED` (statuses + shipment events).
4. Customer return request → approve → receive → inspect → refund.
5. Refund reflected on order/payment.
6. Inspected return restocks inventory (+1).
7. Last-item concurrency: stock forced to 1, two simultaneous checkouts, exactly one success and one `409`.
8. Inventory restored.

Latest result: **18/18 checks passed** (plus exchange suite 8/8).

## API smoke — `node scripts/api-smoke.mjs`

24 checks through the public/admin API: catalogue and facets, guest cart, quote, login + cart merge, checkout + idempotency, sandbox payment, webhook HMAC + duplicate replay, admin dashboard, orders, audit, inventory, customers, low stock, returns, customer blocked from admin.

Latest result: **24/24 passed**.

## End-to-end — `pnpm --filter @dayshift/e2e test`

Playwright, Chromium, against `localhost:3000` and `localhost:3001`.

`storefront.spec.ts`
- Full guest purchase: browse → product → size L → quantity 3 → add to bag → cart → `DAYSHIFT15` → checkout → sandbox pay → confirmation with `DS-…` order number.
- Invalid coupon displays an inline error.
- Search results for “linen”.

`admin.spec.ts`
- Staff login, dashboard metrics, top products, recent orders, low stock.
- Products table and inventory table; adjust modal opens.
- Orders and returns lists with real records (including `RT-2026-000031`).
- System health and settings.

Run prerequisites: API, web and admin running; seed loaded. Config: `tests/e2e/playwright.config.ts`; screenshots are under `tests/e2e/shots`.

Latest result: **7/7 passed**.

## Build and static checks

| Check | Command | Result |
| --- | --- | --- |
| TypeScript (all) | `pnpm typecheck` | Pass |
| ESLint (flat config) | `pnpm lint` | Pass |
| API production build | `pnpm --filter @dayshift/api build` | Pass |
| Storefront production build | `pnpm --filter @dayshift/web build` | Pass |
| Admin production build | `pnpm --filter @dayshift/admin build` | Pass |
| Worker build | `pnpm --filter @dayshift/worker build` | Pass |
| Prisma validate/migrate | `pnpm db:migrate` | Pass |
| Seed | `pnpm db:seed` | Pass (40 products / 365 variants) |
| Docker Compose config | `docker compose config` | Pass |
| Application images | `docker compose --profile app build` | API, worker, web, admin built; full stack started together for the LAN release |
| Accessibility | `pnpm test:a11y` | 0 serious/critical on 6 surfaces |

## Not covered

- No load testing or Lighthouse run was executed; no performance numbers are claimed.
- Email delivery is verified by local `.eml` files and notification status, not a live SMTP server.
- Payment webhook tests exercise the sandbox provider, not a real processor.
- The full `app` compose profile was launched as one stack for the LAN release; all six containers and the HTTP endpoints were verified.
- Reservation expiry and daily reconciliation were not observed over their real time windows.

## Reproducing failure scenarios

- **Concurrent last item:** `node scripts/integration-test.mjs` (section “Last-item concurrency”).
- **Duplicate webhook:** `node scripts/api-smoke.mjs` replays the same signed event and asserts `duplicate:true`.
- **Expired reservation:** stop the API after creating an unpaid order; run the worker and wait 15 minutes, or shorten `COMMERCE.reservationMinutes` temporarily. The worker cancels the order and releases stock.
- **Coupon limits:** try `WELCOME10` on a second order for the same customer.
- **Unauthorized admin:** log in as `support@…` and call `/admin/staff` or a refund endpoint.
