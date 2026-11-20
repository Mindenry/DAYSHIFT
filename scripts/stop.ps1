# Stops DAYSHIFT containers without deleting data.
#
#   .\scripts\stop.ps1          # stop storefront, admin, API, worker
#   .\scripts\stop.ps1 -All     # also stop PostgreSQL and Redis
#
# Volumes are never removed. Use deploy.ps1 to start again.

[CmdletBinding()]
param(
  [switch]$All
)

. "$PSScriptRoot\_common.ps1"
Set-Location $script:RepoRoot

if ($All) {
  Write-Step "Stopping all DAYSHIFT services (data volumes preserved)"
  Invoke-Compose -ComposeArgs @("--profile", "app", "stop")
} else {
  Write-Step "Stopping application services (databases stay up)"
  Invoke-Compose -ComposeArgs @("stop", "api", "worker", "web", "admin")
}

Write-Step "Container status"
Invoke-Compose -ComposeArgs @("--profile", "app", "ps")
Write-Ok "Stop complete. Volumes and data were not modified."
