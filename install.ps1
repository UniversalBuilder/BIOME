# BIOME Desktop Installer Script
# This script installs BIOME as a desktop application on Windows

param(
    [string]$InstallPath = "$env:LOCALAPPDATA\BIOME",
    [string]$DesktopShortcut = $true
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Display header
Write-Host "BIOME Desktop Installer" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "[OK] Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js is required but not installed" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org" -ForegroundColor Yellow
    Write-Host "Minimum version: 14.0.0" -ForegroundColor Yellow
    Read-Host "Press any key to exit"
    exit 1
}

# Check Node.js version
$nodeVersionNumber = ($nodeVersion -replace "v", "").Split(".")[0]
if ([int]$nodeVersionNumber -lt 14) {
    Write-Host "[ERROR] Node.js version $nodeVersion is too old" -ForegroundColor Red
    Write-Host "Please install Node.js 14.0.0 or higher" -ForegroundColor Yellow
    Read-Host "Press any key to exit"
    exit 1
}

# Create installation directory
Write-Host "[INFO] Creating installation directory..." -ForegroundColor Yellow
if (Test-Path $InstallPath) {
    Write-Host "[WARN] Installation directory already exists. Removing old version..." -ForegroundColor Yellow
    Remove-Item -Path $InstallPath -Recurse -Force
}
New-Item -ItemType Directory -Path $InstallPath -Force | Out-Null

# Copy application files
Write-Host "[INFO] Installing BIOME application..." -ForegroundColor Yellow
$currentDir = Get-Location
Copy-Item -Path "$currentDir\*" -Destination $InstallPath -Recurse -Force -Exclude @("install.ps1", "*.zip", "node_modules")

# Change to installation directory
Set-Location $InstallPath

# Install dependencies
Write-Host "[INFO] Installing dependencies..." -ForegroundColor Yellow
npm install --production

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to install dependencies" -ForegroundColor Red
    Read-Host "Press any key to exit"
    exit 1
}

# Build the application
Write-Host "[INFO] Building application..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to build application" -ForegroundColor Red
    Read-Host "Press any key to exit"
    exit 1
}

# Create launcher script
Write-Host "[INFO] Creating launcher..." -ForegroundColor Yellow
$launcherContent = @"
# BIOME Application Launcher
# This script starts BIOME and opens it in a dedicated browser window

`$host.ui.RawUI.WindowTitle = "BIOME Launcher"
`$ErrorActionPreference = "Stop"

Write-Host "Starting BIOME..." -ForegroundColor Cyan

# Change to installation directory
Set-Location "$InstallPath"

# Start the server in background
`$job = Start-Job -ScriptBlock {
    Set-Location "$InstallPath"
    npm start
}

# Wait for server to start
Write-Host "Waiting for server to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Check if server is running
try {
    `$response = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -TimeoutSec 5 -UseBasicParsing
    if (`$response.StatusCode -eq 200) {
        Write-Host "BIOME server is running" -ForegroundColor Green
    }
} catch {
    Write-Host "Server starting (this may take a moment)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
}

# Launch in browser with app-like experience
Write-Host "Opening BIOME in browser..." -ForegroundColor Yellow
Start-Process "chrome.exe" -ArgumentList "--app=http://localhost:3001", "--new-window", "--disable-extensions", "--disable-plugins", "--disable-default-apps" -ErrorAction SilentlyContinue

if (`$LASTEXITCODE -ne 0) {
    # Fallback to Edge
    Start-Process "msedge.exe" -ArgumentList "--app=http://localhost:3001", "--new-window" -ErrorAction SilentlyContinue
    
    if (`$LASTEXITCODE -ne 0) {
        # Fallback to default browser
        Start-Process "http://localhost:3001"
    }
}

Write-Host ""
Write-Host "BIOME is now running!" -ForegroundColor Green
Write-Host "URL: http://localhost:3001" -ForegroundColor Cyan
Write-Host "Access your app in the browser window that just opened" -ForegroundColor Cyan
Write-Host ""
Write-Host "To stop BIOME, close this window or press Ctrl+C" -ForegroundColor Yellow
Write-Host ""

# Keep the script running and monitor the job
try {
    while (`$job.State -eq "Running") {
        Start-Sleep -Seconds 1
    }
} catch {
    Write-Host "BIOME server stopped" -ForegroundColor Red
}

# Cleanup
Remove-Job -Job `$job -Force -ErrorAction SilentlyContinue
"@

Set-Content -Path "$InstallPath\launch-biome.ps1" -Value $launcherContent -Encoding UTF8

# Create desktop shortcut
if ($DesktopShortcut) {
    Write-Host "[INFO] Creating desktop shortcut..." -ForegroundColor Yellow
    
    $desktopPath = [Environment]::GetFolderPath("Desktop")
    $shortcutPath = "$desktopPath\BIOME.lnk"
    
    $WScriptShell = New-Object -ComObject WScript.Shell
    $shortcut = $WScriptShell.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = "powershell.exe"
    $shortcut.Arguments = "-WindowStyle Hidden -ExecutionPolicy Bypass -File `"$InstallPath\launch-biome.ps1`""
    $shortcut.WorkingDirectory = $InstallPath
    $shortcut.Description = "BIOME - Bio Imaging Organization and Management Environment"
    $shortcut.IconLocation = "$InstallPath\assets\biome-icon.ico,0"
    $shortcut.Save()
    
    Write-Host "[OK] Desktop shortcut created" -ForegroundColor Green
}

# Create Start Menu shortcut
Write-Host "[INFO] Creating Start Menu shortcut..." -ForegroundColor Yellow
$startMenuPath = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs"
$startMenuShortcut = "$startMenuPath\BIOME.lnk"

$WScriptShell = New-Object -ComObject WScript.Shell
$shortcut = $WScriptShell.CreateShortcut($startMenuShortcut)
$shortcut.TargetPath = "powershell.exe"
$shortcut.Arguments = "-WindowStyle Hidden -ExecutionPolicy Bypass -File `"$InstallPath\launch-biome.ps1`""
$shortcut.WorkingDirectory = $InstallPath
$shortcut.Description = "BIOME - Bio Imaging Organization and Management Environment"
$shortcut.IconLocation = "$InstallPath\assets\biome-icon.ico,0"
$shortcut.Save()

# Create uninstaller
Write-Host "[INFO] Creating uninstaller..." -ForegroundColor Yellow
$uninstallerContent = @"
# BIOME Uninstaller
Write-Host "Uninstalling BIOME..." -ForegroundColor Yellow

# Remove desktop shortcut
`$desktopShortcut = "`$env:USERPROFILE\Desktop\BIOME.lnk"
if (Test-Path `$desktopShortcut) {
    Remove-Item `$desktopShortcut -Force
    Write-Host "Desktop shortcut removed" -ForegroundColor Green
}

# Remove Start Menu shortcut
`$startMenuShortcut = "`$env:APPDATA\Microsoft\Windows\Start Menu\Programs\BIOME.lnk"
if (Test-Path `$startMenuShortcut) {
    Remove-Item `$startMenuShortcut -Force
    Write-Host "Start Menu shortcut removed" -ForegroundColor Green
}

# Remove installation directory
if (Test-Path "$InstallPath") {
    Remove-Item "$InstallPath" -Recurse -Force
    Write-Host "Application files removed" -ForegroundColor Green
}

Write-Host ""
Write-Host "BIOME has been successfully uninstalled" -ForegroundColor Green
Read-Host "Press any key to exit"
"@

Set-Content -Path "$InstallPath\uninstall.ps1" -Value $uninstallerContent -Encoding UTF8

# Create info file
$infoContent = @"
BIOME Desktop Application
========================

Installation Path: $InstallPath
Installation Date: $(Get-Date)
Node.js Version: $nodeVersion

How to use:
* Double-click the BIOME shortcut on your desktop
* Or find BIOME in your Start Menu
* The app will open in a dedicated browser window

To uninstall:
* Run the uninstall.ps1 script in the installation directory
* Or manually delete the installation folder and shortcuts

Support:
* Check the README.md file for documentation
* Log files are stored in the logs directory
"@

Set-Content -Path "$InstallPath\INSTALLATION_INFO.txt" -Value $infoContent -Encoding UTF8

# Return to original directory
Set-Location $currentDir

# Installation complete
Write-Host ""
Write-Host "BIOME Installation Complete!" -ForegroundColor Green
Write-Host "============================" -ForegroundColor Green
Write-Host ""
Write-Host "[OK] Installed to: $InstallPath" -ForegroundColor Cyan
Write-Host "[OK] Desktop shortcut created" -ForegroundColor Cyan
Write-Host "[OK] Start Menu shortcut created" -ForegroundColor Cyan
Write-Host ""
Write-Host "To start BIOME:" -ForegroundColor Yellow
Write-Host "   - Double-click the BIOME shortcut on your desktop" -ForegroundColor White
Write-Host "   - Or find BIOME in your Start Menu" -ForegroundColor White
Write-Host ""
Write-Host "To uninstall:" -ForegroundColor Yellow
Write-Host "   - Run: $InstallPath\uninstall.ps1" -ForegroundColor White
Write-Host ""
Write-Host "Documentation: $InstallPath\README.md" -ForegroundColor Cyan
Write-Host ""

Read-Host "Press any key to exit"
