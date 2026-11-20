# Docker deployment

DAYSHIFT ships as four application images plus two infrastructure images, orchestrated by `docker-compose.yml`. The application services use the `app` profile so PostgreSQL and Redis can run alone for local development.

## Services

| Service | Image | Container | Published port | Health |
| --- | --- | --- | --- | --- |
| `postgres` | `postgres:16-alpine` | `dayshift-postgres` | `127.0.0.1:5433 → 5432` | `pg_isready` |
| `redis` | `redis:7-alpine` | `dayshift-redis` | `127.0.0.1:6380 → 6379` | `redis-cli ping` |
| `api` | local build (`api.Dockerfile`) | `dayshift-api` | `0.0.0.0:4000 → 4000` | HTTP `/api/v1/health` |
| `worker` | local build (`worker.Dockerfile`) | `dayshift-worker` | none | process running |
| `web` | local build (`web.Dockerfile`) | `dayshift-web` | `0.0.0.0:3000 → 3000` | HTTP via compose |
| `admin` | local build (`admin.Dockerfile`) | `dayshift-admin` | `0.0.0.0:3001 → 3001` | HTTP via compose |

All application services use `restart: unless-stopped`. The API waits for healthy PostgreSQL and Redis; the worker waits for the API, PostgreSQL and Redis; the frontends start after the API.

## Images

All images use `node:22-bookworm-slim` and a multi-stage build:

1. copy the repository, install with the frozen pnpm lockfile;
2. generate the Prisma client for `native` and `debian-openssl-3.0.x`;
3. build shared packages and the target app;
4. copy the workspace into a slim runtime with `NODE_ENV=production`.

The API and worker runtime stages install OpenSSL because Prisma's query engine requires it. The API entrypoint applies committed migrations and then starts NestJS:

```sh
node /app/packages/db/node_modules/prisma/build/index.js migrate deploy \
  --schema /app/packages/db/prisma/schema.prisma \
  && node /app/apps/api/dist/main.js
```

The storefront and admin images start Next.js from the app-local binary and are built with these arguments:

| Build argument | Purpose | Compose default |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Public API origin for build-time references | `http://localhost:4000` |
| `API_INTERNAL_URL` | Server-side rewrite target | `http://api:4000` |
| `NEXT_PUBLIC_SITE_URL` | Storefront base URL used by admin links | `http://192.168.1.107:3000` |

`NEXT_PUBLIC_*` values are inlined at build time. Rebuild `web` and `admin` after changing the storefront address.

## Runtime environment

Compose passes these variables to the containers:

| Variable | Default | Notes |
| --- | --- | --- |
| `NODE_ENV` | `production` | Disables Swagger |
| `DATABASE_URL` | `postgresql://dayshift:dayshift@postgres:5432/dayshift?schema=public` | Docker DNS, not the host |
| `REDIS_URL` | `redis://redis:6379` | Docker DNS |
| `SESSION_SECRET` | from `.env` | Required |
| `PAYMENT_SANDBOX_SECRET` | from `.env` | Required |
| `APP_URL` / `ADMIN_URL` | `http://192.168.1.107:3000` / `:3001` | CORS, Origin check, links |
| `COOKIE_SECURE` | `false` in Compose defaults | Set `true` behind HTTPS |
| `RATE_LIMIT_TTL` / `RATE_LIMIT_MAX` | `60` / `300` | Per client IP, per window |
| `MAIL_MODE` | `file` | `smtp` for a real provider |

The database credentials and sandbox secrets are demo values. Replace them before any shared deployment. `.env` is git-ignored; `.env.example` contains placeholders only.

## Volumes

| Volume | Mount | Content |
| --- | --- | --- |
| `dayshift_postgres-data` | `/var/lib/postgresql/data` | Database |
| `dayshift_redis-data` | `/data` | Redis AOF |

Both are named volumes and survive `docker compose down`, rebuilds and container removal. Only `docker compose down -v` deletes them; no repository script does that.

## Commands

From the repository root:

```powershell
# Infrastructure only (local development)
docker compose up -d postgres redis

# Full stack
docker compose --profile app build
docker compose --profile app up -d

# State
docker compose --profile app ps
docker compose --profile app logs --tail 100 api
docker compose --profile app stop

# Validate configuration without starting anything
docker compose config --quiet
```

The PowerShell wrappers add health waits and HTTP verification:

```powershell
.\scripts\deploy.ps1
.\scripts\status.ps1
.\scripts\health.ps1
.\scripts\logs.ps1 -Service web -Tail 100
.\scripts\stop.ps1
.\scripts\backup.ps1
```

## Verification performed

| Check | Result |
| --- | --- |
| `docker compose config --quiet` | valid |
| API, worker, web, admin images built | four images |
| API container `/api/v1/health` | 200, database and Redis `up` |
| Storefront container `/` and product page | 200 |
| Storefront `/api/v1/health` proxy | 200 |
| Admin `/login` and `/api/v1/health` proxy | 200 |
| Worker startup | repeatable jobs scheduled, ready log |
| PostgreSQL/Redis host bindings | `127.0.0.1` only |
| Full `app` profile | started together and verified |

## Rebuilding after code changes

```powershell
docker compose --profile app build api worker
docker compose --profile app up -d api worker
```

Frontend changes require rebuilding `web` and/or `admin`. Database schema changes need a committed migration; the API applies it automatically at startup.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| `PrismaClientInitializationError` about the query engine | Engine generated for the wrong libc/OpenSSL target | Keep `binaryTargets = ["native", "debian-openssl-3.0.x"]` and OpenSSL in the runtime image; rebuild |
| `Command "prisma" not found` | Runtime tried `pnpm exec prisma` | Use the absolute Prisma CLI path in the API entrypoint |
| API starts before the database | Compose conditions changed | Keep `depends_on: condition: service_healthy` |
| Web/admin return 502 on `/api` | `API_INTERNAL_URL` points at localhost inside the container | Use `http://api:4000` and rebuild |
| `next start` warns about `output: standalone` | Next 15 warning | Harmless; the server starts and responds. Standalone server can be adopted later |
| Port already allocated | A host process owns 3000/3001/4000 | Stop the local dev server or change the mapping |
| Admin links point to localhost | Frontends built before `NEXT_PUBLIC_SITE_URL` was set | Rebuild `web` and `admin` |
| Containers exit immediately | Missing secret or invalid `.env` | `.\scripts\logs.ps1 -All -Tail 80` |

## Production notes

This Compose file is a single-host demo deployment. Before production:

- terminate TLS at a reverse proxy and set `COOKIE_SECURE=true`;
- replace demo database credentials and sandbox secrets with managed secrets;
- run PostgreSQL and Redis as managed services with backups and authentication;
- scale the API behind a load balancer and move rate limiting to Redis;
- add centralised logs, metrics, alerting and restore drills.

See [Production readiness](PRODUCTION_READINESS.md).
