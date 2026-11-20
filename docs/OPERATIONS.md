# Operations

## Daily checks

- Admin → **System health**: API, PostgreSQL, Redis, queue counts, failed notifications.
- Admin → **Dashboard**: pending orders, returns to review, low stock, sales trend.
- Worker logs: failed `email.send`, `reservation.expire`, `payment.reconcile` jobs.

## Starting and stopping locally

Docker deployment on the Windows host:

```powershell
.\scripts\deploy.ps1          # build, start, firewall, HTTP verification
.\scripts\status.ps1          # containers, endpoints, firewall
.\scripts\health.ps1          # strict checks; non-zero on failure
.\scripts\logs.ps1 -Service api -Tail 100
.\scripts\stop.ps1            # stop app containers; volumes preserved
.\scripts\stop.ps1 -All       # also stop PostgreSQL and Redis
```

Local development process:

```bash
docker compose up -d postgres redis
pnpm dev                     # all four apps
pnpm dev:worker              # worker only
docker compose stop          # keeps volumes
docker compose down          # keeps volumes
docker compose down -v       # DESTROYS local data
```

## Backup

```powershell
.\scripts\backup.ps1          # compressed dump + SHA-256 in backups/
```

Or:

```bash
pnpm db:backup               # backups/dayshift-YYYYMMDD-HHMMSS.dump
```

Both use `pg_dump -Fc` inside `dayshift-postgres`. For production, use managed snapshots plus logical dumps, store off-host, encrypt, and test restores.

## Restore

```bash
node scripts/db-restore.mjs backups/<file>.dump --yes
```

This is destructive. Verify the target first; restore into a scratch database for drills.

## Migrations

```bash
pnpm db:migrate              # development only
pnpm db:deploy               # deployment
```

Never run `prisma migrate reset` on a database with real data. Never delete financial tables to make a test pass.

## Seed reset

`SEED_RESET=1 pnpm db:seed` deletes demo commerce rows and rebuilds the catalogue. It is intended for local/demo environments only.

## Failed jobs and emails

- Notifications start `PENDING`; the worker writes `.eml` files to `apps/worker/.mail` in file mode.
- `email.retry` runs every 5 minutes and at worker boot, retrying PENDING/FAILED notifications.
- Failed jobs remain in Redis with five exponential-backoff attempts; inspect counts at `/admin/system`.
- To inspect a message locally, open the newest `.eml` in `apps/worker/.mail` (password reset and verification links are there).

## Expired reservations

The worker schedules `reservation.expire` every 60 seconds. It releases reservations past `expiresAt` and cancels orders still `PENDING_PAYMENT`, voiding pending payments. The operation is idempotent.

## Payment reconciliation

A daily job recomputes `paymentStatus` for recently updated orders from payments and processed refunds. Staff can inspect payments/refunds from the order screen.

## Incident playbook

| Symptom | First checks | Action |
| --- | --- | --- |
| Storefront 500 on catalogue | API health, `api.err.log` | Restart API; check database connectivity |
| Orders stuck pending payment | Worker running? reservation expiry? | Start worker; verify `/admin/system` queue counts |
| Emails not arriving | `MAIL_MODE`, `.mail` folder, failed notifications | Fix SMTP credentials or retry `email.retry` |
| Oversell suspected | Inventory movements and reservations for the variant | Compare reserved vs on-hand; reconcile with an audited adjustment |
| Duplicate charge report | Payment events by reference, refunds | Verify event ids; never delete payment rows; refund if confirmed |
| Admin 403 | Staff role/permissions, audit log | Adjust role via super admin; review audit trail |
| Database disk full | Container logs, volume usage | Stop writes, expand volume, restore from backup if corrupted |

## Security operations

- Rotate `SESSION_SECRET` by invalidating all sessions.
- Rotate sandbox secret and email credentials through the secret manager.
- Review `AuditLog` for refunds, role changes, staff creation and settings changes.
- Run `pnpm audit`; patch high-severity dependencies promptly.
- Never paste production credentials into tickets, logs or seed files.

## Demo reset

For a clean demo: `SEED_RESET=1 pnpm db:seed` (destroys demo data), or `docker compose down -v && docker compose up -d postgres redis && pnpm db:migrate && pnpm db:seed`.
