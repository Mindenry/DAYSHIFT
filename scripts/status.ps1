# Prints repository, container, health and firewall status for DAYSHIFT.

. "$PSScriptRoot\_common.ps1"
Set-Location $script:RepoRoot

Write-Step "Repository"
Push-Location $script:RepoRoot
$branch = git branch --show-current
$commit = git rev-parse --short HEAD
$dirty = if (git status --porcelain) { "dirty" } else { "clean" }
Pop-Location
Write-Host "  branch : $branch"
Write-Host "  commit : $commit ($dirty)"

Write-Step "Containers"
Invoke-Compose -ComposeArgs @("--profile", "app", "ps")

Write-Step "Endpoints"
$appUrl = Get-DayshiftUrl "APP_URL" "http://192.168.1.107:3000"
$adminUrl = Get-DayshiftUrl "ADMIN_URL" "http://192.168.1.107:3001"
$apiUrl = Get-DayshiftUrl "API_URL" "http://192.168.1.107:4000"
foreach ($url in @("$appUrl/", "$adminUrl/login", "$apiUrl/api/v1/health")) {
  $result = Test-Http $url
  if ($result.Ok) { Write-Ok "$url -> $($result.Status)" } else { Write-Fail "$url -> $($result.Status) $($result.Error)" }
}

Write-Step "Windows Firewall"
if (Test-Elevated) {
  $rules = Get-NetFirewallRule -DisplayName "DAYSHIFT*" -ErrorAction SilentlyContinue
  if (-not $rules) {
    Write-Warn "No DAYSHIFT firewall rules found."
  } else {
    foreach ($rule in $rules) {
      $port = ($rule | Get-NetFirewallPortFilter).LocalPort -join ","
      $remote = ($rule | Get-NetFirewallAddressFilter).RemoteAddress -join ","
      Write-Host "  $($rule.DisplayName): $($rule.Enabled) / $($rule.Profile) / TCP $port / $remote"
    }
  }
} else {
  Write-Warn "Run as Administrator to inspect firewall rules."
}
