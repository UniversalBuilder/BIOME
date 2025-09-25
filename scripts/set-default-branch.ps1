param(
  [Parameter(Mandatory=$true)] [string]$RepoOwner,
  [Parameter(Mandatory=$true)] [string]$RepoName,
  [Parameter(Mandatory=$true)] [string]$Branch,
  [Parameter(Mandatory=$false)] [string]$Token
)

<#
Synopsis: Set the default branch for a GitHub repository.

Usage example:
  $env:GITHUB_TOKEN = "<your_token_with_repo_scope>"
  .\scripts\set-default-branch.ps1 -RepoOwner "UniversalBuilder" -RepoName "BIOME" -Branch "main"
#>

if (-not $Token) { $Token = $env:GITHUB_TOKEN }
if (-not $Token) { $Token = $env:GH_TOKEN }
if (-not $Token) { throw "A GitHub token is required. Set GITHUB_TOKEN or GH_TOKEN, or pass -Token." }

$userAgent = "BIOME-Repo-Admin"
$headers = @{ Authorization = "token $Token"; "User-Agent" = $userAgent; "Accept" = "application/vnd.github+json" }
$uri = "https://api.github.com/repos/$RepoOwner/$RepoName"
$payload = @{ default_branch = $Branch } | ConvertTo-Json

Write-Host "Setting default branch to '$Branch' for $RepoOwner/$RepoName..."
$res = Invoke-RestMethod -Method Patch -Uri $uri -Headers $headers -Body $payload
Write-Host "Default branch is now: $($res.default_branch)"
