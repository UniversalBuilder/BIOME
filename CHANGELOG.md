# Changelog

All notable changes to this project will be documented in this file.

The format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) (adapted) and uses semantic, human-readable sections.

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
Get-FileHash .\BIOME_1.2.0_x64_en-US.msi -Algorithm SHA256
```

### Future Automation Ideas
- GitHub Actions workflow to build MSI on tag push and upload automatically.
- Automatic version synchronization script to reduce manual edits.

[1.2.0]: https://github.com/UniversalBuilder/BIOME/releases/tag/v1.2.0
[1.2.1]: https://github.com/UniversalBuilder/BIOME/releases/tag/v1.2.1
