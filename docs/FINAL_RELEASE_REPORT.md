# Final release report

**Project:** DAYSHIFT v1.0.0
**Date:** 20 November 2026
**Host:** Windows, Docker Desktop, LAN `192.168.1.107`
**Branch:** `main`
**Release commit:** `0464a2d` — pushed to `origin/main`
**Repository:** https://github.com/Mindenry/DAYSHIFT (private)
**Release tag:** `v1.0.0` (unchanged; still points at the original import commit `4a48a7d`)

## 1. Outcome

The full stack runs on the Windows host and is reachable from other devices on the same LAN:

| Surface | URL | Verified |
| --- | --- | --- |
| Storefront | http://192.168.1.107:3000 | 200 |
| Admin portal | http://192.168.1.107:3001 | 200 |
| API | http://192.168.1.107:4000/api/v1 | 200 |
| API health | http://192.168.1.107:4000/api/v1/health | `database up`, `redis up` |

Containers:

```
dayshift-postgres   healthy   127.0.0.1:5433->5432
dayshift-redis      healthy   127.0.0.1:6380->6379
dayshift-api        healthy   0.0.0.0:4000->4000
dayshift-worker     running   (no published port)
dayshift-web        running   0.0.0.0:3000->3000
dayshift-admin      running   0.0.0.0:3001->3001
```

PostgreSQL and Redis are bound to loopback on the host and are reachable only inside the Compose network. Application traffic between containers uses `postgres`, `redis` and `api` Docker DNS names.

## 2. Work completed in this phase

### LAN configuration
- `APP_URL`, `ADMIN_URL`, `API_URL` and `NEXT_PUBLIC_SITE_URL` set to `192.168.1.107`.
- `docker-compose.yml` publishes only 3000, 3001 and 4000 on all interfaces; PostgreSQL/Redis mappings changed to `127.0.0.1`.
- `COOKIE_SECURE` is now explicit. Cookies remain `Secure` by default in production and are disabled only when the operator sets `COOKIE_SECURE=false` for plain HTTP.
- Admin portal links ("view store", customer order view, storefront product view) use a build-time `NEXT_PUBLIC_SITE_URL` instead of hard-coded `localhost`.
- `RATE_LIMIT_TTL` and `RATE_LIMIT_MAX` are passed to the API container.
- Windows Firewall rules created for TCP 3000/3001/4000 on the **Private** profile with **LocalSubnet** scope.

### Defect found during cross-origin verification
- **Checkout crashed on the LAN IP.** `crypto.randomUUID()` is restricted to secure contexts, so it is undefined on `http://192.168.1.107` (plain HTTP, not localhost). The checkout page threw a client-side exception before rendering the form.
- Fixed with a UUID helper that falls back to `crypto.getRandomValues()` and preserves RFC 4122 shape. Storefront image rebuilt.
- Regression evidence: Playwright purchase journey now passes against the LAN URL (7/7).

### Operational tooling
Six PowerShell scripts were created and executed against the live stack:

| Script | Tested behaviour | Exit |
| --- | --- | --- |
| `scripts/deploy.ps1` | Starts/reuses the stack, waits for API health, refreshes firewall, verifies five URLs | 0 |
| `scripts/stop.ps1` | Stops app containers, leaves PostgreSQL/Redis running, reports status | 0 |
| `scripts/status.ps1` | Git state, containers, endpoints, firewall summary | 0 |
| `scripts/logs.ps1` | Tail/follow per service or all services | 0 |
| `scripts/health.ps1` | Strict container/HTTP/dependency checks, non-zero on failure | 0 |
| `scripts/backup.ps1` | `pg_dump -Fc` via container, copies out, SHA-256 checksum | 0 |

Backup produced `backups/dayshift-20261120-113454.dump` (0.31 MB) with a checksum. Backups are git-ignored.

### Documentation
- Root `README.md` rewritten with verified facts, screenshots, architecture, quick start, LAN/macOS instructions, testing, security and limitations.
- New: `docs/LAN_DEPLOYMENT.md`, `docs/DOCKER_DEPLOYMENT.md`, `docs/GITHUB_RELEASE.md`, this report.
- Screenshots captured from the running LAN deployment in `docs/screenshots/`.
- Existing audit, testing, security and readiness documents retained.

## 3. Verification results

| Check | Result |
| --- | --- |
| Typecheck | 12/12 tasks pass |
| Lint | 7/7 tasks pass |
| Unit tests | 3 suites, 18/18 |
| Integration (LAN API) | 18/18 |
| Exchange workflow (LAN API) | 8/8 |
| API smoke (LAN API) | 24/24 |
| Playwright E2E (LAN URLs) | 7/7 |
| Axe accessibility (6 surfaces) | 0 serious/critical |
| Production builds | API, worker, web, admin |
| Docker images | 4 application images built |
| Compose validation | `docker compose config --quiet` passes |
| API container health | 200, database and Redis up |
| Storefront/admin proxy health | 200 |
| Worker startup | repeatable jobs scheduled, ready |
| Database integrity | no negative stock, no reserved > on-hand, no paid order without payment, no over-refund |

The integration suite ran against `http://192.168.1.107:4000/api/v1` and the storefront XSS check ran against `http://192.168.1.107:3000`, so the LAN path is exercised, not just localhost.

## 4. Security posture

- No secret is committed. `.env`, `.env.local`, logs, mail files, backups and build output are ignored.
- PostgreSQL and Redis are no longer reachable from the LAN.
- Firewall rules are Private-only and LocalSubnet-only.
- Admin/API origins are restricted to the configured LAN URLs.
- `COOKIE_SECURE=false` is the single, documented, explicit exception for the plain-HTTP demo. Behind TLS it must be removed or set to `true`.
- The sandbox payment adapter still accepts no real card data.
- Residual risks are listed in [SECURITY_AUDIT_REPORT.md](SECURITY_AUDIT_REPORT.md) and [PRODUCTION_READINESS.md](PRODUCTION_READINESS.md).

## 5. Data and history preservation- Existing PostgreSQL and Redis volumes were reused, not recreated.
- No database reset, drop, truncate or destructive migration was run.
- No seed reset was run.
- No container image history, commit or tag was rewritten.
- `v1.0.0` remains on the original commit.

## 6. Known limitations

- A physical Mac was not available. macOS instructions are documented; cross-device sign-in, checkout and admin flows from macOS remain **pending verification**.
- Payments, shipping and email are sandbox/local.
- Product images are generated, not real merchandise.
- No MFA, CSP, multi-currency, tax engine, upload pipeline or real providers.
- The design targets a single host; there is no load balancer, CDN, managed database or observability stack.
- CI YAML is validated locally and has not run on GitHub.
- Plain HTTP on the LAN is suitable only for a trusted demo network.

## 7. Readiness

**DEMO READY** and **PORTFOLIO READY**.

Not **STAGING READY** or **PRODUCTION READY**: external providers, TLS, MFA, observability, load testing, restore drills and the cross-device macOS pass remain outstanding.

## 8. Next action

Run the documented macOS checklist from a physical Mac and record the result in this report, then terminate TLS in front of the two web ports and set `COOKIE_SECURE=true`.

## 9. Post-release storefront UX refresh

After the LAN release, the customer storefront was upgraded without changing the audited commerce backend:

- Self-hosted Bodoni Moda and Manrope typography (`@fontsource-variable`), refined palette and spacing.
- Mobile-first hero with full-bleed imagery, service strip, category tiles and FAQ.
- Rebuilt product cards, product detail with sticky mobile add-to-bag, cart free-delivery progress and sticky checkout, checkout with a fixed mobile submit bar, and a two-column account navigation.
- Fixed a real mobile defect: the menu and search overlays were rendered inside the header's `backdrop-filter` containing block and appeared transparent; they now render outside the header.
- Added a 320px regression audit (`pnpm test:mobile`) covering 11 routes, overlay scroll locks and a full mobile checkout.
- Added a complete SEO/AEO layer: per-page canonicals and social cards, a 1200×630 default social image, Organization/WebSite/Product/Breadcrumb/ItemList/FAQ structured data, a dynamic 112-URL sitemap, AI-crawler-aware robots rules and `/llms.txt`.

Verification after the refresh: typecheck 12/12, lint 7/7, unit 18/18, integration 18/18, exchange 8/8, smoke 24/24, Playwright 7/7, mobile audit 11 routes × 320/390, Axe 0 serious/critical on six surfaces, production builds pass, and the web image was rebuilt and served through `http://192.168.1.107:3000`. Design and SEO details are in [STOREFRONT_UX.md](STOREFRONT_UX.md).
