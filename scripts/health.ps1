# Verifies container health and HTTP endpoints. Exits non-zero on failure.
#
#   .\scripts\health.ps1

. "$PSScriptRoot\_common.ps1"
Set-Location $script:RepoRoot

$failures = 0

Write-Step "Containers"
$expected = @("dayshift-postgres", "dayshift-redis", "dayshift-api", "dayshift-worker", "dayshift-web", "dayshift-admin")
foreach ($name in $expected) {
  $state = Get-DayshiftContainerState $name
  if (-not $state) {
    Write-Fail "$name is missing"
    $failures++
    continue
  }
  if ($state.Status -ne "running") {
    Write-Fail "$name is $($state.Status)"
    $failures++
  } elseif ($state.Health -ne "none" -and $state.Health -ne "healthy") {
    Write-Fail "$name health is $($state.Health)"
    $failures++
  } else {
    Write-Ok "$name running ($($state.Health))"
  }
}

Write-Step "HTTP"
$appUrl = Get-DayshiftUrl "APP_URL" "http://192.168.1.107:3000"
$adminUrl = Get-DayshiftUrl "ADMIN_URL" "http://192.168.1.107:3001"
$apiUrl = Get-DayshiftUrl "API_URL" "http://192.168.1.107:4000"
foreach ($url in @("$appUrl/", "$appUrl/api/v1/health", "$adminUrl/login", "$adminUrl/api/v1/health", "$apiUrl/api/v1/health")) {
  $result = Test-Http $url
  if ($result.Ok) { Write-Ok "$url -> $($result.Status)" } else { Write-Fail "$url -> $($result.Status) $($result.Error)"; $failures++ }
}

Write-Step "API dependency check"
try {
  $health = Invoke-RestMethod -Uri "$apiUrl/api/v1/health" -TimeoutSec 20
  $checks = $health.data.checks
  if ($checks.database -eq "up") { Write-Ok "database up" } else { Write-Fail "database $($checks.database)"; $failures++ }
  if ($checks.redis -eq "up") { Write-Ok "redis up" } else { Write-Fail "redis $($checks.redis)"; $failures++ }
} catch {
  Write-Fail "Could not read API health payload: $($_.Exception.Message)"
  $failures++
}

if ($failures -gt 0) {
  Write-Fail "$failures health check(s) failed"
  exit 1
}
Write-Step "All health checks passed"
