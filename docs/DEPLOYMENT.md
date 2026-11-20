# Deployment

## Local (recommended)

See README. Infrastructure is isolated in Docker on ports **5433** (Postgres) and **6380** (Redis) to avoid clashing with local services.

## Docker Compose — full stack

```bash
cp .env.example .env
# set SESSION_SECRET and PAYMENT_SANDBOX_SECRET to strong random values
docker compose up -d postgres redis
docker compose --profile app build
docker compose --profile app up -d
docker compose exec api pnpm --filter @dayshift/db exec prisma migrate deploy
```

App profile services: `api`, `worker`, `web`, `admin`. The API container runs `prisma migrate deploy` before starting. Storefront/admin use Next production start and proxy `/api` to `http://api:4000` through `API_INTERNAL_URL`.

Notes:
- `NEXT_PUBLIC_API_URL` is provided at image build time; the apps use relative `/api` paths so no CORS is required.
- The full-stack image build was **not executed** in this session (time). Dockerfiles are multi-stage and should be built before relying on them; verify with `docker compose --profile app build`.
- Put TLS termination and a real reverse proxy (Nginx/Caddy/Cloud LB) in front of ports 3000/3001 for production; do not expose PostgreSQL or Redis publicly.

## Environment-specific configuration

| Variable | Production guidance |
| --- | --- |
| `DATABASE_URL` | Managed PostgreSQL with backups, TLS, restricted network |
| `REDIS_URL` | Managed Redis with persistence and auth |
| `SESSION_SECRET` | 32+ random bytes; rotate with session invalidation |
| `PAYMENT_SANDBOX_SECRET` | Replace provider entirely before real payments |
| `APP_URL` / `ADMIN_URL` | Exact HTTPS origins; used for cookies, CORS, Origin checks, email links |
| `MAIL_MODE` | `smtp` with a transactional provider; store credentials in a secret manager |
| `NODE_ENV` | `production` (enables secure cookies, disables Swagger) |

## Database migrations

- Commit every migration under `packages/db/prisma/migrations`.
- Deploy with `prisma migrate deploy` (never `migrate dev` in production).
- Take a backup before destructive changes; restore procedure is in OPERATIONS.md.
- `SEED_RESET=1` is destructive and refuses to run when products exist unless explicitly set; never run seed against production.

## Scaling notes

- API is stateless apart from the database and Redis. Run multiple replicas behind a load balancer.
- The worker can run multiple instances; BullMQ coordinates jobs.
- Move rate limiting to a Redis-backed throttler before horizontal scaling (current throttler is in-process).
- Add a read replica for catalogue/reporting if needed; checkout must use the primary.
- Static assets should move to a CDN/object storage; the demo serves them from Next public folders.

## Rollback

1. Deploy previous application image.
2. Restore the pre-deploy database backup if a migration is not backward-compatible, or run the documented down migration.
3. Verify `/health`, a catalogue read, and a sandbox purchase in a staging environment.

## CI

`.github/workflows/ci.yml` runs on push/PR: install, Prisma generate, migrate, seed, typecheck, unit tests, builds, starts API/web/admin/worker, runs the integration suite and Playwright, uploads the report, and performs a dependency audit advisory. It requires no paid services.
