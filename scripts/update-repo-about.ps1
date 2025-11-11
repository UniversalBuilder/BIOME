param(
  [Parameter(Mandatory=$true)] [string]$RepoOwner,
  [Parameter(Mandatory=$true)] [string]$RepoName,
  [Parameter(Mandatory=$false)] [string]$Description,
  [Parameter(Mandatory=$false)] [string]$Homepage,
  [Parameter(Mandatory=$false)] [string[]]$Topics,
  [Parameter(Mandatory=$false)] [string]$Token
)

<#
Synopsis: Update repository About metadata (description, homepage) and topics.

Usage example:
  $env:GITHUB_TOKEN = "<your_token_with_repo_scope>"
  .\scripts\update-repo-about.ps1 -RepoOwner "UniversalBuilder" -RepoName "BIOME" -Description "Comprehensive bioimage analysis project manager" -Homepage "https://cif.unil.ch" -Topics bioimage-analysis,microscopy,project-management

Notes:
  - Token can come from -Token, or environment variables GITHUB_TOKEN or GH_TOKEN.
  - Topics can be passed as comma-separated string to PowerShell which binds to string[].
#>

if (-not $Token) { $Token = $env:GITHUB_TOKEN }
if (-not $Token) { $Token = $env:GH_TOKEN }
if (-not $Token) { throw "A GitHub token is required. Set GITHUB_TOKEN or GH_TOKEN, or pass -Token." }

$userAgent = "BIOME-Repo-About-Updater"
$headers = @{ Authorization = "token $Token"; "User-Agent" = $userAgent; "Accept" = "application/vnd.github+json" }

# Patch description/homepage if provided
if ($PSBoundParameters.ContainsKey('Description') -or $PSBoundParameters.ContainsKey('Homepage')) {
  $payload = @{}
  if ($PSBoundParameters.ContainsKey('Description')) { $payload["description"] = $Description }
  if ($PSBoundParameters.ContainsKey('Homepage')) { $payload["homepage"] = $Homepage }
  $uri = "https://api.github.com/repos/$RepoOwner/$RepoName"
  Write-Host "Updating repository description/homepage for $RepoOwner/$RepoName ..."
  $res = Invoke-RestMethod -Method Patch -Uri $uri -Headers $headers -Body ($payload | ConvertTo-Json)
  Write-Host "Description: '$($res.description)'; Homepage: '$($res.homepage)'"
}

# Update topics if provided
if ($PSBoundParameters.ContainsKey('Topics')) {
  # Ensure topics is an array of non-empty strings
  $topicNames = @()
  foreach ($t in $Topics) {
    if ($t -and ($t.Trim()).Length -gt 0) { $topicNames += $t.Trim() }
  }
  $topicsPayload = @{ names = $topicNames } | ConvertTo-Json
  $topicsUri = "https://api.github.com/repos/$RepoOwner/$RepoName/topics"
  Write-Host "Updating topics (" + ($topicNames -join ', ') + ") for $RepoOwner/$RepoName ..."
  $topicsRes = Invoke-RestMethod -Method Put -Uri $topicsUri -Headers $headers -Body $topicsPayload
  Write-Host "Topics now: " + (($topicsRes.names) -join ', ')
}

Write-Host "Repository About update completed."
