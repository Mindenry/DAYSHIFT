# Streams container logs.
#
#   .\scripts\logs.ps1                 # API logs, last 100 lines
#   .\scripts\logs.ps1 -Service web -Tail 200
#   .\scripts\logs.ps1 -Service worker -Follow
#   .\scripts\logs.ps1 -All -Tail 50

[CmdletBinding()]
param(
  [ValidateSet("api", "worker", "web", "admin", "postgres", "redis")]
  [string]$Service = "api",
  [int]$Tail = 100,
  [switch]$Follow,
  [switch]$All
)

. "$PSScriptRoot\_common.ps1"
Set-Location $script:RepoRoot

$arguments = @("logs", "--tail", $Tail)
if ($Follow) { $arguments += "--follow" }
if ($All) { Invoke-Compose -ComposeArgs $arguments } else { Invoke-Compose -ComposeArgs ($arguments + $Service) }
