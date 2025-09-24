# BIOME Production Test Script
# Test the production build before distribution

$ErrorActionPreference = "Stop"

Write-Host "🧪 BIOME Production Build Test" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

# Check if build artifacts exist
$msiPath = "src-tauri\target\release\bundle\msi"
$nsisPath = "src-tauri\target\release\bundle\nsis"

if (-not (Test-Path $msiPath) -and -not (Test-Path $nsisPath)) {
    Write-Host "❌ No build artifacts found. Run build-production.ps1 first." -ForegroundColor Red
    exit 1
}

Write-Host "📦 Found build artifacts:" -ForegroundColor Green

if (Test-Path $msiPath) {
    $msiFiles = Get-ChildItem -Path $msiPath -Filter "*.msi"
    foreach ($file in $msiFiles) {
        Write-Host "   MSI: $($file.Name)" -ForegroundColor White
        Write-Host "   Size: $([math]::Round($file.Length / 1MB, 2)) MB" -ForegroundColor Gray
    }
}

if (Test-Path $nsisPath) {
    $nsisFiles = Get-ChildItem -Path $nsisPath -Filter "*.exe"
    foreach ($file in $nsisFiles) {
        Write-Host "   EXE: $($file.Name)" -ForegroundColor White
        Write-Host "   Size: $([math]::Round($file.Length / 1MB, 2)) MB" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "🔍 Testing build configuration..." -ForegroundColor Yellow

# Check Tauri config
$tauriConfig = Get-Content -Path "src-tauri\tauri.conf.json" -Raw | ConvertFrom-Json
Write-Host "✅ App Name: $($tauriConfig.productName)" -ForegroundColor Green
Write-Host "✅ Version: $($tauriConfig.version)" -ForegroundColor Green
Write-Host "✅ Identifier: $($tauriConfig.identifier)" -ForegroundColor Green

# Check if resources are configured
if ($tauriConfig.bundle.resources) {
    Write-Host "✅ Resources configured: $($tauriConfig.bundle.resources.Count) items" -ForegroundColor Green
} else {
    Write-Host "⚠️  No resources configured" -ForegroundColor Yellow
}

# Check bundle targets
if ($tauriConfig.bundle.targets) {
    Write-Host "✅ Bundle targets: $($tauriConfig.bundle.targets -join ', ')" -ForegroundColor Green
} else {
    Write-Host "⚠️  No bundle targets specified" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📋 Installation Instructions:" -ForegroundColor Cyan
Write-Host "1. Run the installer (.msi or .exe)" -ForegroundColor White
Write-Host "2. Launch BIOME from desktop shortcut or Start Menu" -ForegroundColor White
Write-Host "3. The app should start with an integrated backend server" -ForegroundColor White
Write-Host "4. No additional setup or command-line interaction needed" -ForegroundColor White

Write-Host ""
Write-Host "🔧 Troubleshooting Tips:" -ForegroundColor Cyan
Write-Host "- If the app doesn't start, check Windows Event Viewer for errors" -ForegroundColor White
Write-Host "- Backend logs are stored in the app data directory" -ForegroundColor White
Write-Host "- The app should work completely offline" -ForegroundColor White

Write-Host ""
Write-Host "✅ Production build test completed!" -ForegroundColor Green
