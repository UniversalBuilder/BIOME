
## Project Overview

The BIOME app (Bio Imaging Organization and Management Environment) is a bioimage analysis project management tool developed entirely with **GitHub Copilot** and AI-assisted coding. It has dual deployment modes:
- **Web version**: Built with React and Node.js Express backend
- **Desktop version**: Uses Tauri v2.0.0 for native Windows experience with same React frontend
- **Architecture**: Frontend + Backend separation with environment-aware API communication
- **Database**: SQLite (stored in `backend/data/database.sqlite`)
- **Build System**: PowerShell-based dependency management excluding `node_modules/` from Git

## System Architecture

**Frontend**: React 18 with TailwindCSS (`projet-analyse-image-frontend/src/`)
- Components: `src/components/` (ProjectDetails.js has multi-select dropdowns with JSON array storage)
- Pages: `src/pages/` (Dashboard, Projects, Analytics with 6 specialized chart types)
- Services: `src/services/` (api.js, tauriApi.js, filesystemApi.js with dual-mode operations)
- Utils: `src/utils/` (environmentDetection.js with 5-strategy fallback detection)

**Backend**: Node.js Express with Winston logging (`backend/src/`)
- API routes: `src/routes/` (RESTful endpoints for project management)
- Database: `src/database/schema.js` (SQLite schema with v1.1.0 demo data)
- Server: `src/server.js` (CORS-enabled with automated backend launcher integration)

**Desktop Integration**: Tauri v2.0.0 with Rust commands
- Config: `projet-analyse-image-frontend/src-tauri/tauri.conf.json` (MSI/NSIS bundle targets)
- Rust commands: `src-tauri/src/main.rs` (folder operations, README generation, project scanning)
- Resources: `src-tauri/resources/backend/` (bundled Node.js backend for desktop mode)
- Environment detection: Multi-fallback strategy in `src/utils/environmentDetection.js`

## Dependency Management

BIOME uses an automated dependency management system to keep the Git repository lightweight:

- **Excluded from Git**: All `node_modules/`, build artifacts, bundled dependencies
- **Setup Script**: `.\setup-dependencies.ps1` - Sets up all dependencies automatically
- **Build Integration**: Dependencies are auto-installed during production builds

### Key Commands
- `.\setup-dependencies.ps1` - Set up all dependencies
- `.\setup-dependencies.ps1 -Clean` - Clean setup (removes existing first)
- `npm run setup-deps` - Quick dependency setup
- `npm run build-with-deps` - Auto-setup dependencies + build

## Key Development Workflows

## Key Development Workflows

### First Time Setup
```powershell
cd d:\DEV\BIOME
.\setup-dependencies.ps1    # Installs all frontend/backend deps
```

### Development Commands
```powershell
# Web development (React + Express)
cd projet-analyse-image-frontend
npm run start-both  # Starts both frontend:3000 and backend:5000

# Desktop development (Tauri)
npm run tauri-dev   # Hot-reload desktop app with bundled backend

# Production builds
npm run build-with-deps    # Auto-install deps + MSI build
npm run simple-msi         # Quick MSI build (53MB installer)
```

### VS Code Integration
Open `BIOME.code-workspace` for optimal development experience:
- Multi-folder structure (Frontend/Backend/Root)
- Configured tasks for all build commands
- PowerShell as default terminal
- Recommended extensions for React/Rust/Tauri

### Environment Detection

The app has a sophisticated environment detection system that determines whether it's running in desktop or web mode:

```javascript
// Check if running in desktop mode
import Environment from '../utils/environmentDetection';
const isDesktop = Environment.isTauri();
```

Never use the deprecated `isTauriApp()` function in `tauriApi.js`.

## Critical Development Patterns

**Environment Detection**: The app uses sophisticated 5-strategy environment detection:
```javascript
import Environment from '../utils/environmentDetection';
// ALWAYS use this - never use deprecated isTauriApp()
const isDesktop = Environment.isTauri();
```
Strategies: Tauri global object → protocol check → IPC detection → metadata check → desktop heuristics

**Dual-Mode API Pattern**: All file operations use environment-aware services:
```javascript
// filesystemApi.js automatically chooses Tauri vs web backend
import { createProjectStructure } from '../services/filesystemApi';
// Desktop: Direct filesystem via Rust commands
// Web: ZIP download via Express backend
```

**Multi-Select Data Storage**: ProjectDetails.js uses JSON arrays for dropdowns:
```javascript
// Store as JSON arrays in SQLite, display as comma-separated
sampleTypes: ["Cell Culture", "Tissue"] // stored as JSON
sampleTypes: "Cell Culture, Tissue"     // displayed to user
```

**Backend Auto-Launch**: Desktop mode bundles Node.js backend in `src-tauri/resources/backend/`
- `backendLauncher.js` checks health, starts bundled backend if needed
- Web mode connects to separate backend server
- Both modes use identical API endpoints

## Terminal Commands

When running terminal commands, use the PowerShell style format, especially when chaining multiple instructions:

```powershell
cd d:\DEV\BIOME\projet-analyse-image-frontend ; npm run tauri-dev
```

instead of:

```bash
cd "d:\DEV\BIOME\projet-analyse-image-frontend" && npm run tauri-dev
```

## Environment

We are using Windows 11 and its PowerShell terminal. Make sure to consider this when writing code or terminal instructions.

## Chat Interactions

If my instructions are not clear, please ask for clarification. I will provide more details if needed.

## App Design

When a task is about design, make sure to produce something that is consistent with the rest of the app. We don't want to have dozens of button categories and the design needs to be homogeneous, elegant, modern, but also use a design language that makes the UI intuitive, logical to use, and in line with the best standards of this type of app.

## Theme

The colors used in the app should be light and easy on the eye, following the color palette of the Avatar movie by James Cameron:
- **Light colors**: Beige, off-white, blue, teal (beach/seascape from Avatar 2)
- **Dark colors**: Dark blue, dark teal backgrounds with bioluminescent pink, orange, and cyan accents

## Data Flows

1. **Frontend → Backend**: HTTP API calls for data operations
2. **Desktop File Access**: Tauri API calls through `tauriApi.js` 
3. **Environment Detection**: Multiple fallback strategies for reliable detection
4. **Project Structure**: Filesystem operations check for proper structure before allowing project creation

## Build System & Dependencies

**PowerShell-Driven Builds**: All build operations use PowerShell scripts
- `setup-dependencies.ps1`: Installs all deps, bundles Node.js for Tauri
- `build-production.ps1`: Full production build with MSI/NSIS outputs  
- `simple-build.ps1`: Quick development builds

**Tauri Bundle Structure**:
- `src-tauri/resources/backend/`: Complete Node.js backend bundled in desktop app
- `src-tauri/bin/`: Node.js executable for cross-platform desktop distribution
- MSI installer includes backend server, no external dependencies needed

**Key Package Scripts**:
```bash
npm run start-both      # Web dev: React + Express
npm run tauri-dev       # Desktop dev with hot reload
npm run build-with-deps # Auto-deps + MSI build
npm run simple-msi      # Quick MSI (53MB) from existing deps
```