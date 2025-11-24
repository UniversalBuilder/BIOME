# Changelog

All notable changes to this project will be documented in this file.

The format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) (adapted) and uses semantic, human-readable sections.

## [Unreleased]

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
