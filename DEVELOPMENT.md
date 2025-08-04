# BIOME Development Setup Guide

This guide helps you set up BIOME for development on your local machine.

## 🚀 Quick Setup

### Prerequisites
- **Node.js 16+** - [Download from nodejs.org](https://nodejs.org/)
- **Git** - [Download from git-scm.com](https://git-scm.com/)
- **VS Code** (recommended) - [Download from code.visualstudio.com](https://code.visualstudio.com/)

### 1. Clone the Repository
```powershell
git clone https://github.com/UniversalBuilder/BIOME.git
cd BIOME
```

### 2. Setup Dependencies
```powershell
# Run the setup script (Windows)
.\setup-dependencies.ps1

# Or manually install dependencies
cd projet-analyse-image-frontend
npm install
cd ../backend
npm install
```

### 3. Start Development Server
```powershell
cd projet-analyse-image-frontend
npm run start-both
```

This will start:
- Frontend React app on `http://localhost:3000`
- Backend Node.js API on `http://localhost:5000`

### 4. Open in VS Code
```powershell
# Open the workspace file for optimal VS Code experience
code BIOME.code-workspace
```

## 🛠️ Development Tasks

Use VS Code Command Palette (`Ctrl+Shift+P`) and search for:
- **Tasks: Run Task** → **Setup Dependencies**
- **Tasks: Run Task** → **Start BIOME Web Development**
- **Tasks: Run Task** → **Start BIOME Desktop Development**

## 🎯 Building for Production

### Desktop Application (MSI)
```powershell
cd projet-analyse-image-frontend
npm run simple-msi
```

### Web Production Build
```powershell
cd projet-analyse-image-frontend
npm run build-with-deps
```

## 🔄 Git Workflow

The repository is configured for VS Code Git integration:
- Source Control panel shows changes
- Commit and push directly from VS Code
- Pull requests can be managed with GitHub extension

## 📁 Project Structure

```
BIOME/
├── backend/               # Node.js API server
├── projet-analyse-image-frontend/  # React frontend
├── screenshots/           # Application screenshots
├── docs/                 # Documentation
├── icon/                 # Application icons
├── .vscode/              # VS Code configuration
└── *.ps1                 # PowerShell setup scripts
```

## 🚨 Troubleshooting

### Git Issues in VS Code
- Check that Git is installed and in PATH
- Restart VS Code after installing Git
- Use the integrated terminal for Git commands

### Node.js Issues
- Ensure Node.js 16+ is installed
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and run `npm install`

### Port Conflicts
- Frontend: Change port in `package.json` start script
- Backend: Modify `backend/src/server.js` port configuration

For more help, see the main README.md file.
