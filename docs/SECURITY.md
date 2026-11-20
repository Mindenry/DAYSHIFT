# Security

This is a security-conscious demonstration, not a certified production system. Controls below are implemented; residual risks are listed honestly.

## Implemented controls

### Authentication and sessions
- bcrypt (cost 12) password hashing; minimum 10 characters with mixed case and a number.
- Opaque 32-byte session tokens stored only as SHA-256 hashes; individually revocable, 30-day expiry, httpOnly, SameSite=Lax, `Secure` in production.
- Password reset and email verification tokens are single-use, hashed and time-limited (1h / 24h).
- Password change revokes all other sessions.
- Login throttling at the IP level and per-email/IP failure counters in Redis (6 failures / 15 min).
- Account enumeration avoided: forgot-password always returns `{sent:true}`.

### Authorization
- Every API route is protected by a global guard; public routes must be explicitly marked.
- Staff endpoints use granular permissions (`products.update`, `refunds.approve`, `staff.manage`, ...).
- Customer resources are always queried with `userId`; admin lists require staff and the relevant permission.
- The admin UI hides unavailable navigation/actions, but the API is the enforcement point.
- Tested: support staff receives `403` for staff management and refunds; customers receive `403` for admin APIs.

### Input and data safety
- DTO validation with class-validator (`whitelist`, transformation, nested validation).
- Prisma parameterised queries. The few raw SQL statements use `Prisma.sql` bindings, never string concatenation of user input.
- Output escaping in email templates; React escapes storefront text.
- File uploads are intentionally not accepted. Image fields accept only local paths or HTTPS URLs, and URLs are validated.
- Error responses never include stack traces, SQL or secrets.

### CSRF and CORS
- State-changing browser requests are checked against an Origin allow-list (`APP_URL`, `ADMIN_URL`).
- CORS is restricted to those origins with credentials and a small header allow-list.
- Webhooks are server-to-server, have no Origin, and are protected by HMAC-SHA256 over the raw body.

### Payments and idempotency
- The client never supplies prices or totals.
- Checkout requires an idempotency key; a replay returns the same order.
- Payment webhook events are unique by `eventId`; replays cannot double-deduct stock or double-award loyalty.
- Sandbox confirmation verifies ownership (session user or order email) and that the payment provider is sandbox.
- Refund amount is capped by paid amount minus previous refunds; refunds are staff-only and audited.

### Inventory integrity
- Conditional SQL updates guard reservations and commits; overselling is prevented by the database, not the UI.
- Verified: two simultaneous checkouts for the last unit produce exactly one success and one `409`.
- Reservations expire and orders are cancelled by the worker; duplicates are safe.
- Every stock change creates an audit movement with actor/reference.

### Infrastructure and operations
- Helmet security headers on the API; the Next apps set `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` and a restrictive Permissions Policy.
- Health checks expose no secrets or customer data.
- Audit log captures staff actions with actor, IP, user agent, before/after.
- Secrets are environment variables; no credentials are committed. `.env*` files are git-ignored except examples.
- Dependencies can be audited with `pnpm audit`; CI includes an advisory job.

## Known limitations / residual risks

| Risk | Status | Mitigation path |
| --- | --- | --- |
| No MFA for staff | Not implemented | Add TOTP/WebAuthn for privileged roles before production |
| Email verification not required to shop | By design for demo | Enable a policy flag if the business requires verified checkout |
| No CAPTCHA / bot defence beyond throttling | Partial | Add a managed bot challenge on auth/checkout if abused |
| File uploads not implemented | By design | If added, use object storage, MIME sniffing and size limits |
| In-process rate limiting | Adequate for one instance | Move to Redis-backed throttler for horizontal scale |
| Sandbox payment simulator | Not a real payment integration | Integrate a PCI-compliant provider; never store card data |
| Flat tax rate | Not jurisdiction-aware | Integrate a tax engine |
| No full CSP (Next inline scripts) | Partial | Add nonce-based CSP at the reverse proxy |
| Soft deletion not universal | Orders/audit are immutable; customers use status | Add retention policy and GDPR deletion runbook |
| Audit writes are best-effort | Logged on failure but not transactional | Use an append-only external sink for high-assurance audit |

## Reporting

Security issues should not be filed publicly. Use the repository owner’s private contact. No real customer data exists in this demo.
