#!/usr/bin/env powershell
<#
.SYNOPSIS
    Sets up all dependencies for BIOME project
.DESCRIPTION
    Installs npm dependencies for frontend/backend and sets up Tauri build environment
.PARAMETER Clean
    Remove existing dependencies before installing
.PARAMETER Verbose
    Show detailed output during execution
#>

param(
    [switch]$Clean,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message, [string]$Color = "Cyan")
    Write-Host $Message -ForegroundColor $Color
}

function Write-Success {
    param([string]$Message)
    Write-Host "   ✅ $Message" -ForegroundColor Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "   📁 $Message" -ForegroundColor DarkBlue
}

Write-Step "🔧 Setting up BIOME dependencies..."

# Clean existing dependencies if requested
if ($Clean) {
    Write-Step "🧹 Cleaning existing dependencies..." "Yellow"
    
    $cleanPaths = @(
        "projet-analyse-image-frontend\node_modules",
        "backend\node_modules", 
        "projet-analyse-image-frontend\src-tauri\resources\backend\node_modules",
        "projet-analyse-image-frontend\src-tauri\bin",
        "projet-analyse-image-frontend\build",
        "projet-analyse-image-frontend\src-tauri\target"
    )
    
    foreach ($path in $cleanPaths) {
        if (Test-Path $path) {
            Remove-Item $path -Recurse -Force
            Write-Success "Removed $path"
        }
    }
}

# Install frontend dependencies
Write-Step "🦀 Installing frontend dependencies..." "Blue"
Push-Location "projet-analyse-image-frontend"
try {
    if ($Verbose) {
        npm install
    } else {
        npm install --silent
    }
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to install frontend dependencies"
    }
} finally {
    Pop-Location
}
Write-Success "Frontend dependencies installed"

# Install backend dependencies
Write-Step "🦀 Installing backend dependencies..." "Blue"
Push-Location "backend"
try {
    if ($Verbose) {
        npm install
    } else {
        npm install --silent
    }
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to install backend dependencies"
    }
} finally {
    Pop-Location
}
Write-Success "Backend dependencies installed"

# Setup Tauri build environment
Write-Step "🦀 Setting up Tauri build environment..." "Blue"

# Create resources directory structure
$resourcesDir = "projet-analyse-image-frontend\src-tauri\resources"
if (-not (Test-Path $resourcesDir)) {
    New-Item -ItemType Directory -Path $resourcesDir -Force | Out-Null
}

# Copy backend to resources (excluding node_modules)
$backendResourcesDir = Join-Path $resourcesDir "backend"
if (Test-Path $backendResourcesDir) {
    Remove-Item $backendResourcesDir -Recurse -Force
}

Write-Info "Copying backend to resources..."
if ($Verbose) {
    robocopy "backend" $backendResourcesDir /E /XD node_modules target .git /XF "*.log"
} else {
    robocopy "backend" $backendResourcesDir /E /XD node_modules target .git /XF "*.log" /NFL /NDL /NP | Out-Null
}

# Install backend dependencies in resources directory
Write-Info "Installing backend dependencies in resources..."
Push-Location $backendResourcesDir
try {
    if ($Verbose) {
        npm install --omit=dev
    } else {
        npm install --omit=dev --silent
    }
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to install backend dependencies in resources"
    }
} finally {
    Pop-Location
}

# Setup Node.js binary for bundling
$binDir = Join-Path $PSScriptRoot "projet-analyse-image-frontend\src-tauri\bin"
if (-not (Test-Path $binDir)) {
    New-Item -ItemType Directory -Path $binDir -Force | Out-Null
}

# Find Node.js executable
$nodeExe = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $nodeExe) {
    Write-Warning "Node.js not found in PATH. Please install Node.js and try again."
    throw "Node.js not found in PATH"
}

if ($Verbose) {
    Write-Host "   📍 Node.js found at: $nodeExe" -ForegroundColor DarkGray
    Write-Host "   📍 Target directory: $binDir" -ForegroundColor DarkGray
}

Write-Info "Copying Node.js executable..."
Copy-Item $nodeExe "$binDir\node.exe" -Force
Copy-Item $nodeExe "$binDir\node-x86_64-pc-windows-msvc.exe" -Force

Write-Success "Tauri build environment ready"

Write-Step "🎉 All dependencies set up successfully!" "Green"
Write-Host ""
Write-Step "Next steps:" "Cyan"
Write-Host "  • Development: cd projet-analyse-image-frontend && npm run start-both" -ForegroundColor White
Write-Host "  • Desktop dev: cd projet-analyse-image-frontend && npm run tauri-dev" -ForegroundColor White
Write-Host "  • Production build: cd projet-analyse-image-frontend && npm run simple-msi" -ForegroundColor White
