# BIOME - Bio Imaging Organization and Management Environment

<div align="center">

**A comprehensive bioimage analysis project management tool for research facilities and laboratories**

[![License: CC BY-NC 4.0](https://img.shields.io/badge/License-CC_BY--NC_4.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc/4.0/)
[![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)](#download)
[![Platform](https://img.shields.io/badge/platform-Windows-lightblue.svg)](#installation)

[🚀 Quick Start](#quick-start) • [📦 Download](#download) • [📚 Documentation](#documentation) • [🤝 Contributing](#contributing)

</div>

---

## 🔬 Overview

BIOME is a specialized project management application designed for **bioimage analysis facilities** and **research laboratories**. It helps organize, track, and manage biological imaging projects from inception to completion, supporting workflows with popular tools like **Imaris**, **FIJI/ImageJ**, **QuPath**, and **CellProfiler**.

### ✨ Key Features

- 🏢 **Multi-Facility Support**: Organize projects across imaging cores (Confocal, Widefield, Digital Pathology)
- 👥 **Team Management**: Track projects by facility staff and research groups  
- 📊 **Project Tracking**: Monitor analysis progress, time investment, and project status
- � **Digital Lab Journal**: Document methodology, results, and analysis notes
- 🔬 **Analysis Integration**: Designed for common bioimage analysis software workflows
- 📈 **Progress Analytics**: Visualize project timelines, workload distribution, and productivity
- 💻 **Dual Mode**: Available as both web application and native desktop app

### 🎯 Perfect for:

- **Core Facility Managers**: Track projects across multiple imaging modalities
- **Bioimage Analysis Staff**: Organize complex analysis pipelines and document workflows  
- **Research Students**: Manage thesis projects and maintain analysis records
- **Lab Groups**: Coordinate shared imaging resources and collaborative projects

---

## 🚀 Quick Start

### Option 1: Desktop Application (Recommended)

1. **Download** the latest MSI installer: [BIOME_1.2.0_x64_en-US.msi](./BIOME-Distribution/BIOME_1.2.0_x64_en-US.msi)
2. **Install** by double-clicking the MSI file
3. **Launch** BIOME from your Start Menu
4. **Explore** the demo data featuring realistic bioimage analysis projects

### Option 2: Web Application (Development)

```powershell
# Prerequisites: Node.js 16+ and npm
git clone <repository-url>
cd BIOME

# Setup dependencies (Windows)
.\setup-dependencies.bat

# Start the application
cd projet-analyse-image-frontend
npm run start-both

# Open http://localhost:3000 in your browser
```

---

## 📦 Installation & Setup

### 🖥️ Desktop Installation (Recommended)

#### System Requirements
- **Operating System**: Windows 10 (1809+) or Windows 11
- **Architecture**: 64-bit (x64) processor
- **Memory**: 4 GB RAM minimum, 8 GB recommended
- **Storage**: 500 MB free disk space
- **Network**: Internet connection for initial setup (optional afterwards)
- **Permissions**: Administrator rights for installation

#### Installation Steps

1. **Download the MSI Installer**
   - Download [BIOME_1.2.0_x64_en-US.msi](./BIOME-Distribution/BIOME_1.2.0_x64_en-US.msi) (~53 MB)
   - Verify the file downloaded completely

2. **Run the Installer**
   - Right-click the MSI file → "Run as administrator"
   - If Windows Defender SmartScreen appears, click "More info" → "Run anyway"
   
   *[Screenshot placeholder: MSI installer welcome screen]*

3. **Follow Installation Wizard**
   - Accept the license agreement
   - Choose installation directory (default: `C:\Program Files\BIOME\`)
   - Select Start Menu folder
   - Choose desktop shortcut options
   
   *[Screenshot placeholder: Installation directory selection]*

4. **Complete Installation**
   - Click "Install" to begin installation process
   - Wait for files to be copied and configured (~2-3 minutes)
   - Click "Finish" to complete installation
   
   *[Screenshot placeholder: Installation progress and completion]*

5. **First Launch**
   - Find BIOME in Start Menu → "BIOME" or use desktop shortcut
   - The application will initialize with demo data automatically
   - Initial startup may take 30-60 seconds
   
   *[Screenshot placeholder: BIOME splash screen during startup]*

#### Verification
Once installed, you should see:
- BIOME icon in Start Menu
- Desktop shortcut (if selected)
- Installation folder at `C:\Program Files\BIOME\`
- Demo data with 10 sample projects ready for exploration

*[Screenshot placeholder: BIOME main dashboard with demo data]*

### 🌐 Web Application Setup (Development)

For developers or users who prefer a web-based interface:

#### Prerequisites
```powershell
# Check if Node.js is installed
node --version  # Should show v16.0.0 or higher
npm --version   # Should show v8.0.0 or higher
```

If Node.js is not installed:
1. Download from [nodejs.org](https://nodejs.org/) (LTS version)
2. Run installer with default settings
3. Restart your command prompt

#### Quick Setup
```powershell
# 1. Clone the repository
git clone <repository-url>
cd BIOME

# 2. Run automated setup (installs all dependencies)
.\setup-dependencies.bat

# 3. Start the development environment
cd projet-analyse-image-frontend
npm run start-both
```

#### Manual Setup (Alternative)
```powershell
# Backend setup
cd backend
npm install
npm start  # Runs on http://localhost:3001

# Frontend setup (new terminal)
cd projet-analyse-image-frontend  
npm install
npm start  # Runs on http://localhost:3000
```

*[Screenshot placeholder: Web application running in browser]*

---

## 🚀 Getting Started Guide

### First Time User Experience

When you first open BIOME, you'll be greeted with a dashboard containing realistic demo data from three imaging facilities:

#### 1. **Dashboard Overview**
The main dashboard shows:
- **Project Status Overview**: Active, completed, and pending projects
- **Recent Activity Feed**: Latest project updates and modifications
- **Quick Stats**: Total projects, time invested, and facility distribution
- **Analytics Preview**: Visual insights into your project portfolio

*[Screenshot placeholder: Main dashboard with annotated areas]*

#### 2. **Exploring Demo Projects**
Click on any project to see detailed information:
- **Project Metadata**: Name, description, status, associated software
- **Imaging Details**: Techniques used, sample types, magnification objectives
- **Analysis Goals**: Purpose and expected outcomes
- **Time Tracking**: Hours invested and project timeline
- **File Management**: Project folder structure and README files
- **Lab Journal**: Research notes and methodology documentation

*[Screenshot placeholder: Project details view with expanded information]*

#### 3. **Navigation Basics**
- **Dashboard**: Overview of all projects and recent activity
- **Projects**: Detailed project management and editing
- **Analytics**: Visual insights and progress reports
- **Settings**: Application preferences and configuration

*[Screenshot placeholder: Navigation menu with labels]*

### Creating Your First Project

#### Step 1: Add New Project
1. Click the **"+ New Project"** button on the dashboard
2. Fill in basic project information:
   - **Project Name**: Descriptive title for your analysis
   - **Description**: Detailed project objectives and methodology
   - **Status**: Current stage (Preparing, Active, Completed, etc.)
   - **Research Group**: Select your facility or core
   - **Primary Software**: Main analysis tool (Imaris, FIJI, QuPath, etc.)

*[Screenshot placeholder: New project creation form]*

#### Step 2: Configure Project Details
Fill in specialized bioimage analysis fields:
- **Imaging Techniques**: Select from dropdown (confocal, widefield, slide scanning, etc.)
- **Sample Types**: Specify biological samples (cells, tissues, organoids, etc.)
- **Objective Magnification**: Record imaging parameters (e.g., "63x oil immersion")
- **Analysis Goals**: Define project objectives (counting, measurement, classification, etc.)

*[Screenshot placeholder: Project detail configuration with dropdown menus]*

#### Step 3: Set Up Project Structure
1. **Choose Project Directory**: Select where analysis files will be stored
2. **Create Folder Structure**: BIOME can automatically create organized directories
3. **Initialize README**: Generate documentation template for your project
4. **Verify Setup**: Review project configuration before saving

*[Screenshot placeholder: Project folder structure creation dialog]*

#### Step 4: Begin Documentation
Use the integrated lab journal to document:
- **Methodology Notes**: Detailed analysis procedures
- **Parameter Settings**: Software configurations and thresholds
- **Observations**: Results, issues, and discoveries
- **Progress Updates**: Timeline and milestone tracking

*[Screenshot placeholder: Lab journal interface with sample entries]*

### Working with Projects

#### Project Status Management
BIOME uses six main project statuses:
- **Preparing**: Planning and setup phase
- **Active**: Currently running analysis
- **Review**: Analysis complete, under review
- **Completed**: Finished and documented
- **On Hold**: Temporarily paused
- **Cancelled**: Discontinued projects

*[Screenshot placeholder: Status dropdown menu with color coding]*

#### Time Tracking
Accurate time tracking helps with:
- **Resource Planning**: Understanding project complexity
- **Billing Documentation**: For core facilities
- **Efficiency Analysis**: Improving workflows
- **Progress Monitoring**: Meeting deadlines

Track time through:
1. Manual time entry in project details
2. Timer functionality (if enabled)
3. Automatic activity logging
4. Bulk time updates for similar projects

*[Screenshot placeholder: Time tracking interface and analytics]*

#### File Management Integration
BIOME helps organize your analysis files:
- **Project Folders**: Automatic directory structure creation
- **README Generation**: Standardized documentation templates  
- **File Validation**: Check folder structure compliance
- **Path Management**: Track and update project locations

*[Screenshot placeholder: File management interface showing folder structure]*

### Understanding Analytics

#### Project Overview Charts
The analytics dashboard provides several views:
- **Status Distribution**: Pie chart of project states
- **Software Usage**: Which tools are most commonly used
- **Time Investment**: How resources are allocated across projects
- **Facility Workload**: Distribution among research groups

*[Screenshot placeholder: Analytics dashboard with multiple charts]*

#### Sample Type Analysis
Track the diversity of biological samples:
- **Cell Types**: Cultured cells, primary cells, cell lines
- **Tissue Types**: Fresh, fixed, sectioned tissues
- **Model Systems**: Organoids, organ slices, whole organisms
- **Other Samples**: Nanoparticles, synthetic materials

*[Screenshot placeholder: Sample type distribution chart]*

#### Imaging Technique Trends
Monitor facility usage patterns:
- **Confocal Microscopy**: High-resolution, 3D imaging
- **Widefield Fluorescence**: High-throughput screening
- **Super-resolution**: Advanced imaging techniques
- **Slide Scanning**: Digital pathology applications

*[Screenshot placeholder: Imaging technique usage chart]*

---

## 🔧 Advanced Configuration

### Customizing Project Categories

#### Adding New Software Options
While BIOME comes with popular analysis software pre-configured, you can customize the options:
1. Navigate to Settings → Software Management
2. Add custom software names and configurations
3. Set default parameters for common workflows
4. Create software-specific project templates

*[Placeholder for future feature - currently in development]*

#### Custom Analysis Goals
Define specialized analysis objectives for your facility:
- **Morphometry**: Size, shape, and structural measurements
- **Intensity Analysis**: Fluorescence quantification and colocalization
- **Dynamic Analysis**: Time-lapse and motion tracking
- **Spatial Analysis**: Distribution patterns and spatial relationships

#### Sample Type Customization
Adapt BIOME to your specific research focus:
- Add new biological sample categories
- Define sample preparation protocols
- Set default imaging parameters per sample type
- Create sample-specific analysis workflows

### Database Management

#### Backup and Recovery
Regular backups ensure data safety:
```powershell
# Manual backup (desktop app)
# Database location: %LOCALAPPDATA%\BIOME\data\database.sqlite

# Copy database file to backup location
copy "%LOCALAPPDATA%\BIOME\data\database.sqlite" "C:\Backup\BIOME\database_backup_$(Get-Date -Format 'yyyy-MM-dd').sqlite"
```

#### Data Export
Export project data for analysis or migration:
1. Go to Settings → Data Management
2. Select export format (CSV, JSON, XML)
3. Choose data range and filters
4. Generate export file

*[Screenshot placeholder: Data export interface]*

#### Performance Optimization
For large datasets (>1000 projects):
- Enable database indexing
- Configure automatic cleanup of old activities
- Set up periodic database optimization
- Monitor disk space usage

### Integration with Analysis Software

#### Software Launch Integration
Configure direct software launching from projects:
1. Set software installation paths in Settings
2. Configure command-line parameters
3. Enable auto-launch with project files
4. Set up software-specific templates

*[Placeholder for future feature]*

#### File Association
Associate BIOME projects with analysis software:
- Link project folders to software workspaces
- Automatically open relevant files
- Sync analysis parameters between tools
- Track software usage patterns

---

## 🚨 Troubleshooting Guide

### Common Installation Issues

#### Issue: "Windows Protected Your PC" SmartScreen Warning
**Solution:**
1. Click "More info" in the SmartScreen dialog
2. Click "Run anyway" to proceed with installation
3. This occurs because the app is not digitally signed by a commercial certificate

*[Screenshot placeholder: SmartScreen warning and resolution steps]*

#### Issue: Installation Fails with "Administrator Rights Required"
**Solution:**
1. Right-click the MSI file
2. Select "Run as administrator"
3. Provide administrator credentials when prompted
4. Complete installation with elevated privileges

#### Issue: "MSVCR120.dll is missing" Error
**Solution:**
1. Download Microsoft Visual C++ Redistributable for Visual Studio 2013
2. Install both x86 and x64 versions
3. Restart your computer
4. Retry BIOME installation

### Application Issues

#### Issue: "Failed to fetch" API Errors
**Symptoms:** Projects don't load, dashboard shows connection errors
**Solution:**
1. Press **Ctrl+Shift+D** to open debug console (desktop app)
2. Check backend server status in debug panel
3. Verify Node.js is properly installed and running
4. Check Windows Firewall isn't blocking the application

*[Screenshot placeholder: Debug console showing backend status]*

#### Issue: Slow Application Performance
**Symptoms:** Long loading times, UI lag, slow project switching
**Solution:**
1. Check available system memory (Task Manager)
2. Close other resource-intensive applications
3. Clear application cache: Settings → Advanced → Clear Cache
4. Consider upgrading to 8GB RAM for large project databases

#### Issue: Projects Don't Save Changes
**Symptoms:** Edits are lost, changes don't persist
**Solution:**
1. Verify write permissions to project directories
2. Check disk space availability
3. Ensure project folders aren't read-only
4. Try running BIOME as administrator

#### Issue: Dark Mode Display Problems
**Known Issue:** Some table text may be difficult to read in dark mode
**Workaround:** 
1. Switch to light mode: Settings → Appearance → Light Theme
2. This will be resolved in a future update

*[Screenshot placeholder: Settings menu showing theme options]*

### File Management Issues

#### Issue: Project Folder Creation Fails
**Symptoms:** "Cannot create project structure" error
**Solution:**
1. Verify you have write permissions to the target directory
2. Check the path doesn't contain special characters
3. Ensure the drive has sufficient free space
4. Try selecting a different project directory

#### Issue: README Files Don't Generate
**Symptoms:** README.txt files are missing from project folders
**Solution:**
1. Check file system permissions
2. Verify the project path is accessible
3. Try manually creating a README.txt file in the project folder
4. Use the "Update README" button in project details

### Performance Optimization

#### For Large Facilities (500+ Projects)
1. **Database Maintenance**:
   - Run monthly database optimization
   - Archive completed projects older than 2 years
   - Clean up activity logs periodically

2. **System Configuration**:
   - Increase Windows virtual memory
   - Use SSD storage for better performance
   - Close unnecessary background applications

3. **Network Considerations**:
   - For shared network drives, use local database with periodic sync
   - Consider dedicated server deployment for core facilities

### Getting Help

#### Built-in Diagnostics
1. **Debug Console**: Press Ctrl+Shift+D (desktop app)
2. **System Information**: Check Node.js version, database status
3. **Connection Test**: Verify backend API connectivity
4. **Performance Metrics**: Monitor memory and CPU usage

#### Log Files
Debug information is stored in:
- **Desktop App**: `%LOCALAPPDATA%\BIOME\logs\`
- **Web App**: Browser developer console
- **Backend**: `backend/logs/` directory

#### Support Resources
- **Documentation**: [Technical Documentation](./docs/BIOME_Technical_Document.md)
- **Issue Reporting**: Open GitHub issues with detailed reproduction steps
- **Community**: Join bioimage analysis forums for user discussions

*[Screenshot placeholder: Debug console showing system diagnostics]*

---

## 🧪 Demo Data

BIOME comes with realistic demo data showcasing typical bioimage analysis projects:

### 🔬 Confocal Microscopy Core
- **3D Neuronal Network Reconstruction** - Imaris-based spine analysis of brain organoids
- **Live Cell Calcium Dynamics** - Time-lapse analysis of cardiomyocyte signaling  
- **Mitochondrial Dynamics Analysis** - Super-resolution tracking of organelle morphology

### 🌟 Widefield Imaging Center  
- **High-Throughput Cell Counting** - Automated FIJI/ImageJ batch processing pipelines
- **Fluorescence Intensity Quantification** - Multi-channel protein expression analysis
- **Drug Screening Assay Analysis** - 384-well plate high-content screening workflows

### 🏥 Digital Pathology Unit
- **Tissue Classification with QuPath** - Machine learning for H&E slide analysis
- **Whole Slide IHC Quantification** - Clinical biomarker assessment workflows  
- **Tumor Microenvironment Mapping** - Spatial analysis of immune infiltration

Each project includes realistic timelines, analysis notes, software workflows, and progress tracking.

---

## 🛠️ Development Setup

### Prerequisites
- Node.js 16.0.0 or higher
- npm (included with Node.js)  
- Windows 10/11 for desktop builds
- PowerShell 5.1 or higher

### First Time Setup

1. **Clone the repository:**
   ```powershell
   git clone <repository-url>
   cd BIOME
   ```

2. **Set up all dependencies:**
   
   **Option A: Batch Script (Recommended)**
   ```cmd
   setup-dependencies.bat
   ```
   
   **Option B: PowerShell Script**
   ```powershell
   .\setup-dependencies.ps1
   ```

### Development Workflows

#### Web Development
```powershell
cd projet-analyse-image-frontend
npm run start-both
```
Access at: http://localhost:3000

#### Desktop Development  
```powershell
cd projet-analyse-image-frontend
npm run tauri-dev
```

## 🏗️ Building for Production

### Simple MSI Build
```powershell
cd projet-analyse-image-frontend
npm run build-with-deps    # Auto-setup dependencies + build MSI
```

### Other Build Options
```powershell
# Just MSI (assumes dependencies are set up)
npm run simple-msi

# Clean build (removes all dependencies first)
npm run clean-build

# NSIS installer  
npm run simple-exe
```

### Output Location
Built installers are available in:
```
projet-analyse-image-frontend/src-tauri/target/release/bundle/
├── msi/BIOME_1.2.0_x64_en-US.msi
└── nsis/BIOME_1.2.0_x64-setup.exe
```

## � What’s New (UI polish)

- Unified modal design across the app using a reusable Wizard-style modal
- Dashboard Quick Start: clearer hover feedback on recent projects
- Fixed layout gap so the Completion Rate card fills its slot in the stats row

## �📦 Dependency Management

BIOME uses an automated dependency management system to keep the Git repository lightweight while ensuring consistent builds.

### Excluded from Git
- All `node_modules/` directories (2800+ files)
- Build artifacts (`target/`, `build/`, `dist/`)
- Bundled dependencies for desktop distribution
- MSI/EXE installer files

### Dependency Commands
```powershell
# Set up all dependencies
npm run setup-deps

# Clean setup (removes existing first)  
npm run setup-deps-clean

# Verbose setup with detailed output
npm run setup-deps-verbose
```

See [DEPENDENCY_MANAGEMENT.md](./DEPENDENCY_MANAGEMENT.md) for complete documentation.

## 🎯 Environment Detection

BIOME automatically detects whether it's running in web or desktop mode:

```javascript
import Environment from '../utils/environmentDetection';

// Check if running in desktop mode
const isDesktop = Environment.isTauri();
```

## 🧪 Testing

BIOME includes comprehensive testing:

```powershell
cd projet-analyse-image-frontend

# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run integration tests  
npm run test:integration

# Run E2E tests with Cypress
npm run test:e2e

# Generate coverage report
npm run test:coverage
```

See `TESTING.md` for detailed testing documentation.

## 📁 Project Structure

```
BIOME/
├── backend/                           # Node.js Express backend
│   ├── src/                          # Backend source code
│   │   ├── server.js                 # Main server file
│   │   ├── database/                 # Database utilities & demo data
│   │   ├── models/                   # Data models
│   │   └── routes/                   # API routes
│   ├── data/                         # SQLite database
│   └── package.json                  # Backend dependencies
├── projet-analyse-image-frontend/     # React frontend with Tauri
│   ├── src/                          # Frontend source code
│   │   ├── components/               # React components
│   │   ├── pages/                    # Page components
│   │   ├── services/                 # API services
│   │   └── utils/                    # Utilities including environment detection
│   ├── src-tauri/                    # Tauri configuration
│   │   ├── src/main.rs               # Rust backend integration
│   │   ├── tauri.conf.json           # Tauri config
│   │   └── resources/                # Bundled resources (auto-generated)
│   └── package.json                  # Frontend dependencies
├── BIOME-Distribution/               # Pre-built installers
│   └── BIOME_1.2.0_x64_en-US.msi    # Ready-to-install desktop app
├── docs/                             # Documentation
├── LICENSE                           # CC BY-NC 4.0 License
├── setup-dependencies.bat            # Dependency setup script (recommended)
├── setup-dependencies.ps1            # Dependency setup script (PowerShell)
├── DEPENDENCY_MANAGEMENT.md          # Dependency documentation
└── README.md                         # This file
```

## 🚨 Troubleshooting

### "Failed to fetch" errors
The comprehensive debugging system provides detailed diagnostics:
1. Press **Ctrl+Shift+D** in the desktop app to open debug console
2. Check backend status, Node.js path, and API connectivity
3. View detailed logs in the console window

### Build Issues
```powershell
# Clean everything and rebuild
cd projet-analyse-image-frontend  
npm run clean-build

# Manual cleanup if needed
Remove-Item -Recurse -Force */node_modules, **/node_modules -ErrorAction SilentlyContinue
cd .. 
.\setup-dependencies.ps1 -Clean
```

## 🎨 Design System

BIOME follows a consistent design language inspired by James Cameron's Avatar:
- **Light colors**: Beige, off-white, blue, teal (beach/seascape from Avatar 2)
- **Dark colors**: Dark blue, dark teal backgrounds with bioluminescent pink, orange, and cyan accents

## 📚 Documentation

### For Users
- 📖 [Installation Instructions](./BIOME-Distribution/INSTALL_INSTRUCTIONS.txt) - Complete installation guide
- 🚀 [Technical Documentation](./docs/BIOME_Technical_Document.md) - Detailed technical specifications
- ❓ [Technical Specifications](./docs/BIOME_Technical_Specifications.md) - Architecture overview  

### For Developers  
- 🏗️ [Dependency Management](./DEPENDENCY_MANAGEMENT.md) - Complete dependency documentation
- 🧪 [Testing Guide](./TESTING.md) - Running tests and quality assurance
- 📝 [Development Journal](./docs/journal.md) - Development history and changes

## 🔄 Data Flows

1. **Frontend → Backend**: HTTP API calls for data operations
2. **Desktop File Access**: Tauri API calls through `tauriApi.js`
3. **Environment Detection**: Multiple fallback strategies for reliable detection
4. **Project Structure**: Filesystem operations validate structure before project creation

## 🏷️ Version Information

- **Current Version**: 1.2.0
- **Tauri Version**: 2.0.0
- **Node.js Requirement**: 16.0.0+
- **Target Platform**: Windows (with console debugging support)

## 🤝 Contributing

We welcome contributions from the bioimage analysis community! BIOME is designed to evolve with the needs of research facilities.

### 🌟 Ways to Contribute

- 🐛 **Report Bugs**: Open an issue with detailed reproduction steps
- 💡 **Suggest Features**: Request features that would benefit bioimage analysis workflows  
- 📝 **Improve Documentation**: Help make BIOME more accessible
- 🔧 **Submit Code**: Fork, develop, and submit pull requests

### 🚀 Development Setup

```bash
# Clone repository
git clone <repository-url>
cd BIOME

# Install dependencies  
.\setup-dependencies.bat

# Start development environment
cd projet-analyse-image-frontend
npm run start-both
```

## 🚀 Planned Features

The following features are planned for future versions of BIOME:

### 🔧 Software Management
- **Custom Software Addition**: Ability to add new analysis software options to the selection list
- **Software Profiles**: Create custom software configurations with specific parameters and workflows

### 📊 Enhanced Dashboard
- **Active Projects Widget**: Quick access panel at the top of the dashboard showing current active projects
- **Project Quick Actions**: Direct status updates and time tracking from the dashboard
- **Smart Project Suggestions**: AI-powered recommendations for project organization and workflows

### 🛠️ Technical Improvements
- **Application Cache Management**: Fix the "clear application cache" function that currently causes data fetching errors
- **Dark Mode Optimization**: Resolve hover color issues in table view that make text unreadable in dark mode
- **Animation Smoothing**: Fix the card flashing animation when opening the database tab
- **Performance Optimization**: Faster loading times and smoother transitions

### 🔗 Integration & Workflow
- **External Tool Integration**: Direct launch capabilities for analysis software from project entries
- **Batch Operations**: Bulk project updates, status changes, and data exports
- **Advanced Analytics**: More detailed project metrics, time tracking insights, and productivity reports
- **Collaboration Tools**: Shared project spaces, comment threads, and team notifications

### 📁 Data Management
- **Advanced Search & Filtering**: Powerful search across all project data with custom filters
- **Data Migration Tools**: Import/export capabilities for existing project management systems
- **Backup & Sync**: Automated backup solutions and cloud synchronization options
- **Version Control**: Track changes to analysis parameters and results over time

---

## ⚠️ Version 1.1 Notice

**BIOME v1.0** is the initial release focused on core functionality. Please note:

- 🔄 **Project structure and features may evolve** in future versions
- � **Database schema updates** may require data migration
- 🎨 **User interface elements** are subject to improvement
- 🔧 **Configuration options** may change between releases

We recommend backing up your project data before updating to future versions.

## �📄 License

**BIOME** is licensed under the [Creative Commons Attribution-NonCommercial 4.0 International License](https://creativecommons.org/licenses/by-nc/4.0/).

### 🎓 Academic & Research Use
- ✅ **Free** for academic institutions and research facilities
- ✅ **Modify** and adapt for your research needs  
- ✅ **Share** with the scientific community
- ✅ **Collaborate** on improvements and features

### 🚫 Commercial Use Prohibited
- ❌ Commercial licensing or services
- ❌ Incorporation into commercial products
- ❌ Revenue generation without permission

**For commercial licensing inquiries**, please contact the project maintainer.

---

<div align="center">

**Built with ❤️ for the bioimage analysis community**

[⬆ Back to top](#biome---bio-imaging-organization-and-management-environment)

</div>