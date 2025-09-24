# Simple BIOME Build Script
param([string]$Target = "msi")

Write-Host "Building BIOME Desktop App..." -ForegroundColor Cyan

# Check directory
if (-not (Test-Path "package.json")) {
    Write-Host "Error: Run from projet-analyse-image-frontend directory" -ForegroundColor Red
    exit 1
}

# Build React frontend
Write-Host "Building React frontend..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to build frontend" -ForegroundColor Red
    exit 1
}

# Build Tauri app
Write-Host "Building Tauri application..." -ForegroundColor Yellow

if ($Target -eq "msi") {
    tauri build --bundles msi
} elseif ($Target -eq "exe") {
    tauri build --bundles nsis
} elseif ($Target -eq "both") {
    tauri build --bundles msi,nsis
} else {
    tauri build
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "Tauri build failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Build completed!" -ForegroundColor Green
Write-Host "Check: src-tauri\target\release\bundle\" -ForegroundColor Cyan
