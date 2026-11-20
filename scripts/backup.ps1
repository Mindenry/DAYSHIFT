# Creates a compressed PostgreSQL backup inside backups/.
# Non-destructive: only reads the database.
#
#   .\scripts\backup.ps1                 # writes backups/dayshift-<timestamp>.dump
#   .\scripts\backup.ps1 -OutputDir D:\DAYSHIFT-BACKUPS

[CmdletBinding()]
param(
  [string]$OutputDir
)

. "$PSScriptRoot\_common.ps1"
Set-Location $script:RepoRoot

$container = "dayshift-postgres"
$state = Get-DayshiftContainerState $container
if (-not $state -or $state.Status -ne "running") {
  throw "$container is not running. Start the stack with .\scripts\deploy.ps1 first."
}

if (-not $OutputDir) { $OutputDir = Join-Path $script:RepoRoot "backups" }
if (-not (Test-Path $OutputDir)) { New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null }

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$fileName = "dayshift-$stamp.dump"
$localPath = Join-Path $OutputDir $fileName
$containerPath = "/tmp/dayshift-backup.dump"

Write-Step "Dumping database (custom format)"
& docker exec $container pg_dump -U dayshift -d dayshift -Fc -f $containerPath
if ($LASTEXITCODE -ne 0) { throw "pg_dump failed with exit code $LASTEXITCODE" }

Write-Step "Copying dump out of the container"
& docker cp "${container}:$containerPath" $localPath
if ($LASTEXITCODE -ne 0) { throw "docker cp failed with exit code $LASTEXITCODE" }
& docker exec $container rm -f $containerPath | Out-Null

$file = Get-Item $localPath
if ($file.Length -lt 1024) { throw "Backup looks too small ($($file.Length) bytes); treat it as invalid." }

$hash = (Get-FileHash -Algorithm SHA256 -Path $localPath).Hash
Set-Content -Path "$localPath.sha256" -Value "$hash  $fileName" -Encoding ascii

Write-Ok "Backup written: $localPath"
Write-Host "  size   : $([math]::Round($file.Length / 1MB, 2)) MB"
Write-Host "  sha256 : $hash"
