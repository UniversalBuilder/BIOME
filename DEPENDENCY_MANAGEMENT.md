# BIOME Dependency Management

## Overview

The BIOME project excludes large dependency folders from Git to keep the repository lightweight. Dependencies are automatically downloaded and set up when needed.

## Excluded from Git

The following files and directories are excluded from Git tracking:

- `node_modules/` folders (all locations)
- `projet-analyse-image-frontend/src-tauri/target/` (Rust build artifacts)
- `projet-analyse-image-frontend/src-tauri/resources/backend/node_modules/` (bundled dependencies)
- `projet-analyse-image-frontend/src-tauri/bin/` (Node.js binaries)
- Build artifacts (`.msi`, `.exe`, `build/`, `dist/`)
- Database files (`*.sqlite`, `*.sqlite-wal`, `*.sqlite-shm`)
- Log files (`*.log`, `logs/`)
- Cache directories (`.cache/`, `.temp/`, `.tauri/`)

## Setting Up Dependencies

### Quick Setup (Recommended)

**Option A: Batch Script (Most Reliable)**
```cmd
setup-dependencies.bat
```

**Option B: PowerShell Script**
```powershell
.\setup-dependencies.ps1
```

With verbose output:
```powershell
.\setup-dependencies.ps1 -Verbose
```

### Manual Setup (If Automated Scripts Fail)

If the automated script has issues, you can set up dependencies manually:

#### 1. Install Frontend Dependencies
```powershell
cd projet-analyse-image-frontend
npm install
cd ..
```

#### 2. Install Backend Dependencies  
```powershell
cd backend
npm install
cd ..
```

#### 3. Setup Tauri Build Environment
```powershell
# Create resources directory
New-Item -ItemType Directory -Path "projet-analyse-image-frontend\src-tauri\resources" -Force

# Copy backend to resources
$backendResourcesDir = "projet-analyse-image-frontend\src-tauri\resources\backend"
if (Test-Path $backendResourcesDir) { Remove-Item $backendResourcesDir -Recurse -Force }
robocopy "backend" $backendResourcesDir /E /XD node_modules target .git /XF "*.log" /NFL /NDL /NP

# Install backend dependencies in resources
cd projet-analyse-image-frontend\src-tauri\resources\backend
npm install --omit=dev
cd ..\..\..\..

# Setup Node.js binary
New-Item -ItemType Directory -Path "projet-analyse-image-frontend\src-tauri\bin" -Force
$nodeExe = (Get-Command node).Source
Copy-Item $nodeExe "projet-analyse-image-frontend\src-tauri\bin\node.exe" -Force
Copy-Item $nodeExe "projet-analyse-image-frontend\src-tauri\bin\node-x86_64-pc-windows-msvc.exe" -Force
```

### First Time Setup
```powershell
cd d:\DEV\BIOME
.\setup-dependencies.ps1
```

### Clean Setup (removes existing dependencies first)
```powershell
cd d:\DEV\BIOME
.\setup-dependencies.ps1 -Clean
```

### Verbose Setup (shows detailed output)
```powershell
cd d:\DEV\BIOME
.\setup-dependencies.ps1 -Verbose
```

### Quick Setup via npm
```powershell
cd d:\DEV\BIOME\projet-analyse-image-frontend
npm run setup-deps
```

## Development Workflows

### Web Development
```powershell
cd d:\DEV\BIOME\projet-analyse-image-frontend
npm run setup-deps        # Only needed once or after git pull
npm run start-both
```

### Desktop Development
```powershell
cd d:\DEV\BIOME\projet-analyse-image-frontend
npm run setup-deps        # Only needed once or after git pull
npm run tauri-dev
```

### Production Build
```powershell
cd d:\DEV\BIOME\projet-analyse-image-frontend
npm run build-with-deps   # Automatically sets up dependencies and builds
```

### Alternative Production Build Commands
```powershell
# Simple MSI build (assumes dependencies are already set up)
npm run simple-msi

# Clean build (removes all dependencies first, then builds)
npm run clean-build
```

## What Gets Set Up

The setup script automatically configures:

1. **Frontend Dependencies**: React, Tauri CLI, and development tools
2. **Backend Dependencies**: Express, SQLite3, Winston logger, etc.
3. **Bundled Backend**: Production-ready backend with dependencies for desktop app
4. **Node.js Runtime**: Bundled Node.js executable for desktop distribution

## Available npm Scripts

### Dependency Management
- `npm run setup-deps` - Set up all dependencies
- `npm run setup-deps-clean` - Clean setup (removes existing dependencies first)
- `npm run setup-deps-verbose` - Verbose setup with detailed output

### Development
- `npm run start-both` - Start backend and frontend for web development
- `npm run tauri-dev` - Start Tauri desktop development

### Building
- `npm run simple-msi` - Build MSI installer (dependencies must be set up)
- `npm run build-with-deps` - Set up dependencies and build MSI
- `npm run clean-build` - Clean dependencies and build from scratch

## Troubleshooting

### If dependencies seem outdated
```powershell
cd d:\DEV\BIOME\projet-analyse-image-frontend
npm run setup-deps-clean
```

### If build fails with missing modules
```powershell
cd d:\DEV\BIOME\projet-analyse-image-frontend
npm run clean-build
```

### Manual dependency refresh
```powershell
cd d:\DEV\BIOME

# Remove all node_modules
Remove-Item -Recurse -Force */node_modules, **/node_modules -ErrorAction SilentlyContinue

# Reinstall everything
.\setup-dependencies.ps1
```

### Git repository too large
If you accidentally committed node_modules, clean them up:
```powershell
# Remove from Git index (keeps local files)
git rm -r --cached "*/node_modules" "projet-analyse-image-frontend/src-tauri/target" 2>$null

# Commit the cleanup
git commit -m "Remove node_modules and build artifacts from tracking"
```

## File Structure After Setup

```
BIOME/
├── backend/
│   ├── node_modules/          # Backend dependencies (excluded from Git)
│   ├── src/
│   └── package.json
├── projet-analyse-image-frontend/
│   ├── node_modules/          # Frontend dependencies (excluded from Git)
│   ├── src-tauri/
│   │   ├── target/            # Rust build artifacts (excluded from Git)
│   │   ├── bin/               # Node.js binaries (excluded from Git)
│   │   │   ├── node.exe
│   │   │   └── node-x86_64-pc-windows-msvc.exe
│   │   └── resources/
│   │       └── backend/
│   │           ├── node_modules/  # Bundled dependencies (excluded from Git)
│   │           └── src/
│   ├── build/                 # React build output (excluded from Git)
│   └── package.json
├── setup-dependencies.ps1     # Dependency setup script
├── .gitignore                 # Excludes dependencies from Git
└── DEPENDENCY_MANAGEMENT.md   # This documentation
```

## When to Run Setup

- **After cloning the repository** - Run `setup-dependencies.ps1`
- **After pulling changes** that might affect dependencies - Run `npm run setup-deps`
- **Before building for production** - Use `npm run build-with-deps`
- **When dependencies seem corrupted** - Run `npm run setup-deps-clean`

## Integration with CI/CD

For automated builds, include the setup step:

```yaml
# Example GitHub Actions workflow
- name: Setup Dependencies
  run: .\setup-dependencies.ps1
  
- name: Build Production
  run: |
    cd projet-analyse-image-frontend
    npm run simple-msi
```
