# System verification

**Date:** 20 November 2026
**Commit:** `c37267a` (verified working tree; admin image fix follows in the next commit)
**Environment:** Windows host, Docker Desktop, LAN `192.168.1.107`, Node 26, pnpm 10.34.9
**Mode:** read/write verification against the running stack, with isolated database checks.

This is the evidence record for the complete system check. It covers the storefront, admin portal, API, worker, database, security, SEO/AEO, operational scripts and a fresh-install seed.

## 1. Running services

```
dayshift-postgres   healthy   127.0.0.1:5433->5432
dayshift-redis      healthy   127.0.0.1:6380->6379
dayshift-api        healthy   0.0.0.0:4000->4000
dayshift-worker     running
dayshift-web        running   0.0.0.0:3000->3000
dayshift-admin      running   0.0.0.0:3001->3001
```

- `GET /api/v1/health` → 200, database and Redis `up`.
- `GET /api/v1/health/detailed` → queue `failed: 0`, `failedNotifications: 0`, uptime and memory reported.

## 2. Route matrix

### Storefront

31 public routes returned **200** in production:

```
/  /collections  /collections/new-arrivals  /collections/best-sellers  /collections/sale
/c/women  /c/men  /c/shoes  /c/bags  /c/accessories
/products/the-everyday-oversized-tee  /products/classic-sneaker
/search?q=linen  /cart  /checkout  /login  /register  /forgot-password
/support  /track  /about  /about/materials  /help/delivery-returns  /help/size-guide
/legal/privacy  /legal/terms
/sitemap.xml  /robots.txt  /llms.txt  /manifest.webmanifest  /og-default.png
```

`/.env` and `/.git/config` return **404**.

### Admin portal

Unauthenticated protected routes return **307 → /login**. With a valid staff session, all 25 pages return **200** with no failed resources:

```
/  /products  /products/new  /products/[id]  /categories  /collections  /brands
/inventory  /warehouses  /suppliers  /purchase-orders  /orders  /returns
/customers  /tickets  /reviews  /coupons  /promotions  /loyalty
/staff  /roles  /audit  /reports  /settings  /system
```

**Fix found and verified:** admin product thumbnails returned 404 because product photos live in the storefront image. Added `/images/products/*` and `/art/*` rewrites from admin to the storefront container, with `WEB_INTERNAL_URL` at build and runtime. `/products`, `/inventory`, `/orders` and `/returns` now report zero failed resources.

### Customer account

With a customer session, all eight pages return **200**:

```
/account  /account/orders  /account/returns  /account/wishlist
/account/addresses  /account/loyalty  /account/support  /account/settings
```

## 3. Functional tests

| Suite | Command | Result |
| --- | --- | --- |
| Unit | `pnpm --filter @dayshift/api test` | 18/18 |
| Integration | `node scripts/integration-test.mjs` | 18/18 |
| Exchange | `node scripts/exchange-test.mjs` | 8/8 |
| API smoke | `node scripts/api-smoke.mjs` | 24/24 |
| Browser E2E | `pnpm --filter @dayshift/e2e test` | 7/7 |
| Account/workflow | `node scripts/verify-workflows.mjs` | 19/19 |
| Mobile | `pnpm test:mobile` | 11 routes × 320/390 |
| Accessibility | `node tests/e2e/a11y-scan.mjs` | 0 serious/critical on 6 surfaces |

The new workflow suite verifies:

- registration, duplicate registration rejection, wrong-password rejection, session identity;
- address creation and listing;
- wishlist add and remove;
- review rejection before delivery, acceptance after delivery and public visibility after moderation;
- support ticket creation, customer reply, staff reply and resolution;
- paid order, loyalty award (155 points in the run);
- admin fulfilment to delivered with shipment events;
- IDOR rejection (another customer receives 404);
- customer cancellation with refund;
- account data export and notification listing.

## 4. Database integrity

Thirteen invariant checks returned **0 failures**:

| Check | Result |
| --- | --- |
| negative inventory | 0 |
| reserved > on-hand | 0 |
| paid order without paid payment | 0 |
| refunds exceed payments | 0 |
| refunded return without processed refund | 0 |
| active product without image | 0 |
| active variant without inventory | 0 |
| negative order total / subtotal | 0 |
| invalid order/cart quantity | 0 |
| empty image URL | 0 |
| active product still using placeholder art | 0 |

Observed data: 40 active products, 377 variants, 79 product images, 2 applied migrations, 0 pending notifications.

## 5. Fresh-install test (isolated database)

A disposable database was created, migrated and seeded, then dropped. The development database was not touched.

```
migrations applied: 2
seed: users 8, products 40, variants 365, orders 7, reviews 8
product images 79, photo images 79, placeholder art 0
active products without an image: 0
```

This proves the repository can be installed from scratch with the current seed and photography mapping. The temporary database was removed.

## 6. Worker and queue

- Repeatable jobs scheduled at boot.
- Email jobs processed immediately; `.eml` files written in file mode.
- Reservation expiry runs every minute and completes.
- Queue: waiting 0, active 0, delayed 3 (repeatables), **failed 0**.
- Failed notifications: 0.
- One historical failure (`email.retry` while PostgreSQL was starting) was retried and cleared; it was not a code defect.

## 7. Security checks

| Check | Result |
| --- | --- |
| `X-Content-Type-Options` on web/admin/API | `nosniff` |
| `X-Frame-Options` | web `SAMEORIGIN`, admin `DENY`, API `SAMEORIGIN` |
| `X-Powered-By` | absent |
| HSTS | API sends it; not effective over plain HTTP |
| Session cookie | `HttpOnly`, `SameSite=Lax`, `Path=/` |
| Secure flag | off only because `COOKIE_SECURE=false` for the HTTP LAN demo |
| CORS allowed origin | `http://192.168.1.107:3000`, credentials true |
| CORS disallowed origin | no allow-origin header |
| Webhook signatures | invalid and missing signatures return 401 |
| IDOR | another customer’s order returns 404 |
| Admin protection | unauth 401 API / 307 page |
| Secret scan | no private keys, cloud tokens or non-local database URLs tracked |

## 8. SEO / AEO checks

- JSON-LD valid on home, product, collection, category and support; 0 parse errors.
- Organization, WebSite + SearchAction, Product + Offer + ReturnPolicy + Shipping + Review, BreadcrumbList, ItemList and FAQPage present.
- Canonicals, Open Graph and Twitter cards present; product `og:image` resolves to the real photo.
- Dynamic sitemap: **112 URLs**, no audit/test products, sampled URLs return 200.
- `robots.txt`: private routes disallowed; GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot and OAI-SearchBot allowed.
- `/llms.txt` served as `text/plain`.
- `og-default.png` is 1200×630.

## 9. Operational scripts

| Script | Result |
| --- | --- |
| `health.ps1` | exit 0; containers, 5 URLs, database and Redis healthy |
| `status.ps1` | exit 0; branch, commit, containers, endpoints, firewall rules |
| `backup.ps1` | exit 0; 0.36 MB dump plus SHA-256 checksum |
| `deploy.ps1` | previously verified: build, health wait, firewall, HTTP checks |
| `stop.ps1` | previously verified: app stop leaves databases and volumes |
| `logs.ps1` | verified per-service tail |

Firewall rules remain **Private / LocalSubnet** on TCP 3000, 3001 and 4000.

## 10. Builds and repository

| Check | Result |
| --- | --- |
| Typecheck | 12/12 |
| Lint | 7/7 |
| Production build (all apps/packages) | pass |
| Docker Compose config | valid |
| Docker images | API, worker, web, admin built |
| Git working tree | clean before the verification artifacts; no secrets or dumps staged |
| Tag | `v1.0.0` unchanged at `4a48a7d` |

## 11. Known limitations

- A physical Mac was not available; macOS access is documented but not device-tested.
- Payments, shipping and email use sandbox/local adapters; no real provider is connected.
- Product photography is licensed stand-in imagery, not the actual demo inventory.
- No MFA, CSP, multi-currency, tax engine or file-upload pipeline.
- No load, soak or external penetration test; Axe is automated, not a manual screen-reader audit.
- Reservation expiry and daily reconciliation were not observed across their full real-time windows.
- CI is validated locally; it has not run on GitHub.
- The LAN demo runs plain HTTP; TLS and `COOKIE_SECURE=true` are required beyond a trusted network.

## Verdict

Every layer that can be exercised in this environment was exercised: public and private routes, all admin pages, all customer account pages, registration, support, fulfilment, reviews, loyalty, cancellation, refunds, exchanges, inventory integrity, worker queue, database invariants, a clean install, SEO/AEO endpoints, security headers, CORS, cookies and operational scripts.

**Current classification: DEMO READY and PORTFOLIO READY.** The remaining items are external integrations and environment-specific manual checks listed above, not unresolved application failures.
