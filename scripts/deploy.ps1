# Builds and starts the complete DAYSHIFT stack (PostgreSQL, Redis, API,
# worker, storefront, admin) and applies the LAN firewall rules.
#
#   .\scripts\deploy.ps1              # build images and start
#   .\scripts\deploy.ps1 -NoBuild     # start existing images
#   .\scripts\deploy.ps1 -SkipFirewall
#
# Existing PostgreSQL/Redis volumes are reused; nothing is deleted.

[CmdletBinding()]
param(
  [switch]$NoBuild,
  [switch]$SkipFirewall
)

. "$PSScriptRoot\_common.ps1"
Set-Location $script:RepoRoot

if (-not (Test-Path (Join-Path $script:RepoRoot ".env"))) {
  throw ".env is missing. Copy .env.example to .env and set APP_URL/ADMIN_URL to this machine's LAN address."
}

Write-Step "Starting DAYSHIFT (profile: app)"
if ($NoBuild) {
  Invoke-Compose -ComposeArgs @("--profile", "app", "up", "-d")
} else {
  Invoke-Compose -ComposeArgs @("--profile", "app", "up", "-d", "--build")
}

Write-Step "Waiting for the API health check (up to 180s)"
$apiReady = $false
for ($i = 0; $i -lt 60; $i++) {
  $state = Get-DayshiftContainerState "dayshift-api"
  if ($state -and $state.Health -eq "healthy") { $apiReady = $true; break }
  Start-Sleep -Seconds 3
}
if (-not $apiReady) {
  Write-Warn "API did not report healthy in time. Recent logs:"
  Invoke-Compose -ComposeArgs @("logs", "--tail", "40", "api")
  throw "Deployment did not reach a healthy state."
}
Write-Ok "API is healthy"

if (-not $SkipFirewall) {
  Write-Step "Configuring Windows Firewall (Private profile, LocalSubnet)"
  Set-DayshiftFirewall
}

$appUrl = Get-DayshiftUrl "APP_URL" "http://192.168.1.107:3000"
$adminUrl = Get-DayshiftUrl "ADMIN_URL" "http://192.168.1.107:3001"
$apiUrl = Get-DayshiftUrl "API_URL" "http://192.168.1.107:4000"

Write-Step "HTTP verification"
$targets = @(
  "$appUrl/",
  "$appUrl/api/v1/health",
  "$adminUrl/login",
  "$adminUrl/api/v1/health",
  "$apiUrl/api/v1/health"
)
$failed = 0
foreach ($url in $targets) {
  $result = Test-Http $url
  if ($result.Ok) { Write-Ok "$url -> $($result.Status)" } else { Write-Fail "$url -> $($result.Status) $($result.Error)"; $failed++ }
}

Write-Host ""
Write-Host "Storefront : $appUrl" -ForegroundColor White
Write-Host "Admin      : $adminUrl" -ForegroundColor White
Write-Host "API        : $apiUrl/api/v1" -ForegroundColor White

if ($failed -gt 0) { throw "$failed HTTP check(s) failed." }
Write-Step "DAYSHIFT is up"
