# Changelog

All notable changes to this project will be documented in this file.

The format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) (adapted) and uses semantic, human-readable sections.

## [Unreleased]

## [2.2.0] - 2026-02-26
### Added
- **Demo Data mode**: New "Load Demo Data" button in the Database page. Populates the database with 10 realistic bioimage analysis projects, 6 researchers across 3 imaging core groups, and ~20 journal entries. A safety backup is created automatically before loading if the database already contains data.
- **Empty database on first launch**: BIOME now starts completely empty on first run and after Reset. Demo content is opt-in via the explicit "Load Demo Data" button — real user data is never silently overwritten by application updates or resets.

### Fixed
- **Backup date display**: All backups in the list were showing the same "Created" timestamp (the filesystem `mtime`). Dates are now parsed directly from the filename (`database-YYYY-MM-DD_HH-MM-SS.sqlite`), showing the correct individual creation time for each backup.
- **Delete Project modal positioning**: The confirmation dialog now uses a React Portal and renders at true viewport center, regardless of scroll position or parent transform context.
- **WizardFormModal**: All modals now use a React Portal (`z-[9999]`) ensuring correct stacking and centering in all scroll contexts. Added `variant="danger"` prop for destructive-action modals (red button + warning icon in title).

### Changed
- **Project creation wizard**: Background changed from a heavy blue gradient to a neutral `bg-gray-50 dark:bg-night-900`. Main card now uses the standard app card style (`night-800` border, `shadow-sm`) instead of a blurred glass effect.
- **+ New Group / + New User buttons**: Unified to bioluminescent accent color to match the app design system. "+" New User button is visibly disabled (greyed, `opacity-60`) when no group is selected, with a CSS tooltip "Select a group first".
- **Reset Database**: No longer re-seeds demo data after reset — leaves database completely empty, consistent with the new first-launch behavior.

## [2.1.0] - 2026-02-26
### Added
- **Auto-backup system**: New backup scheduler (`backupService.js`) reads auto-backup settings from the Settings page and creates a timestamped SQLite snapshot on app start when the configured interval (daily/weekly) has elapsed.
- **Database Manager — backup UI**: "Automatic Backups" section with Create Backup Now button, backup list table (filename, date, size), and Restore button with confirmation modal.
- **Inline backup feedback**: Success/error message appears directly in the backup section after clicking Create Backup Now, without requiring scroll-to-top.

### Changed
- **ProjectDetails — Zone separation**: Project Metadata (Zone A) and Project Workspace (Zone B) are now visually separated by distinct background fills (neutral gray vs. bioluminescent tint) instead of border lines.
- **ProjectDetails — Read-only greying**: Project Information, Time Tracking, and Description sections are dimmed (`opacity-60`) in view mode to communicate that they require Edit Project to modify. Folder & Structure action buttons remain at full opacity at all times.
- **ProjectDetails — removed border**: Outer border lines on Zone A and Zone B replaced by fill-based visual separation, consistent with the rest of the app's card style.

### Fixed
- `projectService.create()` now correctly sends `image_types`, `analysis_goal`, `sample_type`, and `objective_magnification` — previously these fields were silently dropped when creating a new project via the wizard.
- Default project status on creation changed from `'Intake'` to `'Preparing'` to match the UI status filter.
- All `window.confirm()` dialogs replaced with `WizardFormModal` (compatible with Tauri desktop where native dialogs are blocked).
- Backup directory path now derived from the database file location (`getDatabasePath()`) instead of `process.cwd()`, fixing backups failing when the backend was launched from a different working directory.

## [2.0.0] - 2025-11-27
### Changed
- **Major UI/UX Overhaul**: Consolidated scrollbars across the application for a cleaner, more professional interface.
- **Dashboard Improvements**:
  - Activity Feed now uses "Show more" pagination instead of a fixed-height scrollable container.
  - Renamed "Active Projects" stat card to "In Progress" to distinguish from "Active" status filter.
  - Modernized About card with gradient background, version badge, and tech stack tags (Tauri, React, SQLite).
- **Database Manager**: Rewrote Database Information section to explain the hybrid storage model (SQLite metadata + project folders).
- **Settings Page**: Removed non-functional Application Mode and Development Tools cards; added Data Management card with project folder picker and auto-backup options.
- **Table View**: Replaced react-window virtualization with regular mapped rows for page-level scrolling consistency.
- **Analytics Page**: Fixed scrolling behavior to use page-level scrollbar.

### Fixed
- Multiple scrollbar issues across Dashboard, Table View, Analytics, and UserGroupManager.
- "View all activities" link now correctly navigates to the Activity tab.
- Table View no longer has its own inner scrollbar; rows extend naturally with page scroll.

### Technical
- Updated version to 2.0.0 across frontend, backend, and Tauri configuration.
- Removed max-height constraints from dashboard cards that caused layout issues.

## [1.4.3] - 2025-11-25
### Fixed
- Project Table View rendering issues where the table appeared empty despite having data.
- Resolved conflict between `react-window` v2.2.3 and `react-virtualized-auto-sizer` by removing the external sizer and relying on the library's internal `ResizeObserver`.
- Updated `react-window` API usage to match the installed version (v2.2.3).

## [1.4.2] - 2025-11-24
### Changed
- Rebuilt Windows MSI and synchronized version metadata across frontend, backend, and Tauri config.
- Updated README links and version badge to 1.4.2.

### Notes
- No functional changes from 1.4.1; this release ensures the downloadable installer matches the current source tree.

## [1.4.1] - 2025-11-11
### Added
- Backend endpoint `/api/app/meta` exposing application version, description, and short changelog summary (web + packaged backend).
- Build-time generator `scripts/generate-app-meta.js` creates `app-meta.json` (bundled for desktop and available in dev) as a stable metadata source.

### Changed
- Dashboard About card now loads dynamic version/release date and displays top recent changes (fallback to current date if missing).
- Theme description wording updated to neutral “bioluminescent forest” (dark) / “primal shores” (light) language.
- Version bumped to 1.4.1 across frontend and backend for metadata consistency.

### Fixed
- Empty version/date display in About card when changelog parsing failed; now falls back gracefully and uses generated metadata.

### Repository
- Updated `repository` and `homepage` URLs in `frontend` and `backend` `package.json` to point to `UniversalBuilder/BIOME` for accurate online metadata.


## [1.4.0] - 2025-11-06
### Added
- Attach files to projects (Resources):
	- Backend: list/upload/serve/update/delete endpoints under `/api/projects/:id/references` and README resources updater at `/api/projects/:id/readme/resources`.
	- Files saved inside the project's `reference/` folder; images (JPEG/PNG) previewable; documents (PDF/TXT/Word) downloadable.
	- Database: `project_resources` table stores metadata (filename, original name, mime, kind, caption, size, created_at).
	- Frontend: Resources section in Project Details with uploads, captions, preview grid for images, and a documents list. Button to update the README resources section.
### Fixed
- Desktop dev compile errors around backend startup were resolved by delegating backend start to the frontend launcher in debug builds and fixing Tauri invoke params.
- SVG icon path error on LandingPage replaced with a valid path (removed console warning about arc flag).


## [1.3.1] - 2025-11-06
### Changed
- Project list: selected project title now renders in cyan for stronger visual consistency with the table.
- Output/result pictograms unified across list and table; 24px standard size retained.

### Fixed
- In Projects Table, the Output icon on the active row now turns cyan (icon + circular border) like the rest of the row.
- Removed the inner table scrollbar; only the page scrollbar remains, so the table extends to the bottom naturally.
- Resolved double tooltip on the Output icon (removed native title attribute; kept custom tooltip).

## [1.3.0] - 2025-11-05
### Added
- Edit journal entries (mark edited time and optional editor). New API: PATCH /api/projects/:id/journal/:entryId
	- Frontend: Edit action in ProjectDetails with modal; shows “edited · <time>” metadata.
	- Backend: journal_entries now has edited_at, edited_by; safe migration runs on startup (web + packaged backends).
	- Diff preview: low-risk line diff in edit modal to visualize changes.
	- Delete journal entry: DELETE /api/projects/:id/journal/:entryId with UI confirmation.
	- README/Export: Journal entries now include “(edited by … on …)” when edited in README generation (web template) and desktop README update.
### Fixed
- Desktop dev rebuild could leave the backend process running, causing “port already in use” on 3001. Main process now reuses an existing backend if healthy and kills the child on window close.

## [1.2.1] - 2025-11-05
### Fixed
- Project list was truncating before the window bottom on some sizes; list now stretches correctly and only shows bottom hint when it actually overflows.
### Changed
- Scroll hint capsules restyled with the bioluminescent palette for better prominence and visual consistency with Activity Feed chips.

## [1.2.0] - 2025-09-24
### Added
- Unified reusable `WizardFormModal` for create / edit / delete flows (projects, users, groups).
- Inline creation of Users & Groups directly inside Project Creation Wizard (auto-select + refresh).
- Dashboard “Quick Start” panel showing recent projects and New Project entry.
- Subtle project meta line: “Last updated • Created” replacing noisy status indicator when empty.
- Helper PowerShell scripts: `scripts/publish-github-release.ps1` and `scripts/set-default-branch.ps1` for release automation.

### Changed
- Dashboard layout: eliminated gap in stats row (Completion Rate card placement fix).
- Hover & focus styles standardized (new `hover-soft` utility) for accessible interaction feedback.
- About / version references bumped to 1.2.0 across frontend, backend, Tauri config, and docs.
- Repo history reset to a clean, lightweight main branch (removed legacy large binaries/build artifacts).

### Fixed
- Inconsistent delete / confirmation modal styles (now unified under `WizardFormModal`).
- Hover visibility issues on recent projects list.
- Intermittent layout shifts due to grid gap in analytics/dashboard stats row.
- Redundant environment detection fallbacks referencing deprecated helpers (migrated usages to `Environment.isTauri()`).

### Removed
- Historical large build outputs (`target/`, MSI/ZIP artifacts, debug symbols) from Git history to reduce clone/push size.

### Internal
- Added `.gitignore` entry for `BIOME-source-only/` to prevent accidental nested repo commits.
- Introduced clean release workflow (source in Git, binaries only in GitHub Releases).

## [1.1.0] - 2025-??-??
Initial broader feature baseline with dual-mode (web + desktop), database model, environment detection, and demo dataset. (Historic details condensed after history cleanup.)

## [1.0.0] - 2025-??-??
Foundational release establishing core project management, analytics scaffolding, and Tauri packaging prototype.

---

### Release Process Summary (for future versions)
1. Bump versions (frontend `package.json`, backend `package.json`, Tauri `tauri.conf.json`, Rust `Cargo.toml`, UI About, docs badges).
2. Run dependency setup: `npm run setup-deps` (root or frontend script as documented).
3. Build desktop installer: `npm run build-with-deps`.
4. Tag: `git tag vX.Y.Z && git push origin vX.Y.Z`.
5. Create GitHub Release; attach MSI and publish notes (use this changelog entry as body).
6. (Optional) Add checksum snippet to Release body.

### Checksum Example
```powershell
Get-FileHash .\BIOME_1.4.0_x64_en-US.msi -Algorithm SHA256
```

### Future Automation Ideas
- GitHub Actions workflow to build MSI on tag push and upload automatically.
- Automatic version synchronization script to reduce manual edits.

[1.2.0]: https://github.com/UniversalBuilder/BIOME/releases/tag/v1.2.0
[1.2.1]: https://github.com/UniversalBuilder/BIOME/releases/tag/v1.2.1
[1.3.0]: https://github.com/UniversalBuilder/BIOME/releases/tag/v1.3.0
[1.3.1]: https://github.com/UniversalBuilder/BIOME/releases/tag/v1.3.1
[1.4.0]: https://github.com/UniversalBuilder/BIOME/releases/tag/v1.4.0
[1.4.1]: https://github.com/UniversalBuilder/BIOME/releases/tag/v1.4.1
[1.4.2]: https://github.com/UniversalBuilder/BIOME/releases/tag/v1.4.2
[1.4.3]: https://github.com/UniversalBuilder/BIOME/releases/tag/v1.4.3
