# LAN deployment

DAYSHIFT runs as six Docker containers on a Windows host and is reachable from other devices on the same private network. This document describes the verified deployment in this repository.

## Verified environment

| Item | Value |
| --- | --- |
| Host OS | Windows, elevated PowerShell |
| LAN IPv4 | `192.168.1.107/24` |
| Gateway | `192.168.1.1` |
| Interface | Ethernet |
| Network profile | **Private** |
| Docker | Docker Desktop with Compose v2 |
| Public ports | TCP 3000, 3001, 4000 |
| Internal only | PostgreSQL 5432, Redis 6379 (host loopback `5433`/`6380`) |

Change the address below if your host uses a different IPv4. Everything else stays the same.

## Topology

```
macOS / other LAN device
        │  HTTP
        ▼
Windows host 192.168.1.107
  ├── :3000  dayshift-web    (Next.js storefront)
  ├── :3001  dayshift-admin  (Next.js staff portal)
  └── :4000  dayshift-api    (NestJS)
                 │
        Docker network "dayshift_default"
                 ├── api:4000
                 ├── postgres:5432  (host 127.0.0.1:5433)
                 ├── redis:6379     (host 127.0.0.1:6380)
                 └── worker         (no published port)
```

The browser apps request their own origin under `/api/*`; Next.js rewrites those calls to `http://api:4000` using Docker DNS. Container-to-container traffic never uses the LAN IP.

## 1. Find the host address

```powershell
Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } |
  Select-Object InterfaceAlias, IPAddress, PrefixLength

Get-NetConnectionProfile | Select-Object InterfaceAlias, Name, NetworkCategory
```

The network profile must be **Private**. A Public profile blocks the inbound rules described below.

## 2. Configure `.env`

`.env` is git-ignored. Copy `.env.example` and set at least:

```dotenv
APP_URL="http://192.168.1.107:3000"
ADMIN_URL="http://192.168.1.107:3001"
API_URL="http://192.168.1.107:4000"
NEXT_PUBLIC_SITE_URL="http://192.168.1.107:3000"

# Plain HTTP on the LAN cannot use Secure cookies.
# Remove this line (or set true) when the site is behind HTTPS.
COOKIE_SECURE=false

SESSION_SECRET="<32+ random bytes>"
PAYMENT_SANDBOX_SECRET="<random value>"
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=300
```

`APP_URL` and `ADMIN_URL` feed the API's CORS allow-list, Origin check, email links and the admin portal's "view store" links. A mismatch produces 403 responses on state-changing requests or broken links in the portal.

Generate secrets with:

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

## 3. Start the stack

From the repository root in an **Administrator** PowerShell:

```powershell
.\scripts\deploy.ps1
```

The script:

1. runs `docker compose --profile app up -d --build`;
2. waits up to 180 seconds for the API health check;
3. creates or refreshes the three firewall rules;
4. requests the storefront, admin, API and both `/api/v1/health` proxies and fails on any non-2xx response.

Useful variants:

```powershell
.\scripts\deploy.ps1 -NoBuild        # start existing images
.\scripts\deploy.ps1 -SkipFirewall   # if rules are managed elsewhere
```

Manual equivalent:

```powershell
docker compose --profile app up -d --build
docker compose --profile app ps
```

## 4. Firewall

The deployment creates three inbound rules:

| Rule | Port | Profile | Remote address |
| --- | --- | --- | --- |
| `DAYSHIFT Storefront (TCP 3000)` | 3000 | Private | LocalSubnet |
| `DAYSHIFT Admin (TCP 3001)` | 3001 | Private | LocalSubnet |
| `DAYSHIFT API (TCP 4000)` | 4000 | Private | LocalSubnet |

Verify:

```powershell
Get-NetFirewallRule -DisplayName 'DAYSHIFT*' | ForEach-Object {
  $a = $_ | Get-NetFirewallAddressFilter
  $p = $_ | Get-NetFirewallPortFilter
  "$($_.DisplayName) | $($_.Enabled) | $($_.Profile) | TCP $($p.LocalPort) | $($a.RemoteAddress)"
}
```

The scripts deliberately do **not** open PostgreSQL or Redis. Their Docker port mappings are `127.0.0.1:5433:5432` and `127.0.0.1:6380:6379`.

If a third-party firewall or VPN is installed, it can still block inbound traffic even when Windows Firewall allows it. Test from another device before assuming the rules are wrong.

## 5. Verify from the host

```powershell
.\scripts\health.ps1
```

Expected output includes:

```
OK  dayshift-postgres running (healthy)
OK  dayshift-redis running (healthy)
OK  dayshift-api running (healthy)
OK  dayshift-worker running (none)
OK  dayshift-web running (none)
OK  dayshift-admin running (none)
OK  http://192.168.1.107:3000/ -> 200
OK  http://192.168.1.107:3000/api/v1/health -> 200
OK  http://192.168.1.107:3001/login -> 200
OK  http://192.168.1.107:3001/api/v1/health -> 200
OK  http://192.168.1.107:4000/api/v1/health -> 200
OK  database up
OK  redis up
```

Verified responses for this release:

| URL | Result |
| --- | --- |
| `http://192.168.1.107:3000/` | 200 |
| `http://192.168.1.107:3000/products/the-everyday-oversized-tee` | 200 |
| `http://192.168.1.107:3000/api/v1/health` | 200 |
| `http://192.168.1.107:3001/login` | 200 |
| `http://192.168.1.107:3001/api/v1/health` | 200 |
| `http://192.168.1.107:4000/api/v1/health` | 200 |

## 6. macOS clients

From a Mac on the same network, open:

- Storefront: `http://192.168.1.107:3000`
- Admin: `http://192.168.1.107:3001`
- API health: `http://192.168.1.107:4000/api/v1/health`

Terminal checks:

```bash
curl -sS http://192.168.1.107:4000/api/v1/health
curl -sSI http://192.168.1.107:3000 | head -n 5
curl -sSI http://192.168.1.107:3001/login | head -n 5
```

No software is installed on the Mac; it only needs a route to the host.

> **Verification status:** the Windows host and LAN-IP endpoints are verified above. A physical Mac was not available during this release, so browser sign-in, checkout and admin flows on macOS remain **pending cross-device verification**. No Mac result is claimed.

The macOS app firewall does not block outbound requests. If the pages fail to load, check the Windows profile, the LAN address, and whether the Mac is on a guest network that isolates clients.

## 7. Operational commands

```powershell
.\scripts\status.ps1                          # git, containers, endpoints, firewall
.\scripts\logs.ps1 -Service api -Tail 100     # add -Follow to stream
.\scripts\logs.ps1 -All -Tail 50
.\scripts\stop.ps1                            # app containers only
.\scripts\stop.ps1 -All                       # also stop PostgreSQL and Redis
.\scripts\backup.ps1                          # backups/dayshift-<timestamp>.dump + .sha256
.\scripts\health.ps1                          # exit code 1 on any failure
```

Stopping never removes volumes. `docker compose down` is safe for data; `docker compose down -v` deletes the database and is not used by any script.

## 8. Updating the deployment

```powershell
git pull
.\scripts\deploy.ps1
```

The API container runs `prisma migrate deploy` before the server starts. Existing data in `dayshift_postgres-data` is preserved across rebuilds.

## 9. Changing the LAN address

1. Update the four URLs in `.env`.
2. Rebuild the frontends so the new storefront URL is baked into admin links:
   `docker compose --profile app build web admin`.
3. `docker compose --profile app up -d`.
4. Re-run `.\scripts\deploy.ps1 -NoBuild` to refresh the firewall rules if the ports changed.

The firewall rules are port-based, so an IP change does not require new rules; `LocalSubnet` covers the new address.

## Troubleshooting

| Symptom | Check | Fix |
| --- | --- | --- |
| `deploy.ps1` fails with `EADDRINUSE` | A local `pnpm dev` server already uses 3000/3001/4000 | Stop it, or stop the conflicting container |
| Host works, Mac cannot connect | Network profile, firewall rule scope, guest-network isolation | Set profile to Private; confirm `LocalSubnet`; use the main Wi-Fi |
| Login appears to succeed then returns to sign-in | `COOKIE_SECURE`, `APP_URL`/`ADMIN_URL` mismatch | Use `COOKIE_SECURE=false` on HTTP and exact LAN origins |
| POST requests return 403 `ORIGIN_REJECTED` | `APP_URL`/`ADMIN_URL` in the API container | Update `.env`, `docker compose up -d api` |
| Admin "view store" opens localhost | Frontends built with default URL | `docker compose --profile app build web admin` after setting `NEXT_PUBLIC_SITE_URL` |
| API unhealthy after rebuild | Prisma engine/OpenSSL or migration failure | `.\scripts\logs.ps1 -Service api -Tail 80` |
| 429 responses during tests | Rate limit for the client IP | Raise `RATE_LIMIT_MAX` temporarily; production should keep a low limit |

## Security notes for LAN use

- Plain HTTP exposes credentials and session cookies to anyone who can observe the network. Use it only on a trusted private LAN.
- The demo credentials are public by design. Do not reuse them.
- For anything beyond a demo, terminate TLS in front of ports 3000/3001, set `COOKIE_SECURE=true`, keep the admin portal on a trusted segment or VPN, and replace the sandbox providers.
- `docker compose` reads `.env` for variable substitution; never commit it.
