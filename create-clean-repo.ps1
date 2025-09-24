# BIOME Source Files Repository Upload Script
# This script creates a clean repository with only source code

# Essential files to include
$filesToCopy = @(
    "README.md",
    "LICENSE", 
    "package.json",
    ".gitignore",
    "backend/package.json",
    "backend/src",
    "projet-analyse-image-frontend/package.json",
    "projet-analyse-image-frontend/public",
    "projet-analyse-image-frontend/src",
    "projet-analyse-image-frontend/src-tauri/Cargo.toml",
    "projet-analyse-image-frontend/src-tauri/tauri.conf.json",
    "projet-analyse-image-frontend/src-tauri/src",
    "projet-analyse-image-frontend/src-tauri/build.rs",
    "projet-analyse-image-frontend/tailwind.config.js",
    "projet-analyse-image-frontend/postcss.config.js",
    "docs",
    "icon",
    "setup-dependencies.ps1",
    "install.ps1"
)

Write-Host "Creating clean BIOME repository with essential source files..."
Write-Host "Files to copy:"
foreach ($file in $filesToCopy) {
    if (Test-Path $file) {
        Write-Host "OK: $file"
    } else {
        Write-Host "MISSING: $file"
    }
}
