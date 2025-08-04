# BIOME Build Script
# Build BIOME for distribution (web, desktop, or full distribution)

param(
    [string]$Mode = "web", # Options: "web", "desktop", or "distribution"
    [string]$OutputPath = ".\BIOME-Distribution",
    [string]$Version = "1.0.0"
)

$ErrorActionPreference = "Stop"

Write-Host "BIOME Builder" -ForegroundColor Cyan
Write-Host "=============" -ForegroundColor Cyan
Write-Host ""

switch ($Mode.ToLower()) {
    "web" {
        Write-Host "Building BIOME for web deployment..." -ForegroundColor Yellow
        # Build React frontend
        Set-Location "d:\DEV\BIOME\projet-analyse-image-frontend"
        npm run build
        
        # Create production package
        Set-Location "d:\DEV\BIOME"
        npm install
        
        Write-Host "Web build completed successfully!" -ForegroundColor Green
        Write-Host "To start production server: npm start" -ForegroundColor Cyan
    }
    "desktop" {
        Write-Host "Building BIOME for desktop distribution..." -ForegroundColor Yellow
        
        # Build Tauri app
        Set-Location "d:\DEV\BIOME\projet-analyse-image-frontend"
        npm run tauri-build
        
        Write-Host "Desktop build completed successfully!" -ForegroundColor Green
        Write-Host "Installer available in: projet-analyse-image-frontend\src-tauri\target\release\bundle" -ForegroundColor Cyan
    }
    "distribution" {
        # Create full distribution package
        Write-Host "Creating distribution package..." -ForegroundColor Yellow
        Set-Location "d:\DEV\BIOME"
        & "d:\DEV\BIOME\create-distribution.ps1" -OutputPath $OutputPath -Version $Version
    }
    default {
        Write-Host "Invalid mode. Use 'web', 'desktop', or 'distribution'." -ForegroundColor Red
        exit 1
    }
}
