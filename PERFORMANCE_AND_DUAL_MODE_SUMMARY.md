# BIOME v1.4.2 - Performance & Dual Mode Update

## New Features

### 1. Dual Mode Operation (Desktop & Web) ✅
**Goal**: Allow BIOME to run as a native desktop app (Tauri) OR a standalone web server (Node.js) sharing the same data.

**Implementation**:
- **Unified Database Path**: Modified `backend/src/database/db.js` to ensure both modes use the same SQLite database location:
  - Path: `%LOCALAPPDATA%\com.biome.desktop\biamanger\database.sqlite`
  - This ensures that if a user switches between Desktop and Web modes, they see the same projects.
- **Web Launcher**: Created `launch-web-mode.bat` to easily start the application in Web Mode.
  - Sets `NODE_ENV=production`.
  - Launches the bundled Node.js server.
  - Opens the default browser to `http://localhost:3001`.
- **Resource Bundling**: Updated `src-tauri/tauri.conf.json` to include the backend, server script, and launcher in the MSI installer.

### 2. Virtualized Tables for Performance ✅
**Goal**: Improve rendering performance for large project lists.

**Implementation**:
- **Library Integration**: Integrated `react-window` for list virtualization and `react-virtualized-auto-sizer` for responsive sizing.
- **Component Refactoring**: Completely refactored `ProjectTableView.js`.
  - Replaced standard HTML `<table>` with `FixedSizeList`.
  - Created a dedicated `Row` component for efficient rendering.
  - Maintained all existing functionality: Sorting, Filtering, Column Toggling, Selection, and Tooltips.
  - Added "Dense Mode" toggle support to the virtualized list (adjusting row height dynamically).
- **Performance Impact**:
  - Constant DOM node count regardless of list size.
  - Smoother scrolling and faster initial render.

## Technical Details

### Database Path Logic
The database path resolution logic now handles three scenarios:
1. **Tauri Production**: Uses `TAURI_APP_DATA` env var (set by Rust backend) -> `%LOCALAPPDATA%\com.biome.desktop`.
2. **Node Production (Web Mode)**: Manually constructs the path to match Tauri's default -> `%LOCALAPPDATA%\com.biome.desktop`.
3. **Development**: Falls back to local `backend/data/database.sqlite`.

### Virtualization Architecture
- **AutoSizer**: Automatically detects the available width and height in the container.
- **FixedSizeList**: Renders only the visible rows plus a small overscan buffer.
- **Sticky Header**: The table header is rendered outside the virtualized list to remain visible while scrolling.

## Verification
- **Dual Mode**: Verified that `launch-web-mode.bat` and the Tauri app resolve to the same database path on Windows.
- **Virtualization**: Verified that `ProjectTableView.js` correctly implements the virtualized list structure with all previous features intact.

## Next Steps
- **CI/CD**: Set up GitHub Actions for automated building and releasing.
- **Testing**: Perform end-to-end testing of the Dual Mode switching.
