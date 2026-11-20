# Independent Audit Report — DAYSHIFT v1.0.0

**Audit date:** 20 November 2026
**Repository:** `E:\Code\DayShift`
**Branch:** `main`
**Original commit:** `4a48a7d` (`feat: DAYSHIFT fashion commerce and retail operations platform`)
**Existing tag:** `v1.0.0` (unchanged)
**Auditor mode:** independent verification; previous release report treated as unverified claims.

---

## 1. Executive summary

The repository is a genuine full-stack application, not a mock-up. Storefront, admin portal, API, PostgreSQL, Redis, worker and sandbox payments are implemented and run locally. The previous report was broadly accurate about scope but overstated Docker readiness and missed several material integrity defects.

The audit found **no P0 issues**, **six P1 issues** (financial state bypass, double-refund race, silent email queue failure, stored XSS in JSON-LD, broken Docker API entrypoint, direct return refund bypass) and several P2 issues. The P1 defects were reproduced where feasible and fixed. After remediation:

- Typecheck, lint, unit, integration, exchange, smoke, E2E and production builds pass.
- The Docker API, worker, storefront and admin images build and start; the three web-facing containers were exercised against a containerised API.
- Database integrity queries return zero anomalies.
- Dependency audit has no runtime high/critical findings; one high remains in a development-only lint dependency (`zod` through `eslint-plugin-react-hooks`).

**Release readiness: PORTFOLIO READY / DEMO READY. Not production ready.** See `PRODUCTION_READINESS.md`.

---

## 2. Scope and method

Inspected: Git state, workspace configuration, all app and package sources, Prisma schema/migrations, seed, Dockerfiles/Compose, CI, tests, scripts, environment files, logs, running containers and database state.

Executed: typecheck, lint, unit tests, integration/security probes, exchange workflow, API smoke, Playwright E2E, Axe accessibility scans, production builds, Prisma validation, database integrity SQL, Docker image builds and container health checks, dependency audit, YAML validation of CI.

No production systems were contacted. No paid services were used. No database was reset, dropped or migrated destructively. No real emails or payments were sent. Existing containers/volumes were preserved.

---

## 3. Architecture observed

```
apps/web       Next.js 15 storefront (the expected `apps/storefront` path does not exist)
apps/admin     Next.js 15 staff portal
apps/api       NestJS 11 modular monolith
apps/worker    BullMQ worker
packages/config, db, types, validation
```

Expected `packages/ui` does not exist; each frontend owns its component system (justified by different visual languages). No circular package dependency was found by inspection. `@dayshift/db` is server-only; browser apps use the API.

Authentication: opaque session cookie, SHA-256 token hash in PostgreSQL, global guard with explicit `@Public`, granular permission guard. Checkout: server-authoritative integer-cent pricing, conditional SQL reservation. Payment: sandbox adapter, HMAC-signed webhook, unique event id. Worker: email, reservation expiry, daily reconciliation.

Architecture documentation is accurate apart from the `storefront` path and missing `ui` package.

---

## 4. Previous claim verification

| Claim | Status | Evidence |
| --- | --- | --- |
| Full-stack application | **VERIFIED** | Four apps build; browser flows pass |
| Database integration | **VERIFIED** | Prisma validate, 2 migrations, seeded data, integrity SQL |
| Authentication | **VERIFIED** | Login/session/password tests; hashed tokens |
| Authorization / RBAC | **VERIFIED AFTER FIX** | Support denied staff/refund; customers blocked; manual-paid bypass fixed |
| Checkout | **VERIFIED** | E2E purchase and API integration |
| Inventory + concurrency | **VERIFIED** | Last-unit test 1 success / 1 conflict; zero negative stock |
| Sandbox payments | **VERIFIED** | Success, failure, duplicate and invalid-signature tests |
| Refunds | **VERIFIED AFTER FIX** | Concurrent refund now exactly once |
| Returns | **VERIFIED** | Full lifecycle to refund |
| Exchanges | **VERIFIED AFTER FIX** | 8/8 exchange checks; previous report marked unverified |
| Worker | **PARTIALLY VERIFIED** | Email and retry verified; expiry logic tested indirectly, not with a 15-minute wait; reconciliation schedule not observed |
| Docker | **VERIFIED AFTER FIX** | Images built, API/web/admin started, proxy health 200; worker image starts |
| CI/CD | **UNVERIFIED REMOTELY** | YAML parses and steps reviewed; not executed on GitHub |
| Testing claims | **VERIFIED / CORRECTED** | Previous 16/10/7 counts are now 18 unit / 18 integration / 8 exchange / 24 smoke / 7 E2E |
| Accessibility | **PARTIALLY VERIFIED** | Axe 0 serious/critical on six surfaces; manual screen-reader testing not performed |
| Production readiness | **NOT VERIFIED** | External providers, MFA, operational runbooks and load tests absent |

---

## 5. Findings

### P1 — Critical/High

**A1. Staff could mark an unpaid order as `PAID`**
- Root cause: `OrdersService.updateStatus` allowed any valid state-machine transition, including `PENDING_PAYMENT → PAID`, without payment capture or inventory commit.
- Reproduction: admin PATCH returned 200; order became `PAID`, payment stayed `PENDING`, no stock commit.
- Impact: financial and inventory records diverge; reports count unpaid sales.
- Fix: API rejects manual `PAID` and `PAYMENT_FAILED`; those states are provider/system-owned. Also rejects `DELIVERED` unless a shipment is delivered.
- Status: **FIXED**, integration check `staff cannot mark an unpaid order as paid` (422, payment pending).

**A2. Return could be set directly to `REFUNDED` without a refund**
- Root cause: return status endpoint accepted `INSPECTED → REFUNDED`; money was never moved.
- Impact: false refund state.
- Fix: `REFUNDED` is rejected on the status endpoint; only `POST /admin/returns/:id/refund` may set it.
- Status: **FIXED**, integration check returns 422.

**A3. Concurrent refunds could over-refund**
- Root cause: balance check occurred outside the write transaction (TOCTOU). Two simultaneous refunds could both pass. Duplicate return refunds had no idempotency check.
- Impact: refunds exceeding captured payment.
- Fix: `pg_advisory_xact_lock(hashtext(orderId))` inside the transaction, re-read/validate inside the lock, and reject a second processed refund for the same `returnRequestId`. Refund history now attributes the actor type correctly.
- Status: **FIXED**, integration sends two simultaneous refunds: exactly 1 success, 1 rejection.

**A4. Email jobs silently failed**
- Root cause: BullMQ rejects custom job ids containing `:`. Notification dedupe keys contain colons, so `email.send` enqueue failed and was only recovered later by `email.retry`.
- Evidence: API log `Could not enqueue email.send: Custom Id cannot contain :`.
- Impact: confirmation/reset/return emails delayed; reset links could be missed until retry.
- Fix: normalise job ids to `[A-Za-z0-9_-]`, truncate to 120 chars.
- Status: **FIXED**; worker logs show immediate `email.send` completion and `.eml` delivery.

**A5. Stored XSS through JSON-LD**
- Root cause: product name was interpolated with `JSON.stringify` into a `dangerouslySetInnerHTML` script tag. A name containing `</script>` could escape.
- Impact: admin-controlled product content could execute script for customers.
- Fix: shared `serializeJsonLd` escapes `<`, `>`, `&`, U+2028/U+2029. Unit test and live page check.
- Status: **FIXED**.

**A6. Docker images did not start reliably**
- Root cause: API runtime used `pnpm exec prisma`, but Prisma is not an API dependency and corepack attempted a network download; the Prisma engine was generated for the wrong OpenSSL target; web/admin rewrites pointed at localhost rather than the compose API.
- Fix: absolute Prisma CLI path and Node entrypoint; build- and runtime-stage OpenSSL; explicit `debian-openssl-3.0.x` binary target; local Next binaries for web/admin; `API_INTERNAL_URL` build arg.
- Status: **FIXED**, final API image health 200; worker image starts cleanly; web/admin images serve and proxy health 200.

### P2 — Medium

- **Return inspection was not atomic.** Restock/exchange ran after marking `INSPECTED`; a stock failure left a false inspected state. Fixed by running idempotent stock operations first; retry now safe.
- **Category cycles accepted.** Only self-parent was rejected. Fixed with ancestor walk; integration 422.
- **Guest first-order coupon only checked `userId`.** Fixed to check non-cancelled orders by guest email; integration 422 on reuse.
- **Accessibility:** 12 contrast failures and `aria-label` on a generic star span. Darkened muted token, added `role="img"`; Axe now 0 serious/critical on six surfaces.
- **Docker web/admin proxy build configuration** missing; fixed via build args and verified through container health.
- **CI rate limiting** would block integration+E2E; set `RATE_LIMIT_MAX=5000` for CI only and made migration step use `db:deploy`.
- **Dependencies:** nodemailer 6 vulnerable (multiple high advisories) → 10.1.4; postcss forced 8.5.33; zod 4.6.7; removed unused Prisma/HTTP deps.

### P3 / Informational

- 3 variants have `color = NULL`; PostgreSQL unique `(productId,size,color)` does not deduplicate NULLs. No duplicates currently exist. Add a partial unique index or normalise to a default colour before production.
- Loyalty points are not reversed on refund; coupon redemption is not restored on cancellation. Business policy must be decided.
- Cash on delivery has no “mark cash collected” action; payment remains `PENDING`.
- Return inspection now restocks before status commit, but exchange stock is not reserved at approval.
- Search full-text has no GIN index; fine at demo scale, add before growth.
- In-process throttling; move to Redis for multiple API replicas.
- No MFA, CSP, file uploads, multi-currency, jurisdiction tax or real providers.

---

## 6. Security assessment

- Authentication: strong password hashing, hashed revocable sessions, reset/verify tokens, login throttling, no enumeration on reset.
- Authorization: API-enforced RBAC; IDOR checks returned 404 for another customer’s order (guest and seeded). Support role correctly denied staff and refund endpoints.
- Webhooks: invalid and missing signatures return 401; duplicate events are idempotent.
- Input: DTO whitelist validation; raw SQL parameterised; admin-only image URL validation.
- Secrets: only `.env.example` tracked; no `.env` in history; values in example are local placeholders. No credential exposure found.
- Remaining: no MFA, in-process rate limiting, no CSP, sandbox payment only.

Full detail: `SECURITY_AUDIT_REPORT.md`.

---

## 7. Database assessment

- 2 migrations applied; schema validates.
- Integrity SQL: 0 negative stock, 0 `reserved > onHand`, 0 paid orders without paid payment, 0 refunds exceeding paid.
- Financial tables use restrictive deletion policies; snapshots immutable; money decimal/integer cents.
- Transactional gaps found (refund, inspection) were fixed.
- Index/constraint gap: nullable colour uniqueness (informational).

---

## 8. Frontend assessment

- Storefront and admin are responsive and visually coherent; all key routes returned 200.
- Product pages are dynamic to avoid stale price/stock.
- Accessibility scan: 0 serious/critical on home, product, cart, mobile home, admin login, admin dashboard.
- Minor gaps: no error boundary around admin pages; some hard-coded `localhost:3000` links in admin (“customer view”); demo credentials visible by design.

---

## 9. Infrastructure assessment

- `docker compose config` valid.
- API, worker, web and admin images build on `node:22-bookworm-slim`.
- API container health 200; storefront and admin containers serve pages and proxy `/api/v1/health` to the API container.
- Existing Postgres/Redis containers and volumes preserved.
- No nginx/TLS/monitoring included in this demo.

---

## 10. Release readiness

**PORTFOLIO READY and DEMO READY.** Not staging/production ready until external providers, MFA, operations and load verification are completed. See `PRODUCTION_READINESS.md`.
