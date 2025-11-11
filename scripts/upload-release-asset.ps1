param(
  [Parameter(Mandatory=$true)] [string]$RepoOwner,
  [Parameter(Mandatory=$true)] [string]$RepoName,
  [Parameter(Mandatory=$true)] [string]$Tag,
  [Parameter(Mandatory=$true)] [string]$AssetPath,
  [Parameter(Mandatory=$false)] [string]$Token
)

<#
Synopsis: Upload a single asset to an existing GitHub release identified by tag.

Usage example:
  $env:GITHUB_TOKEN = "<your_token_with_repo_scope>"
  .\scripts\upload-release-asset.ps1 -RepoOwner "UniversalBuilder" -RepoName "BIOME" -Tag "v1.4.1" -AssetPath "BIOME-Distribution\BIOME_1.4.1_x64_en-US.msi"

Notes:
  - Token can come from -Token, or environment variables GITHUB_TOKEN or GH_TOKEN.
  - The release must already exist for the given tag.
#>

if (-not $Token) { $Token = $env:GITHUB_TOKEN }
if (-not $Token) { $Token = $env:GH_TOKEN }
if (-not $Token) { throw "A GitHub token is required. Set GITHUB_TOKEN or GH_TOKEN, or pass -Token." }

if (-not (Test-Path -LiteralPath $AssetPath)) {
  throw "AssetPath not found: $AssetPath"
}

function Get-FileName([string]$Path){
  return [System.IO.Path]::GetFileName($Path)
}

$userAgent = "BIOME-Release-Asset-Uploader"
$stdHeaders = @{ Authorization = "token $Token"; "User-Agent" = $userAgent; "Accept" = "application/vnd.github+json" }

$getReleaseUri = "https://api.github.com/repos/$RepoOwner/$RepoName/releases/tags/$Tag"
Write-Host "Fetching release for tag '$Tag' on $RepoOwner/$RepoName ..."
$release = Invoke-RestMethod -Method Get -Uri $getReleaseUri -Headers $stdHeaders

if (-not $release) { throw "Release not found for tag: $Tag" }

$uploadUrlTemplate = $release.upload_url  # .../assets{?name,label}
$assetName = Get-FileName $AssetPath
$uploadUrl = ($uploadUrlTemplate -replace "\{\?name,label\}", "?name=$assetName")

Write-Host "Uploading asset $assetName to release $Tag ..."
$assetBytes = [System.IO.File]::ReadAllBytes((Resolve-Path -LiteralPath $AssetPath))
$assetHeaders = @{ Authorization = "token $Token"; "User-Agent" = $userAgent; "Content-Type" = "application/octet-stream" }
$uploaded = Invoke-RestMethod -Method Post -Uri $uploadUrl -Headers $assetHeaders -Body $assetBytes

if (-not $uploaded) { throw "Asset upload failed." }

Write-Host "Asset uploaded: $($uploaded.browser_download_url)"
