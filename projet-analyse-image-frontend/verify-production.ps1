# BIOME Production Verification Script
# Comprehensive testing and verification after build

Write-Host "🔍 BIOME Production Build Verification" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check build artifacts
$bundleDir = "src-tauri\target\release\bundle"
$foundInstallers = @()

if (Test-Path "$bundleDir\msi") {
    $msiFiles = Get-ChildItem -Path "$bundleDir\msi" -Filter "*.msi"
    foreach ($file in $msiFiles) {
        $foundInstallers += "MSI: $($file.Name) ($([math]::Round($file.Length / 1MB, 2)) MB)"
    }
}

if (Test-Path "$bundleDir\nsis") {
    $nsisFiles = Get-ChildItem -Path "$bundleDir\nsis" -Filter "*.exe"
    foreach ($file in $nsisFiles) {
        $foundInstallers += "EXE: $($file.Name) ($([math]::Round($file.Length / 1MB, 2)) MB)"
    }
}

if ($foundInstallers.Count -eq 0) {
    Write-Host "❌ No installers found. Build may have failed." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Found installers:" -ForegroundColor Green
foreach ($installer in $foundInstallers) {
    Write-Host "   $installer" -ForegroundColor White
}
Write-Host ""

# Check if Node.js binary was included
$nodeBin = "src-tauri\bin\node.exe"
if (Test-Path $nodeBin) {
    $nodeSize = [math]::Round((Get-Item $nodeBin).Length / 1MB, 2)
    Write-Host "✅ Node.js binary included: $nodeSize MB" -ForegroundColor Green
} else {
    Write-Host "⚠️  Node.js binary not found - backend may not work in production" -ForegroundColor Yellow
}

# Check backend resources
$backendRes = "src-tauri\resources\backend"
if (Test-Path $backendRes) {
    Write-Host "✅ Backend resources bundled" -ForegroundColor Green
    if (Test-Path "$backendRes\src\server.js") {
        Write-Host "✅ Backend server.js found" -ForegroundColor Green
    } else {
        Write-Host "❌ Backend server.js missing" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️  Backend resources not found in expected location" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Test the installer on a clean machine" -ForegroundColor White
Write-Host "2. Verify the app launches without external dependencies" -ForegroundColor White
Write-Host "3. Check that the backend starts automatically" -ForegroundColor White
Write-Host "4. Ensure data loads properly (no 'Failed to fetch' errors)" -ForegroundColor White

Write-Host ""
Write-Host "🎯 Expected Behavior After Installation:" -ForegroundColor Cyan
Write-Host "- Single .exe launches complete application" -ForegroundColor White
Write-Host "- Backend server starts automatically in background" -ForegroundColor White
Write-Host "- Frontend connects to backend seamlessly" -ForegroundColor White
Write-Host "- No command-line interaction required" -ForegroundColor White

Write-Host ""
Write-Host "✅ Verification complete!" -ForegroundColor Green
