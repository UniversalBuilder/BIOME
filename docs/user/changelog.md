# Changelog

This page summarises what changed in each release of BIOME. For the complete technical changelog, see [CHANGELOG.md](https://github.com/UniversalBuilder/BIOME/blob/main/CHANGELOG.md) on GitHub.

---

## v2.2.0 — February 2026

### New Features
- **Demo Data mode** — new "Load Demo Data" button in the Database page populates the app with 10 realistic bioimage projects, 6 researchers, and ~20 journal entries for evaluation or training
- **Empty first launch** — BIOME now starts completely empty on first run; demo content is always opt-in

### Bug Fixes
- Backup dates in the backup list now show the correct individual creation time (parsed from filename, not filesystem metadata)
- Delete Project modal now centers correctly at true viewport center regardless of scroll position
- All modals now use React Portals for correct stacking in all scroll contexts

### Improvements
- Project creation wizard background changed to a neutral style consistent with the rest of the app
- "+ New Group" / "+ New User" buttons unified to the bioluminescent accent colour
- Reset Database no longer re-seeds demo data

---

## v2.1.0 — February 2026

### New Features
- **Auto-backup system** — configure daily or weekly automatic backups in Settings; backups run at app start when the interval has elapsed
- **Database Manager backup UI** — Create Backup Now button, backup list with dates and sizes, and Restore button with confirmation

### Improvements
- Project details now uses colour fills to visually separate Project Metadata (Zone A) and Project Workspace (Zone B)
- Read-only fields in view mode are dimmed to clearly communicate edit requirements

### Bug Fixes
- Project creation now correctly saves image types, analysis goal, sample type, and objective magnification (previously silently dropped)
- Default project status on creation changed to "Preparing" to match UI filters
- All `window.confirm()` dialogs replaced with proper modal components (required for Tauri desktop)

---

## v2.0.0 — November 2025

### Major Changes
- Complete UI/UX overhaul with consistent scrolling, cleaned-up cards, and a unified design system
- Dashboard: Activity Feed now uses "Show more" pagination; stat cards renamed for clarity; modernised About card
- Settings: Removed non-functional cards; added Data Management card with folder picker and auto-backup config
- Table View: Replaced virtualised rendering with standard mapped rows for consistent page-level scrolling
- Database Manager: Rewrote storage explanation to cover the hybrid SQLite + filesystem model

---

## v1.4.x — November 2025

- **v1.4.3** — Fixed Table View rendering with `react-window` v2.2.3
- **v1.4.2** — Version metadata synchronisation; no functional changes
- **v1.4.1** — Added `/api/app/meta` backend endpoint exposing version and changelog summary

---

## v1.3.x and earlier

See the [full CHANGELOG on GitHub](https://github.com/UniversalBuilder/BIOME/blob/main/CHANGELOG.md) for earlier release notes.
