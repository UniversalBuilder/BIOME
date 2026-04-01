# Simple BIOME Build Script
param([string]$Target = "msi")

$ErrorActionPreference = "Stop"

Write-Host "Building BIOME Desktop App..." -ForegroundColor Cyan

# Check directory
if (-not (Test-Path "package.json")) {
    Write-Host "Error: Run from projet-analyse-image-frontend directory" -ForegroundColor Red
    exit 1
}

$validTargets = @("msi", "exe", "both", "portable-only", "msi-portable", "both-portable")
if ($Target -notin $validTargets) {
    Write-Host "Error: Invalid target '$Target'. Valid targets: $($validTargets -join ', ')" -ForegroundColor Red
    exit 1
}

try {
    $packageJson = Get-Content -Raw -Path "package.json" | ConvertFrom-Json
    $version = $packageJson.version
    if (-not $version) {
        throw "Missing version field in package.json"
    }
} catch {
    Write-Host "Error: Failed to read version from package.json" -ForegroundColor Red
    exit 1
}

function New-PortableZip {
    param([string]$Version)

    $releaseDir = "src-tauri\target\release"
    $distributionDir = "..\BIOME-Distribution"
    $zipName = "BIOME_${Version}_portable_windows_x64.zip"
    $zipPath = Join-Path $distributionDir $zipName
    $hashPath = "$zipPath.sha256"

    $exePath = Join-Path $releaseDir "BIOME.exe"
    if (-not (Test-Path $exePath)) {
        throw "Required file not found: $exePath"
    }

    if (-not (Test-Path $distributionDir)) {
        New-Item -ItemType Directory -Path $distributionDir -Force | Out-Null
    }

    $stagingDir = Join-Path $env:TEMP ("BIOME_portable_" + [System.Guid]::NewGuid().ToString("N"))
    New-Item -ItemType Directory -Path $stagingDir -Force | Out-Null

    try {
        Copy-Item -Path $exePath -Destination $stagingDir -Force

        # Sentinel used at runtime to detect portable mode and isolate database paths.
        Set-Content -Path (Join-Path $stagingDir "BIOME_PORTABLE") -Value "portable" -NoNewline

        $optionalItems = @("node.exe", "resources", "_up_")
        foreach ($item in $optionalItems) {
            $source = Join-Path $releaseDir $item
            if (Test-Path $source) {
                Copy-Item -Path $source -Destination (Join-Path $stagingDir $item) -Recurse -Force
            }
        }

        if (Test-Path $zipPath) {
            Remove-Item -Path $zipPath -Force
        }

        Compress-Archive -Path (Join-Path $stagingDir "*") -DestinationPath $zipPath -CompressionLevel Optimal

        $sha256 = (Get-FileHash -Path $zipPath -Algorithm SHA256).Hash
        Set-Content -Path $hashPath -Value $sha256

        Write-Host "Portable ZIP: $zipPath" -ForegroundColor Green
        Write-Host "SHA-256: $sha256" -ForegroundColor Green
    } finally {
        if (Test-Path $stagingDir) {
            Remove-Item -Path $stagingDir -Recurse -Force
        }
    }
}

# Build React frontend
Write-Host "Building React frontend..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to build frontend" -ForegroundColor Red
    exit 1
}

# Build Tauri app
if ($Target -ne "portable-only") {
    Write-Host "Building Tauri application..." -ForegroundColor Yellow

    if ($Target -eq "msi" -or $Target -eq "msi-portable") {
        tauri build --bundles msi
    } elseif ($Target -eq "exe") {
        tauri build --bundles nsis
    } elseif ($Target -eq "both" -or $Target -eq "both-portable") {
        tauri build --bundles msi,nsis
    } else {
        tauri build
    }

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Tauri build failed" -ForegroundColor Red
        exit 1
    }

    if ($Target -in @("msi", "both", "msi-portable", "both-portable")) {
        $msiSource = "src-tauri\target\release\bundle\msi\BIOME_${version}_x64_en-US.msi"
        $msiDestDir = "..\BIOME-Distribution"
        $msiDestPath = Join-Path $msiDestDir "BIOME_${version}_x64_en-US.msi"
        
        if (Test-Path $msiSource) {
            if (-not (Test-Path $msiDestDir)) { New-Item -ItemType Directory -Path $msiDestDir -Force | Out-Null }
            Copy-Item -Path $msiSource -Destination $msiDestPath -Force
            $sha256 = (Get-FileHash -Path $msiDestPath -Algorithm SHA256).Hash
            Set-Content -Path "$msiDestPath.sha256" -Value $sha256
            
            Write-Host "Copied MSI to: $msiDestPath" -ForegroundColor Green
            Write-Host "MSI SHA-256: $sha256" -ForegroundColor Green
        } else {
            Write-Host "Warning: Expected MSI source not found at $msiSource" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "Skipping Tauri build for portable-only target (using existing release binaries)." -ForegroundColor Yellow
}

if ($Target -in @("portable-only", "msi-portable", "both-portable")) {
    try {
        New-PortableZip -Version $version
    } catch {
        Write-Host "Portable packaging failed: $_" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Build completed!" -ForegroundColor Green
Write-Host "Check: src-tauri\target\release\bundle\" -ForegroundColor Cyan
if ($Target -in @("portable-only", "msi-portable", "both-portable")) {
    Write-Host "Portable output: ..\BIOME-Distribution\BIOME_${version}_portable_windows_x64.zip" -ForegroundColor Cyan
}
