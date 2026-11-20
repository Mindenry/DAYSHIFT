# Production Readiness

## Current classification

**PORTFOLIO READY** and **DEMO READY**.
Not **STAGING READY** or **PRODUCTION READY**.

The application is coherent, tested and can be demonstrated safely with demo data. Production requires the items below.

## Infrastructure requirements

- Managed PostgreSQL 16 with PITR, TLS and restricted network.
- Managed Redis 7 with persistence and authentication.
- Separate API replicas behind a load balancer; dedicated worker process.
- Reverse proxy/CDN with TLS, HSTS, CSP and request size/timeouts.
- Object storage/CDN for product media.
- Centralised logs, metrics, tracing and alerting (e.g. OpenTelemetry + Grafana/Prometheus or hosted equivalent).
- Secret manager for session, payment, email and database credentials.
- Automated backups with tested restore procedures.

## Required environment variables

`DATABASE_URL`, `REDIS_URL`, `SESSION_SECRET` (32+ random bytes), `PAYMENT_SANDBOX_SECRET` (or real provider secrets), `APP_URL`, `ADMIN_URL`, `API_URL`, `NODE_ENV=production`, `MAIL_*`, `RATE_LIMIT_*`. See `ENVIRONMENT.md`.

## Deployment requirements

- Build and publish images from the audited commit.
- Run `prisma migrate deploy` before application rollout.
- Run worker with at least one replica and alert on failed jobs.
- Configure health checks against `/api/v1/health` and deep checks for dependencies.
- Put storefront/admin on distinct hostnames; keep admin behind network policy/VPN if possible.
- Never expose PostgreSQL/Redis publicly.

## Database requirements

- Connection pooling (PgBouncer or managed pooler).
- Backups plus monthly restore drills.
- Add partial unique index for null-colour variants or normalise colour.
- Add GIN index for product search before large catalogues.
- Retention policy for sessions, notifications, reset tokens and audit logs.
- Data migration/backfill plan for any new constraints.

## Monitoring requirements

- API latency/error rate, 5xx and 429 rates.
- Checkout success/failure and payment webhook lag.
- Reservation expiry job duration and failures.
- Email queue depth, failed jobs, notification failures.
- Database connections, slow queries, locks; Redis memory/evictions.
- Inventory invariant alarms (negative stock, reserved > on-hand).
- Audit/security alerts for refunds, role changes, staff creation.

## Logging requirements

- Structured JSON logs with request id, route, status, duration and user type (no PII/secrets).
- Central aggregation and retention.
- Payment event and refund audit trail retention.
- No card data or passwords in logs.

## Security requirements before launch

1. MFA for privileged staff and strong password policy.
2. Real payment provider with PCI scope and webhook verification.
3. CSP, CSRF review, Redis-backed rate limiting, bot protection.
4. File upload scanning and object-storage policy (if enabled).
5. External penetration test and dependency remediation (including dev-only advisory if policy requires zero).
6. Verify all permission combinations against least privilege.
7. Email domain authentication (SPF/DKIM/DMARC) and SMTP secret management.
8. Privacy policy, DPA, DSAR/erasure workflow, data retention.

## External services

Currently sandbox/local only: payments, shipping, email. Replace adapters with providers and add integration tests against provider sandboxes.

## Operational limitations

- Reservation expiry and daily reconciliation are not observed over real time in this audit.
- No load test or capacity plan.
- No error boundary/SLO or on-call runbook.
- Loyalty/coupon refund policy unresolved.
- COD collection workflow absent.
- No multi-currency, tax engine, international shipping or fraud engine.

## Required tasks before production

1. Provider integrations (payment, shipping, email) with sandbox and production configuration.
2. MFA, CSP, Redis throttling and security hardening.
3. Load test checkout/inventory and tune indexes/connections.
4. Run reservation-expiry and reconciliation tests over real time.
5. Launch the full Compose/staging stack and execute the E2E suite there.
6. Verify CI on GitHub with protected secrets and deployment gates.
7. Complete accessibility manual audit and legal/compliance review.
8. Establish backups, restore drills, monitoring, alerting and incident runbooks.
