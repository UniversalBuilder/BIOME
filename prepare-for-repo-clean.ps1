# BIOME Repository Preparation Script v1.2.0
# This script checks the project status and prepares it for repository upload

param(
    [switch]$SkipChecks
)

$projectRoot = $PWD.Path
Write-Host "BIOME Repository Preparation v1.2.0" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host "Project Root: $projectRoot"
Write-Host ""

# Check git status
Write-Host "Repository Status:" -ForegroundColor Cyan
Write-Host "=================" -ForegroundColor Cyan
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "Changes detected:"
    git status --short
} else {
    Write-Host "Working directory clean"
}

Write-Host ""
Write-Host "Features Summary:" -ForegroundColor Green
Write-Host "=================" -ForegroundColor Green
Write-Host "- Enhanced project fields: sample_type, image_types, analysis_goal, objective_magnification"
Write-Host "- Multi-select dropdown components with JSON array storage"
Write-Host "- Enhanced analytics with 6 specialized chart types"
Write-Host "- Activity feed tracking for new project fields"
Write-Host "- Updated demo data with realistic bioimage analysis projects"
Write-Host "- Desktop application with MSI installer for Windows"
Write-Host "- Web application with responsive design"
Write-Host "- SQLite database with sample bioimage analysis data"

Write-Host ""
Write-Host "Distribution Ready:" -ForegroundColor Blue
Write-Host "==================" -ForegroundColor Blue
$msiPath = "BIOME-Distribution\BIOME_1.2.0_x64_en-US.msi"
if (Test-Path $msiPath) {
    $msiSize = [math]::Round((Get-Item $msiPath).Length / 1MB, 2)
    Write-Host "MSI Installer: $msiPath ($msiSize MB)"
} else {
    Write-Host "MSI Installer not found - run create-distribution.ps1 first"
}

Write-Host ""
Write-Host "Cleanup Check:" -ForegroundColor Yellow
Write-Host "==============" -ForegroundColor Yellow

# Check for large files that shouldn't be in repo
$excludedDirs = @("node_modules", "target", "build", "dist")
$foundLarge = $false

foreach ($dir in $excludedDirs) {
    if (Test-Path $dir) {
        Write-Host "WARNING: Found $dir directory - should be in .gitignore" -ForegroundColor Yellow
        $foundLarge = $true
    }
}

if (-not $foundLarge) {
    Write-Host "CLEAN: No large build artifacts found in repository"
}

Write-Host ""
Write-Host "Key Files Status:" -ForegroundColor Magenta
Write-Host "=================" -ForegroundColor Magenta

$keyFiles = @(
    "README.md",
    "package.json", 
    "LICENSE",
    "backend/package.json",
    "projet-analyse-image-frontend/package.json",
    "backend/src/server.js",
    "projet-analyse-image-frontend/src/App.js"
)

foreach ($file in $keyFiles) {
    if (Test-Path $file) {
        Write-Host "FOUND: $file"
    } else {
        Write-Host "MISSING: $file" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Dependencies Status:" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan

# Check backend dependencies
$backendPath = Join-Path $projectRoot "backend"
if (Test-Path (Join-Path $backendPath "node_modules")) {
    Write-Host "Backend node_modules installed"
} else {
    Write-Host "Backend dependencies missing - run install.ps1"
}

if (Test-Path (Join-Path $backendPath "data\database.sqlite")) {
    Write-Host "Backend database exists"
} else {
    Write-Host "Backend database missing"
}

# Check frontend dependencies  
$frontendPath = Join-Path $projectRoot "projet-analyse-image-frontend"
if (Test-Path (Join-Path $frontendPath "node_modules")) {
    Write-Host "Frontend node_modules installed"
} else {
    Write-Host "Frontend dependencies missing"
}

if (Test-Path (Join-Path $frontendPath "build")) {
    Write-Host "Frontend build exists"
} else {
    Write-Host "Frontend build missing"
}

Write-Host ""
Write-Host "Final Steps for Repository Upload:" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host "1. Review and stage changes: git add ."
Write-Host "2. Commit changes: git commit -m 'BIOME v1.2.0 - UI polish, modal unification, dashboard fixes'"
Write-Host "3. Push to repository: git push origin main"
Write-Host "4. Create release tag: git tag -a v1.2.0 -m 'BIOME v1.2.0 Release'"
Write-Host ""
Write-Host "BIOME v1.2.0 is ready for the bioimage analysis community!" -ForegroundColor Green
