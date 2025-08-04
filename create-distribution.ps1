# BIOME Distribution Package Creator
# This script creates MSI installers using Tauri's bundling system

param(
    [string]$OutputPath = ".\BIOME-Distribution",
    [string]$Version = "1.0.0",
    [switch]$Clean = $false
)

$ErrorActionPreference = "Stop"

Write-Host "BIOME MSI Installer Creator" -ForegroundColor Cyan
Write-Host "===========================" -ForegroundColor Cyan
Write-Host ""

# Create output directory
if (Test-Path $OutputPath) {
    Write-Host "Cleaning previous distribution..." -ForegroundColor Yellow
    Remove-Item -Path $OutputPath -Recurse -Force
}
New-Item -ItemType Directory -Path $OutputPath -Force | Out-Null

Write-Host "Building BIOME Desktop Application..." -ForegroundColor Yellow
Write-Host ""

# Navigate to frontend directory
Push-Location "projet-analyse-image-frontend"

try {
    # Ensure dependencies are installed
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install

    # Build the React frontend
    Write-Host "Building React frontend..." -ForegroundColor Yellow
    npm run build

    # Build the Tauri MSI installer
    Write-Host "Building MSI installer with Tauri..." -ForegroundColor Yellow
    npm run tauri build

    # Copy the MSI to our distribution folder
    $tauriOutputPath = "src-tauri\target\release\bundle\msi"
    if (Test-Path $tauriOutputPath) {
        Write-Host "Copying MSI installer..." -ForegroundColor Yellow
        Copy-Item -Path "$tauriOutputPath\*.msi" -Destination "..\$OutputPath" -Force
        
        # Get the MSI file info
        $msiFiles = Get-ChildItem -Path "..\$OutputPath\*.msi"
        foreach ($msi in $msiFiles) {
            $msiSizeMB = [math]::Round($msi.Length / 1MB, 2)
            Write-Host ""
            Write-Host "MSI Installer Created!" -ForegroundColor Green
            Write-Host "======================" -ForegroundColor Green
            Write-Host ""
            Write-Host "Installer: $($msi.Name)" -ForegroundColor Cyan
            Write-Host "Size: $msiSizeMB MB" -ForegroundColor Cyan
            Write-Host "Created: $(Get-Date)" -ForegroundColor Cyan
        }
    } else {
        Write-Host "Error: MSI build failed - no output found in $tauriOutputPath" -ForegroundColor Red
        exit 1
    }

} finally {
    Pop-Location
}

# Create installation instructions for the MSI
Write-Host "Creating installation instructions..." -ForegroundColor Yellow
$installInstructions = "# BIOME Desktop Application - Installation Instructions

## System Requirements
* Windows 10/11 (64-bit)
* 500MB free disk space
* Administrative privileges for installation

## Installation Steps

### Standard Installation
1. Download the BIOME MSI installer
2. Right-click the MSI file and select 'Run as administrator'
3. Follow the installation wizard
4. Launch BIOME from Start Menu or Desktop shortcut

### Silent Installation (IT Administrators)
Use the command line for silent installation:
msiexec /i BIOME-v$Version.msi /quiet

### Uninstallation
* Use Windows 'Add or Remove Programs'
* Or run: msiexec /uninstall BIOME-v$Version.msi

## First Launch
* BIOME will create a local database on first run
* The application runs as a native desktop app
* Data is stored securely in your user profile

## Features
* Native Windows desktop application
* Local SQLite database
* Bioimage analysis project management
* No internet connection required after installation

## Support
For issues or questions, refer to the documentation or contact support."

Set-Content -Path "$OutputPath\INSTALL_INSTRUCTIONS.txt" -Value $installInstructions -Encoding UTF8

Write-Host ""
Write-Host "Distribution Complete!" -ForegroundColor Green
Write-Host "=====================" -ForegroundColor Green
Write-Host ""
Write-Host "Ready for Distribution!" -ForegroundColor Green
Write-Host ""
Write-Host "To distribute:" -ForegroundColor Yellow
Write-Host "1. Share the MSI installer with users" -ForegroundColor White
Write-Host "2. Users run the MSI as administrator" -ForegroundColor White
Write-Host "3. BIOME installs as a native Windows app" -ForegroundColor White
Write-Host ""

# Open the distribution folder
Start-Process -FilePath $OutputPath
