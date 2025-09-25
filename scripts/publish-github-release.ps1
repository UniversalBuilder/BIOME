param(
  [Parameter(Mandatory=$true)] [string]$RepoOwner,
  [Parameter(Mandatory=$true)] [string]$RepoName,
  [Parameter(Mandatory=$true)] [string]$Tag,
  [Parameter(Mandatory=$false)] [string]$Title,
  [Parameter(Mandatory=$false)] [string]$BodyPath,
  [Parameter(Mandatory=$true)] [string]$AssetPath,
  [Parameter(Mandatory=$false)] [string]$Token
)

<#
Synopsis: Create a GitHub release for a tag and upload an asset (e.g., MSI)

Usage example:
  $env:GITHUB_TOKEN = "<your_token_with_repo_scope>"
  .\scripts\publish-github-release.ps1 -RepoOwner "UniversalBuilder" -RepoName "BIOME" -Tag "v1.2.0" -Title "BIOME v1.2.0" -BodyPath "docs\BIOME_Technical_Document.md" -AssetPath "BIOME-Distribution\BIOME_1.2.0_x64_en-US.msi"

Notes:
  - Token can come from -Token, or environment variables GITHUB_TOKEN or GH_TOKEN.
  - Requires repo:status, repo (full control) to create releases and upload assets.
#>

if (-not $Token) {
  $Token = $env:GITHUB_TOKEN
}
if (-not $Token) {
  $Token = $env:GH_TOKEN
}
if (-not $Token) {
  throw "A GitHub token is required. Set GITHUB_TOKEN or GH_TOKEN, or pass -Token."
}

if (-not (Test-Path -LiteralPath $AssetPath)) {
  throw "AssetPath not found: $AssetPath"
}

function Get-FileName([string]$Path){
  return [System.IO.Path]::GetFileName($Path)
}

$userAgent = "BIOME-Release-Script"
$headers = @{ Authorization = "token $Token"; "User-Agent" = $userAgent; "Accept" = "application/vnd.github+json" }

# Read body if provided
$bodyText = $null
if ($BodyPath -and (Test-Path -LiteralPath $BodyPath)) {
  $bodyText = Get-Content -LiteralPath $BodyPath -Raw
}
if (-not $Title) { $Title = $Tag }

$createReleaseUri = "https://api.github.com/repos/$RepoOwner/$RepoName/releases"
$releasePayload = @{ tag_name = $Tag; name = $Title; draft = $false; prerelease = $false }
if ($bodyText) { $releasePayload.body = $bodyText }

Write-Host "Creating release $Tag on $RepoOwner/$RepoName..."
$release = Invoke-RestMethod -Method Post -Uri $createReleaseUri -Headers $headers -Body ($releasePayload | ConvertTo-Json -Depth 5)

if (-not $release) { throw "Failed to create release." }
$uploadUrlTemplate = $release.upload_url  # e.g., https://uploads.github.com/repos/{owner}/{repo}/releases/{id}/assets{?name,label}
$assetName = Get-FileName $AssetPath
$uploadUrl = ($uploadUrlTemplate -replace "\{\?name,label\}", "?name=$assetName")

Write-Host "Uploading asset $assetName..."
$assetBytes = [System.IO.File]::ReadAllBytes((Resolve-Path -LiteralPath $AssetPath))
$assetHeaders = @{ Authorization = "token $Token"; "User-Agent" = $userAgent; "Content-Type" = "application/octet-stream" }
$uploaded = Invoke-RestMethod -Method Post -Uri $uploadUrl -Headers $assetHeaders -Body $assetBytes

if (-not $uploaded) { throw "Asset upload failed." }

Write-Host "Release created: $($release.html_url)"
Write-Host "Asset uploaded: $($uploaded.browser_download_url)"
