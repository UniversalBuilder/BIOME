# BIOME Technical Specifications Summary

## Application Overview
BIOME (Bio Imaging Organization and Management Environment) is a desktop application built with Tauri and React that manages bioimage analysis projects. It provides a comprehensive solution for tracking project progress, managing files, organizing users and groups, and logging all project-related activities.

## Technology Stack

### Current Implementation
- **Frontend**: 
  - React.js
  - Tailwind CSS
  - Context API for state management
- **Desktop Framework**: 
  - Tauri (Rust-based desktop framework)
- **Backend**:
  - Node.js Express server
  - RESTful API architecture
  - JWT authentication
- **Database**:
  - SQLite
- **Deployment Options**:
  - Local backend server launched by Tauri
  - Docker-based backend
  - Standalone Node.js server

### Key Technical Components

#### Backend Server Management
- Dynamic port allocation (default: 3001)
- Multiple backend discovery paths for development
- Health check monitoring
- Graceful shutdown
- Support for Docker-based backend alternatives

#### Data Storage
- SQLite database for structured data
- File system references for large binary data
- Project file structure tracking
- Version control mechanisms

#### Authentication & Authorization
- User authentication system
- Group-based permissions
- Role-based access control

#### Monitoring
- Activity logging
- Time tracking
- Health checks
- Error logging

## Core Functionality

### Project Management
- Project creation and configuration
- Status tracking
- Timeline management
- Progress logging

### User & Group Management
- User profiles and authentication
- Research group organization
- Permission management
- Activity tracking

### File Management
- File location tracking
- Folder structure organization
- File version tracking
- File metadata management

### Analysis Tracking
- Analysis pipeline documentation
- Result storage and organization
- Change tracking
- Time spent recording

### Reporting & Analytics
- Project statistics
- User activity metrics
- Group performance analytics
- Data export capabilities

## Database Schema (Core Entities)

### Users
- Basic profile information
- Authentication credentials
- Settings and preferences
- Activity metrics

### Groups
- Group information
- Membership relationships
- Permission settings
- Group metrics

### Projects
- Project metadata
- Status information
- Timeline data
- File structure references

### Files
- File path references
- Metadata
- Version history
- Relationship to projects

### Activities
- User actions
- Timestamps
- Related entities
- Duration metrics

## API Endpoints (Core)

### Authentication
- `/api/auth/login`
- `/api/auth/register`
- `/api/auth/logout`
- `/api/auth/refresh`

### Users
- `/api/users`
- `/api/users/:id`
- `/api/users/:id/activity`

### Groups
- `/api/groups`
- `/api/groups/:id`
- `/api/groups/:id/members`
- `/api/groups/:id/projects`

### Projects
- `/api/projects`
- `/api/projects/:id`
- `/api/projects/:id/files`
- `/api/projects/:id/activities`
- `/api/projects/:id/members`

### Files
- `/api/files`
- `/api/files/:id`
- `/api/files/:id/versions`

### Analytics
- `/api/analytics/projects`
- `/api/analytics/users`
- `/api/analytics/groups`

## Backend Migration Considerations

### Current Architecture
The application uses a Node.js Express backend that can be:
1. Launched automatically by the Tauri application
2. Run via Docker
3. Operated as a standalone server

### Migration to Tauri SQLite Service
Moving to a pure Tauri SQLite embedded service would involve:

#### Benefits
- Reduced complexity (no separate Node.js process)
- Better performance via native Rust implementation
- Simplified deployment (single executable)
- Direct database access without HTTP overhead
- Improved security (no exposed HTTP endpoints)

#### Implementation Requirements
1. **Data Layer**:
   - Create Rust models that mirror current database schema
   - Implement SQLite operations in Rust
   - Create migration path from existing database

2. **Business Logic**:
   - Port Node.js business logic to Rust
   - Implement Tauri commands for frontend-backend communication
   - Create validation and error handling mechanisms

3. **API Compatibility**:
   - Map existing REST endpoints to Tauri commands
   - Maintain consistent data structures
   - Support existing authentication mechanisms

4. **Background Processing**:
   - Implement Rust-based solutions for background tasks
   - Consider thread management and UI responsiveness
   - Handle long-running operations

#### Migration Strategy
1. **Incremental Approach**:
   - Start with core data models (users, projects)
   - Add more complex functionality incrementally
   - Run both backends in parallel during transition

2. **Testing Strategy**:
   - Create comparison tests between Node.js and Rust implementations
   - Ensure data integrity during migration
   - Performance benchmarking

3. **Rollback Plan**:
   - Maintain compatibility with Node.js backend
   - Create data export/import tools
   - Version control database schema changes

## Performance Expectations

### Current Performance
- Backend startup: 2-5 seconds
- API response times: ~100ms for simple queries
- Database operations: ~50-500ms depending on complexity

### Target Performance After Migration
- Embedded service startup: <1 second
- Command response times: <50ms for simple operations
- Database operations: <100ms for complex queries

## Security Considerations

### Authentication
- JWT tokens for current API implementation
- Consider Tauri's secure storage for credentials
- Maintain session management capabilities

### Data Protection
- Local file encryption options
- Secure storage of connection credentials
- Protection against unauthorized data access

### Input Validation
- Consistent validation patterns
- Prevention of SQL injection
- Sanitization of user inputs

## Deployment Considerations

### Single-User Deployment
- Self-contained executable with embedded database
- Automatic updates via Tauri
- Local data storage and backup

### Multi-User Deployment
- Shared database server
- User authentication and authorization
- Network file access protocols

## UI Design System Technical Implementation

### Design System Architecture
- **Theme Context**: React Context API-based theming system
- **Component Library**: Custom component system with consistent styling
- **Design Tokens**: Centralized design variables for consistent application
- **Responsive Framework**: Tailwind CSS with custom configuration

### Avatar Pandora Theme Implementation

#### Color System
- **Theme Configuration**: Two distinct color palettes based on Avatar Pandora aesthetics:
  - Light Mode (Daytime): Soft blues, cyans, and natural greens
  - Dark Mode (Nighttime): Deep blues with vibrant bioluminescent accents
- **Color Variables**: Defined in Tailwind configuration for consistent application
- **Dynamic Theming**: Theme switching with persistent user preference storage

#### Light Mode Palette (Hex Values)
```
Silver: #CFD3D7 (Primary background)
Indigo Dye: #144B7B (Primary accent)
Ash Gray: #ABBDBE (Secondary background)
Dark Cyan: #499BA0 (Interactive elements)
Brunswick Green: #134734 (Highlights)
Air Force Blue: #7293A2 (Supporting elements)
```

#### Dark Mode Palette (Hex Values)
```
Emerald: #05D59F (Primary accent)
Grape: #571BB0 (Secondary accent)
Oxford Blue: #0A1225 (Primary background)
Rich Black: #010913 (Secondary background)
Dark Cyan: #038A80 (Interactive elements)
Forest Green: #019343 (Success indicators)
Caribbean Current: #105D5F (Supporting elements)
Royal Blue: #0A2B6E (Container backgrounds)
Robin Egg Blue: #07BEBF (Highlights)
Brunswick Green: #0C4031 (Secondary highlights)
```

### Component Implementation

#### Card System
- **Implementation**: React functional components with Tailwind CSS
- **Variants**: Multiple card styles (basic, detail, dashboard, etc.)
- **Props API**: Consistent property interface for all card components
- **Shadow System**: CSS variables for elevation levels
- **Animation**: Subtle hover and active state animations
- **States**: Active, inactive, hover, and focus states

#### Tab Navigation
- **Implementation**: Custom tab components using React state
- **Active Indicators**: Animated underline/highlight for active tabs
- **Accessibility**: ARIA roles and keyboard navigation support
- **Content Switching**: Efficient content rendering between tabs
- **Responsive Behavior**: Horizontal to vertical layout conversion on small screens

#### Button System
- **Implementation**: Styled button components with consistent API
- **Variants**: Primary, secondary, text, icon, and toggle buttons
- **States**: Default, hover, active, focus, and disabled states
- **Icons**: Support for leading and trailing icons
- **Tooltips**: Integrated tooltip system for additional context
- **Loading States**: Built-in loading indicators

### Layout Technical Implementation
- **Grid System**: Responsive 12-column grid implementation
- **Card Layout**: Grid-based card organization with responsive breakpoints
- **Container Components**: Consistent margin and padding system
- **Nested Layout Support**: Component composition for complex layouts
- **Z-Index Management**: Standardized elevation system

### Responsive Implementation
- **Breakpoints**: Standard breakpoints (sm, md, lg, xl, 2xl)
- **Mobile-Desktop Strategy**: Desktop-first with adaptation for smaller screens
- **Media Queries**: Standard Tailwind breakpoint approach
- **Component Adaptation**: Layout shifting based on available screen space

### Typography System
- **Font Stack**: System fonts with consistent fallbacks
- **Scale**: Modular type scale with consistent ratios
- **Weight System**: Limited font weights (400, 500, 600, 700)
- **Line Heights**: Proportional line heights based on font size
- **Text Colors**: Theme-aware text coloring system

### Animation & Transitions
- **Timing Functions**: Standardized easing functions
- **Duration Scale**: Consistent duration values (100ms, 200ms, 300ms)
- **Loading States**: Themed spinners and progress indicators
- **Page Transitions**: Subtle content transitions between views
- **Interaction Feedback**: Visual feedback for user interactions

### Implementation Considerations for Backend Migration

#### UI Consistency During Migration
- Maintain consistent prop interfaces between frontend components
- Implement adapter layer to handle backend response differences
- Create consistent error handling patterns for both backends
- Develop backend-agnostic state management approach

#### Design Token Management
- Store design tokens (colors, spacing, etc.) in central location
- Ensure theme configuration is accessible to both frontend and Tauri
- Implement theme persistence that works with both backend implementations

#### Component Testing
- Visual regression tests to ensure consistent rendering
- Interaction tests for component behavior
- Performance benchmarking for component rendering

#### Migration Testing Plan
- Component-by-component visual comparison between backends
- User flow testing with both backend implementations
- Performance comparison between implementations

## Conclusion
This technical specification provides a foundation for understanding the BIOME application's architecture and requirements. When migrating from the current Node.js backend to a Tauri SQLite service, maintaining feature parity while leveraging the performance benefits of Rust will be the primary goal. The modular design of the application allows for this migration without significant changes to the frontend user experience.