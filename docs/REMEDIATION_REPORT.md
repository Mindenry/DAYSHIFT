# Remediation Report

All changes are uncommitted working-tree changes. No commit, tag, push or history rewrite was performed.

## Verified defects and fixes

### R1 — Manual `PAID` / `PAYMENT_FAILED` / `DELIVERED` transitions
**Root cause:** admin status endpoint accepted every state-machine transition regardless of the financial/shipment side effects.
**Files:** `apps/api/src/modules/orders/orders.service.ts`
**Fix:** reject manual `PAID` and `PAYMENT_FAILED`; require a shipment in `DELIVERED` state before marking the order delivered. Existing automated shipment events still drive normal fulfilment.
**Regression:** `scripts/integration-test.mjs` asserts 422 and payment remains `PENDING`.

### R2 — Direct return `REFUNDED`
**Root cause:** return status endpoint allowed `INSPECTED → REFUNDED` without calling the refund service.
**Files:** `apps/api/src/modules/orders/orders.service.ts`
**Fix:** return status cannot be set to `REFUNDED`; use the refund action.
**Regression:** integration asserts 422.

### R3 — Concurrent refund over-refund / duplicate return refund
**Root cause:** remaining-balance check outside the write transaction; no idempotency key for a return refund.
**Files:** `apps/api/src/modules/payments/payments.service.ts`, `apps/api/src/modules/orders/orders.service.ts`
**Fix:** transaction-scoped `pg_advisory_xact_lock(hashtext(orderId))`; re-read payments/refunds and validate inside the lock; reject a second processed refund for the same return; correct actor type on customer cancellation; random provider reference.
**Regression:** two concurrent return refunds produce 1 success and 1 rejection; order reflects refund.

### R4 — Return inspection ordering
**Root cause:** inspection status transaction committed before restock/exchange, so a stock failure left a false inspected state.
**Files:** `apps/api/src/modules/orders/orders.service.ts`
**Fix:** idempotent restock and exchange fulfilment run first; the status transaction follows. A retry can safely repeat both operations.
**Regression:** exchange workflow 8/8; refund return still restocks exactly once.

### R5 — BullMQ email jobs rejected
**Root cause:** job ids contained `:`, which BullMQ rejects; errors were caught and only surfaced in logs.
**Files:** `apps/api/src/queue/queue.module.ts`
**Fix:** normalise custom job ids and truncate.
**Regression:** verified worker log `email.send#email-return-status-...` completed and wrote `.eml` files.

### R6 — JSON-LD stored XSS
**Root cause:** product fields serialised with `JSON.stringify` into an HTML script tag without escaping.
**Files:** `packages/config/src/security.ts`, `packages/config/src/index.ts`, `apps/web/app/products/[slug]/page.tsx`, `apps/api/src/domain/json-ld.spec.ts`
**Fix:** shared `serializeJsonLd` escapes `<`, `>`, `&`, U+2028/U+2029.
**Regression:** 2 unit tests; integration creates a product with a malicious name and verifies the rendered page cannot break out of the tag.

### R7 — Category hierarchy cycles
**Root cause:** only self-parent rejected.
**Files:** `apps/api/src/modules/admin/admin-catalog.service.ts`
**Fix:** walk ancestors of the proposed parent; reject if the edited category is encountered.
**Regression:** integration asserts 422.

### R8 — Guest first-order coupon reuse
**Root cause:** first-order rule only applied to logged-in users.
**Files:** `apps/api/src/modules/pricing/pricing.service.ts`
**Fix:** for guests, count non-cancelled orders by email.
**Regression:** integration first order 201, second with same email 422.

### R9 — Docker runtime
**Root cause:** API runtime invoked `pnpm exec prisma`; Prisma is not an API package dependency and corepack tried to download pnpm. The Prisma engine was generated for the wrong OpenSSL target, web/admin rewrites were built with `localhost` instead of the compose API, and Prisma lacked OpenSSL.
**Files:** `infrastructure/docker/api.Dockerfile`, `worker.Dockerfile`, `web.Dockerfile`, `admin.Dockerfile`, `docker-compose.yml`, `packages/db/prisma/schema.prisma`
**Fix:** direct Prisma CLI path + Node entrypoint; build- and runtime-stage OpenSSL; explicit `debian-openssl-3.0.x` binary target; Next local binaries; `API_INTERNAL_URL` build arg.
**Regression:** final images build; API container health 200; web/admin containers serve and proxy health 200; worker starts with repeatable jobs scheduled.

### R10 — Accessibility
**Root cause:** muted token contrast below AA on paper-deep; `aria-label` on a generic span; low-contrast admin sidebar labels.
**Files:** `apps/web/app/globals.css`, `apps/admin/app/globals.css`, `apps/web/app/products/[slug]/page.tsx`, `apps/web/components/site-footer.tsx`, `apps/admin/app/login/page.tsx`, `apps/admin/components/sidebar.tsx`
**Fix:** darker muted token, removed opacity on small footer text, `role="img"` on star rating, higher-contrast sidebar labels.
**Regression:** Axe scan on six surfaces reports 0 serious/critical.

### R11 — Dependencies
**Files:** `apps/api/package.json` (removed unused nodemailer/zod), `apps/worker/package.json` (nodemailer ^10.1.4), `packages/validation/package.json` (zod ^4.6.7), root `package.json` (postcss/deepmerge/effect overrides), `pnpm-lock.yaml`.
**Result:** runtime high/critical advisories cleared. Remaining: one high in a dev lint dependency (`zod` via `eslint-plugin-react-hooks`) and two moderate CLI glob advisories.

### R12 — CI & test tooling
**Files:** `.github/workflows/ci.yml`, `scripts/integration-test.mjs`, `scripts/exchange-test.mjs`, `tests/e2e/a11y-scan.mjs`, `package.json`, `tests/e2e/package.json`.
**Changes:** `db:deploy`, worker build, exchange test, high CI test rate limit, invalid-signature checks, IDOR/manual-paid/coupon/cycle/XSS regression checks, exchange workflow, accessibility script and scripts.

## Files changed

See final `git status` section. New files:
- `packages/config/src/security.ts`
- `apps/api/src/domain/json-ld.spec.ts`
- `scripts/exchange-test.mjs`
- `tests/e2e/a11y-scan.mjs`
- all six audit documentation files.

No files were deleted except a temporary audit probe and a redundant web JSON-LD helper replaced by the shared config helper. No user data, migrations, containers or volumes were deleted.

## Remaining issues (not fixed)

- Loyalty clawback on refunds and coupon redemption restoration on cancellation are policy decisions.
- COD payment has no “cash collected” action.
- Null-colour variant uniqueness is not database-enforced.
- Exchange stock is checked but not reserved at approval.
- Search lacks a GIN index.
- No MFA, CSP, file uploads, multi-currency, real tax or production providers.
- CI has not run on GitHub. The full Docker `app` profile was launched together as part of the final LAN release.
