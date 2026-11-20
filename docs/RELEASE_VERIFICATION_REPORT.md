# Release Verification Report

## Version and repository

| Item | Value |
| --- | --- |
| Version | 1.0.0 (audited working tree) |
| Branch | `main` |
| Original commit | `4a48a7d` |
| Tag | `v1.0.0` (unchanged) |
| Commit status | **Changes uncommitted** (per instructions) |
| Environment | Windows, Node 26.13.0, pnpm 10.34.9, Docker 29.9.3 |
| Services | PostgreSQL 16 + Redis 7 containers healthy |

## Commands and results

| Verification | Command | Result |
| --- | --- | --- |
| Typecheck | `pnpm typecheck` | 12/12 tasks pass |
| Lint | `pnpm lint` | 7/7 tasks pass |
| Unit | `pnpm --filter @dayshift/api test` | 3 suites, 18 tests pass |
| Integration | `node scripts/integration-test.mjs` | 18/18 checks pass |
| Exchange | `node scripts/exchange-test.mjs` | 8/8 checks pass |
| Smoke | `node scripts/api-smoke.mjs` | 24/24 checks pass |
| E2E | `pnpm --filter @dayshift/e2e test` | 7/7 tests pass |
| Accessibility | `pnpm test:a11y` | 0 serious/critical on 6 surfaces |
| API build | `pnpm --filter @dayshift/api build` | Pass |
| Worker build | `pnpm --filter @dayshift/worker build` | Pass |
| Web build | `pnpm --filter @dayshift/web build` | Pass |
| Admin build | `pnpm --filter @dayshift/admin build` | Pass |
| Prisma | `prisma validate` | Valid |
| DB integrity | SQL checks | 0 anomalies |
| Dependency audit | `pnpm audit` | 1 high dev-only, 2 moderate dev-only, no runtime high/critical |
| Compose config | `docker compose config` | Valid |
| CI YAML | PyYAML parse | Valid (`verify`, `audit`) |

## Docker verification

Images built and exercised:

- `dayshift-api:latest` — started with PostgreSQL/Redis; `/api/v1/health` returned `ok`.
- `dayshift-web:latest` — served `/`, product page and `/api/v1/health` (proxy) with 200.
- `dayshift-admin:latest` — served `/login` and `/api/v1/health` with 200.
- `dayshift-worker:latest` — started, scheduled repeatable jobs and logged ready.

The API image runs migrations before starting. Test containers were removed; the existing Postgres/Redis containers and volumes were preserved. The complete `app` profile was subsequently started as one stack on the Windows LAN host and all six containers were health-checked.

## Database verification

```sql
negative_stock = 0
reserved_gt_onhand = 0
paid_order_without_paid_payment = 0
refunds_exceed_paid = 0
```

368 variants were observed before additional archived integration fixtures; the seed itself creates 40 products / 365 variants. Three null-colour variants exist with no duplicate `(productId, size)` combination. Two migrations applied.

## Known limitations

- Payments, shipping and email remain sandbox/local; no real providers.
- Product imagery is demonstration art/stock, not real inventory.
- MFA, CSP, file uploads, multi-currency and jurisdiction tax are absent.
- Reservation expiry and 24h reconciliation code paths were not observed across their full time windows.
- Loyalty clawback and coupon restoration on refund/cancel are policy decisions, not implemented.
- CI was not executed on GitHub.
- No load, penetration or full screen-reader audit.
- One high dependency advisory remains in development lint tooling.

## Readiness

**PORTFOLIO READY / DEMO READY.** Not production or staging ready until the production readiness checklist is met.
