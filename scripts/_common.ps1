# Shared helpers for the DAYSHIFT PowerShell operations scripts.
# Dot-source from a script in this folder:  . "$PSScriptRoot\_common.ps1"

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$script:RepoRoot = Split-Path -Parent $PSScriptRoot
$script:ComposeFile = Join-Path $script:RepoRoot "docker-compose.yml"

function Write-Step([string]$Message) {
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Write-Ok([string]$Message) {
  Write-Host "  OK  $Message" -ForegroundColor Green
}

function Write-Warn([string]$Message) {
  Write-Host "  !!  $Message" -ForegroundColor Yellow
}

function Write-Fail([string]$Message) {
  Write-Host "  XX  $Message" -ForegroundColor Red
}

function Test-Elevated {
  $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = New-Object Security.Principal.WindowsPrincipal($identity)
  return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Minimal .env reader. Values are never printed by the scripts.
function Get-DayshiftEnv {
  $path = Join-Path $script:RepoRoot ".env"
  $result = @{}
  if (-not (Test-Path $path)) { return $result }
  foreach ($line in Get-Content $path) {
    if ($line -match '^\s*([A-Za-z0-9_]+)\s*=\s*"?([^"#]*)"?\s*(?:#.*)?$') {
      $result[$Matches[1]] = $Matches[2].Trim()
    }
  }
  return $result
}

function Get-DayshiftUrl([string]$Key, [string]$Default) {
  $envMap = Get-DayshiftEnv
  if ($envMap.ContainsKey($Key) -and $envMap[$Key]) { return $envMap[$Key].TrimEnd('/') }
  return $Default.TrimEnd('/')
}

function Invoke-Compose {
  param([string[]]$ComposeArgs)
  & docker compose --file $script:ComposeFile @ComposeArgs
  if ($LASTEXITCODE -ne 0) { throw "docker compose $($ComposeArgs -join ' ') failed with exit code $LASTEXITCODE" }
}

function Test-Http([string]$Url, [int]$TimeoutSec = 20) {
  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec $TimeoutSec -MaximumRedirection 5
    return [pscustomobject]@{ Url = $Url; Ok = ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400); Status = $response.StatusCode; Error = $null }
  } catch {
    $status = $null
    if ($_.Exception.Response) { $status = [int]$_.Exception.Response.StatusCode }
    return [pscustomobject]@{ Url = $Url; Ok = $false; Status = $status; Error = $_.Exception.Message }
  }
}

function Get-DayshiftContainerState([string]$Name) {
  $raw = & docker inspect --format '{{.State.Status}}|{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' $Name 2>$null
  if ($LASTEXITCODE -ne 0 -or -not $raw) { return $null }
  $parts = ($raw -split '\|')
  return [pscustomobject]@{ Status = $parts[0]; Health = $parts[1] }
}

function Set-DayshiftFirewall {
  $rules = @(
    @{ Name = "DAYSHIFT Storefront (TCP 3000)"; Port = 3000 },
    @{ Name = "DAYSHIFT Admin (TCP 3001)"; Port = 3001 },
    @{ Name = "DAYSHIFT API (TCP 4000)"; Port = 4000 }
  )
  if (-not (Test-Elevated)) {
    Write-Warn "Not elevated: skipping Windows Firewall rules. Run PowerShell as Administrator and re-run deploy.ps1."
    return
  }
  foreach ($rule in $rules) {
    $existing = Get-NetFirewallRule -DisplayName $rule.Name -ErrorAction SilentlyContinue
    if ($existing) {
      # Recreate so profile, scope and port filters are exact and idempotent.
      Remove-NetFirewallRule -DisplayName $rule.Name | Out-Null
    }
    New-NetFirewallRule -DisplayName $rule.Name -Direction Inbound -Action Allow -Protocol TCP `
      -LocalPort $rule.Port -RemoteAddress LocalSubnet -Profile Private `
      -Description "DAYSHIFT LAN access (private networks only)" | Out-Null
    Write-Ok "Firewall: $($rule.Name) -> Private / LocalSubnet"
  }
}
