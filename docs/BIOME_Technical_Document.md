# BIOME Technical Documentation

**Document Version:** 1.0  
**Date:** July 14, 2025  

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Requirements Specification](#2-requirements-specification)
3. [System Architecture](#3-system-architecture)
4. [Technical Components](#4-technical-components)
5. [Distribution Plan](#5-distribution-plan)
6. [Environment Detection](#6-environment-detection)
7. [Development Workflow](#7-development-workflow)

## 1. Project Overview

### 1.1 Project Name
**BIOME** (Bio Imaging Organization and Management Environment)

### 1.2 Purpose
BIOME is a comprehensive bioimage analysis project management application designed to organize, track, and manage biological imaging projects from inception to completion. The application serves as a central hub for researchers and teams working with bioimaging data, providing tools for project organization, collaboration, progress tracking, and analysis reporting.

### 1.3 Project Scope
The application aims to solve key challenges in bioimage analysis workflows:
- Organization of large sets of imaging data
- Collaboration between multiple researchers/groups
- Tracking changes and versions across analysis pipelines
- Managing project metadata and documentation
- Reporting progress and results
- Time tracking for research activities

## 2. Requirements Specification

### 2.1 User and Group Management
- **User Authentication:** Secure login and account management
- **User Profiles:** Store user information, preferences, and activity metrics
- **Group Management:** Create, edit, and manage research groups
- **Role-based Access Control:** Define permissions for different user roles

### 2.2 Project Management
- **Project Creation:** Set up new bioimage analysis projects with metadata
- **Project Organization:** Organize projects by type, status, group, and other attributes
- **Project Templates:** Create and use templates for common project types
- **Project Statistics:** Track project progress, time spent, and completion status

### 2.3 Data Management
- **Data Import:** Import bioimaging data sets from various sources
- **Data Organization:** Organize data within project hierarchies
- **Data Linking:** Associate data with specific experiments and analyses
- **Version Control:** Track changes to datasets and analysis scripts

### 2.4 Analysis Pipeline Management
- **Pipeline Definition:** Define analysis workflows and pipelines
- **Step Tracking:** Monitor progress through pipeline steps
- **Results Management:** Organize and visualize analysis results
- **Pipeline Templates:** Create reusable analysis pipeline templates

### 2.5 Reporting
- **Progress Reports:** Generate reports on project progress
- **Result Visualization:** Visualize analysis results
- **Export Functionality:** Export reports in various formats (PDF, Excel, etc.)
- **Sharing Options:** Share reports with team members

## 3. System Architecture

### 3.1 Technology Stack

#### Frontend
- **Framework:** React.js
- **UI Design:** TailwindCSS
- **State Management:** React Context API
- **Routing:** React Router

#### Backend
- **Server:** Node.js with Express
- **API:** RESTful endpoints
- **Authentication:** JWT-based
- **Database:** SQLite

#### Desktop Integration
- **Framework:** Tauri (Rust-based)
- **File System Access:** Tauri API/plugins
- **Native Features:** Window management, notifications

### 3.2 Application Architecture

#### Web Version
- Standard React SPA with API communication to Node.js backend
- Browser-based file access with limitations
- Focus on collaborative features

#### Desktop Version
- Tauri wrapper around React frontend
- Full native file system access
- Enhanced performance for local data handling

#### Environment Detection
- Runtime detection of platform (web vs. desktop)
- Feature adaptations based on available capabilities
- Unified codebase with conditional rendering

## 4. Technical Components

### 4.1 Core Components

#### Backend Server
- **Server Configuration:** Dynamic port allocation (default: 3001)
- **API Routes:** Modular route definitions
- **Authentication:** JWT middleware for secure access
- **Database Access:** SQLite integration with ORM

#### Frontend Structure
- **Components:** Reusable UI components
- **Pages:** Route-specific page components
- **Services:** API communication services
- **Utilities:** Helper functions and tools

#### Database Schema
- **Users:** User accounts and profiles
- **Groups:** Research groups and memberships
- **Projects:** Project definitions and metadata
- **Data:** Dataset references and metadata
- **Analysis:** Analysis pipelines and results
- **Activities:** User activity logs

### 4.2 Environment Detection System

Advanced detection system with multiple fallback strategies:

1. **Tauri Global Object Detection:** Checks for `window.__TAURI__`
2. **Protocol Detection:** Identifies `tauri:` protocol
3. **IPC/Metadata Detection:** Checks Tauri-specific properties
4. **Feature Detection:** Examines window/screen characteristics
5. **User Agent Analysis:** Analyzes browser fingerprint
6. **Manual Overrides:** URL parameters and localStorage settings

### 4.3 API Structure

RESTful API with the following namespaces:
- `/api/users` - User management
- `/api/groups` - Group management
- `/api/projects` - Project operations
- `/api/data` - Data management
- `/api/analysis` - Analysis pipelines
- `/api/reports` - Reporting functionality

## 5. Distribution Plan

### 5.1 Distribution Options

#### Web Application
- Static files served by Express server
- Backend API on same server
- Single package deployment

#### Desktop Application
- Tauri bundled application
- Embedded backend server
- Native installer for Windows

### 5.2 Package Structure

Distribution package includes:
- React frontend build
- Node.js backend
- SQLite database (empty/template)
- Documentation
- Installation scripts

### 5.3 Installation Process

1. Extract distribution package
2. Run installer script
3. Configure application settings
4. Create desktop shortcuts
5. Launch application

## 6. Environment Detection

BIOME includes a sophisticated environment detection module that determines whether the application is running in web or desktop mode:

```javascript
// Environment detection module with multiple strategies
export const detectEnvironment = (debug = false) => {
  // Strategy 1: Check for Tauri global object
  const hasTauriGlobal = typeof window !== 'undefined' && 
                       typeof window.__TAURI__ !== 'undefined';
  
  // Strategy 2: Check for Tauri protocol
  const isTauriProtocol = typeof window !== 'undefined' && 
                       window.location && 
                       window.location.protocol === 'tauri:';
  
  // Additional strategies...
  
  // Final determination with fallbacks
  const isTauri = hasTauriGlobal || isTauriProtocol || /* other checks */;
  
  return { isTauri, /* other environment info */ };
};

// Usage throughout the application
import Environment from '../utils/environmentDetection';
const isDesktop = Environment.isTauri();
```

## 7. Development Workflow

### 7.1 Running in Development Mode

#### Web Mode
```powershell
# Using helper script
.\dev-start.ps1

# Manual commands
cd projet-analyse-image-frontend
npm run start-both
```

#### Desktop Mode
```powershell
# Using helper script
.\dev-start.ps1 -Mode desktop

# Manual commands
cd projet-analyse-image-frontend
npm run start-backend  # In one terminal
npm run tauri-dev     # In another terminal
```

### 7.2 Building for Production

#### Web Production Build
```powershell
# Using helper script
.\build.ps1

# Manual steps
cd projet-analyse-image-frontend
npm run build
cd ..
npm install
npm start
```

#### Desktop Production Build
```powershell
# Using helper script
.\build.ps1 -Mode desktop

# Manual steps
cd projet-analyse-image-frontend
npm run tauri-build
```

#### Distribution Package
```powershell
# Using helper script
.\build.ps1 -Mode distribution -Version "1.0.0"

# Manual steps
.\create-distribution.ps1
```
