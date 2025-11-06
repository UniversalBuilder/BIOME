param(
  [Parameter(Mandatory=$true)] [string]$RepoOwner,
  [Parameter(Mandatory=$true)] [string]$RepoName,
  [Parameter(Mandatory=$true)] [string]$Tag,
  [Parameter(Mandatory=$false)] [string]$ChangelogPath,
  [Parameter(Mandatory=$false)] [string]$MsiPath,
  [Parameter(Mandatory=$false)] [string]$BodyOverride
)

$ErrorActionPreference = 'Stop'

# Retrieve token from environment if not provided explicitly
if (-not $Token) { $Token = $env:GITHUB_TOKEN }
if (-not $Token) { $Token = $env:GH_TOKEN }
if (-not $Token) { throw "A GitHub token is required. Set GITHUB_TOKEN or GH_TOKEN." }

if ($BodyOverride) {
  $body = $BodyOverride
}
else {
  if (-not $ChangelogPath) { throw "ChangelogPath is required when BodyOverride is not provided." }
  if (-not (Test-Path -LiteralPath $ChangelogPath)) { throw "Changelog not found: $ChangelogPath" }
  # Read changelog and extract the section for the given tag (e.g., v1.3.0 -> 1.3.0)
  $version = $Tag.TrimStart('v')
  $text = [System.IO.File]::ReadAllText((Resolve-Path -LiteralPath $ChangelogPath))
  $regex = New-Object System.Text.RegularExpressions.Regex("## \[$([Regex]::Escape($version))\][\s\S]*?(?=^## \[|\z)", [System.Text.RegularExpressions.RegexOptions]::Multiline)
  $match = $regex.Match($text)
  if (-not $match.Success) { throw "Could not extract section for version $version from changelog." }
  $body = $match.Value
}

# Normalize newlines to LF for GitHub API consistency
$body = $body -replace "`r`n", "`n"
$body = $body -replace "`r", "`n"

# Optionally append checksum
if ($MsiPath) {
  if (-not (Test-Path -LiteralPath $MsiPath)) { throw "MSI not found: $MsiPath" }
  $hash = (Get-FileHash -LiteralPath $MsiPath -Algorithm 'SHA256').Hash
  $body += "`n`nChecksum (SHA256): $hash"
}

$userAgent = "BIOME-Release-Update"
$headers = @{ Authorization = "token $Token"; "User-Agent" = $userAgent; "Accept" = "application/vnd.github+json" }

# Get release by tag
$release = Invoke-RestMethod -Method Get -Uri "https://api.github.com/repos/$RepoOwner/$RepoName/releases/tags/$Tag" -Headers $headers
if (-not $release) { throw "Release $Tag not found." }

# Patch release body
# Build JSON payload explicitly to avoid PowerShell object quirks
$jsonBody = '{' + '"body": ' + (ConvertTo-Json -Compress -Depth 4 $body) + '}'
Invoke-RestMethod -Method Patch -Uri "https://api.github.com/repos/$RepoOwner/$RepoName/releases/$($release.id)" -Headers $headers -ContentType 'application/json' -Body $jsonBody | Out-Null

Write-Host "Updated release $Tag body successfully."
