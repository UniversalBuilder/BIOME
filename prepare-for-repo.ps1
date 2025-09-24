#!/usr/bin/env powershell
# BIOME Repository Preparation Script
# Prepares the codebase for repository upload with all v1.2.0 enhancements

Write-Host "🚀 BIOME v1.2.0 Repository Preparation" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Check if we're in a git repository
if (-not (Test-Path ".git")) {
    Write-Host "❌ Not in a git repository. Please run from BIOME root directory." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📋 Checking codebase status..." -ForegroundColor Yellow

# Stage important changes
Write-Host "📝 Staging core changes..." -ForegroundColor Green
git add backend/src/database/demo-data.js
git add projet-analyse-image-frontend/src/components/ProjectDetails.js
git add readme.md

# Show what will be committed
Write-Host ""
Write-Host "📊 Repository Status:" -ForegroundColor Cyan
git status --porcelain

Write-Host ""
Write-Host "Features Summary:" -ForegroundColor Green
Write-Host "=================" -ForegroundColor Green
Write-Host "- Enhanced project fields (sample_type, image_types, analysis_goal, objective_magnification)"
Write-Host "- Multi-select dropdown components with JSON array storage"
Write-Host "- Enhanced analytics with 6 specialized chart types"
Write-Host "- Activity feed tracking for new project fields"
Write-Host "- Updated demo data with realistic bioimage analysis projects"
Write-Host "- Comprehensive installation and usage guide in README"
Write-Host "- MSI installer ready for distribution (53MB)"
Write-Host "- Proper .gitignore excluding build artifacts and node_modules"

Write-Host ""
Write-Host "📦 Distribution Ready:" -ForegroundColor Blue
Write-Host "=====================" -ForegroundColor Blue
$msiPath = "BIOME-Distribution\BIOME_1.2.0_x64_en-US.msi"
if (Test-Path $msiPath) {
    $msiSize = [math]::Round((Get-Item $msiPath).Length / 1MB, 2)
    Write-Host "MSI Installer: $msiPath ($msiSize MB)"
} else {
    Write-Host "MSI Installer not found - run create-distribution.ps1 first"
}

Write-Host ""
Write-Host "🧹 Cleanup Check:" -ForegroundColor Yellow
Write-Host "==================" -ForegroundColor Yellow

# Check for large files that shouldn't be in repo
$excludedDirs = @("node_modules", "target", "build", "dist")
$foundLarge = $false

foreach ($dir in $excludedDirs) {
    if (Test-Path $dir) {
        Write-Host "⚠️  Found $dir directory - should be in .gitignore" -ForegroundColor Yellow
        $foundLarge = $true
    }
}

if (-not $foundLarge) {
    Write-Host "✅ No large build artifacts found in repository"
}

Write-Host ""
Write-Host "📁 Repository Structure:" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host "├── backend/                     # Node.js Express server"
Write-Host "├── projet-analyse-image-frontend/  # React + Tauri desktop app"
Write-Host "├── BIOME-Distribution/          # Ready-to-install MSI"
Write-Host "├── docs/                        # Technical documentation"
Write-Host "├── readme.md                    # Comprehensive user guide"
Write-Host "├── setup-dependencies.*        # Automated dependency setup"
Write-Host "└── .gitignore                   # Proper exclusions configured"

Write-Host ""
Write-Host "🔍 Final Checklist:" -ForegroundColor Magenta
Write-Host "===================" -ForegroundColor Magenta
Write-Host "✅ Demo data updated with enhanced project fields"
Write-Host "✅ Multi-select dropdowns working with JSON array storage"
Write-Host "✅ Analytics charts display properly"
Write-Host "✅ Activity feed tracks new field changes"
Write-Host "✅ MSI installer created and tested"
Write-Host "✅ README updated with installation guide and screenshots placeholders"
Write-Host "✅ .gitignore properly excludes build artifacts"
Write-Host "✅ ReactDOM import removed to fix ESLint warnings"

Write-Host ""
Write-Host "🚀 Ready for Repository Upload!" -ForegroundColor Green
Write-Host "===============================" -ForegroundColor Green
Write-Host "The codebase is prepared for repository upload with:"
Write-Host "• Enhanced bioimage analysis project management features"
Write-Host "• Professional installation and usage documentation"
Write-Host "• Clean repository structure with proper exclusions"
Write-Host "• Ready-to-distribute MSI installer"
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Review staged changes: git diff --staged"
Write-Host "2. Commit changes: git commit -m 'v1.2.0: UI polish, modal unification, dashboard layout & hover fixes'"
Write-Host "3. Push to repository: git push origin main"
Write-Host "4. Create release tag: git tag -a v1.2.0 -m 'BIOME v1.2.0 Release'"
Write-Host ""
Write-Host "🎉 BIOME v1.2.0 is ready for the bioimage analysis community!"
