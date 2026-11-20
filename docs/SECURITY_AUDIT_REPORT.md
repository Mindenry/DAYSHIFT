# Security Audit Report

## Authentication

| Control | Status |
| --- | --- |
| bcrypt cost 12 | Verified |
| Session token hashed at rest (SHA-256) | Verified |
| HttpOnly / SameSite=Lax / Secure in production | Verified |
| 30-day expiry, per-session revocation | Verified |
| Password reset single-use, 1 hour | Verified |
| Email verification token single-use, 24 hours | Verified |
| Login throttling (IP + email/IP Redis counter) | Verified |
| Password change revokes other sessions | Verified |
| Account enumeration on reset | Avoided (`{sent:true}` always) |
| MFA | **Not implemented** |

## Authorization / RBAC / IDOR

- Global `SessionAuthGuard`; every route protected unless `@Public`.
- `PermissionsGuard` enforces 39 granular permissions on staff routes.
- Role matrix seeded for 10 roles; UI mirrors, API enforces.
- IDOR probes:
  - Customer B reading Customer A’s order → **404**.
  - Customer reading seeded Elena order → **404**.
  - Support staff reading staff administration → **403**.
  - Support staff issuing a refund → **403**.
- Fixed bypass: staff could transition an unpaid order to `PAID`; now 422.
- Guest order lookup requires order number **and** email and is rate-limited.

## Payment / webhook security

| Test | Result |
| --- | --- |
| Valid signed event | Accepted once |
| Duplicate event id | `{duplicate:true}`, no double stock/points |
| Missing signature | 401 |
| Invalid signature | 401 |
| Modified amount | 422 |
| Unknown payment reference | 404 |
| Concurrent duplicate return refund | 1 success / 1 rejection |
| Refund above remaining balance | Rejected |
| Direct return `REFUNDED` without refund | Rejected 422 |
| Manual unpaid → `PAID` | Rejected 422 |

HMAC is computed over the raw body captured before JSON parsing. Ownership is checked for sandbox confirmation. No real card data is accepted or stored.

## Input validation

- Global `ValidationPipe` whitelist/transform; nested DTO validation for addresses/items.
- Query limits on pagination and search terms; enum validation for statuses.
- Raw SQL uses `Prisma.sql` parameter binding; no string-concatenated user input.
- Image URLs restricted to local paths or HTTPS.
- Error filter returns stable codes and request IDs; no stack traces or SQL.

## Secrets

- Only `.env.example` is tracked. No `.env` in Git history.
- Example secrets are explicit local placeholders (`dev-only-…`), not usable production credentials.
- No credentials printed in logs during this audit.
- Demo passwords are documented by design in the demo UI and README.

## HTTP / browser

- Helmet on API; Next security headers (`nosniff`, frame, referrer, permissions).
- CORS restricted to storefront/admin origins with credentials.
- Origin allow-list on mutating requests; SameSite cookies.
- 1 MB body limit.
- No CSP yet (documented residual risk).
- Rate limiting is in-process; tested to return 429 under the default limit. CI/test uses a raised limit.

## Dependency audit (final)

`pnpm audit`:

- **0 critical, 0 low, 2 moderate, 1 high**
- High: `zod` memory exhaustion advisory, reached only through the dev dependency `eslint-plugin-react-hooks` (not runtime, not attacker-controlled schema).
- Moderate: `glob`/`minimatch` through `@nestjs/cli` (development build tooling).
- Runtime high advisories addressed: nodemailer upgraded to 10.1.4; API’s unused nodemailer and zod dependencies removed; postcss forced to 8.5.33; Prisma CLI transitive overrides updated and Prisma validated.

## Findings summary

| Severity | Found | Fixed | Open |
| --- | --- | --- | --- |
| CRITICAL | 0 | 0 | 0 |
| HIGH | 5 | 5 | 1 dev-only advisory |
| MEDIUM | 7 | 7 | policy/design items |
| LOW | 1 | 1 | 0 |

## Residual risks

1. No MFA for privileged staff.
2. No CSP; add nonce-based CSP at the proxy.
3. In-process throttling; use Redis for multi-replica API.
4. Sandbox payments only; no PCI provider.
5. No file upload pipeline or malware scanning.
6. Flat tax; no jurisdiction engine.
7. No certified penetration test or load test.
8. CI security job is advisory and has not executed remotely.

No claim of complete security is made. The application is suitable for local demo and portfolio review with demo data only.
