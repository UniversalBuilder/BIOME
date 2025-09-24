# BIOME Development Starter
# Start BIOME in development mode (web or desktop)

param(
    [string]$Mode = "web" # Options: "web" or "desktop"
)

$ErrorActionPreference = "Stop"

Write-Host "BIOME Development Starter" -ForegroundColor Cyan
Write-Host "=======================" -ForegroundColor Cyan
Write-Host ""

# Navigate to frontend directory
Set-Location "d:\DEV\BIOME\projet-analyse-image-frontend"

switch ($Mode.ToLower()) {
    "web" {
        Write-Host "Starting BIOME in web mode..." -ForegroundColor Yellow
        npm run start-both
    }
    "desktop" {
        Write-Host "Starting BIOME in desktop mode..." -ForegroundColor Yellow
        Start-Process PowerShell -ArgumentList "-Command npm run start-backend"
        Write-Host "Started backend server in a new window" -ForegroundColor Green
        Write-Host "Starting Tauri application..." -ForegroundColor Yellow
        Start-Sleep -Seconds 2
        npm run tauri-dev
    }
    default {
        Write-Host "Invalid mode. Use 'web' or 'desktop'." -ForegroundColor Red
        exit 1
    }
}
