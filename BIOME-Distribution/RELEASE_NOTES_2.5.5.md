# BIOME v2.5.5 - Release Notes

**Release date:** 2026-03-19
**MSI:** `BIOME_2.5.5_x64_en-US.msi`
**SHA-256:** `CB747F88DF4E74725870A0B38AD51FF70CCABDF7EA6119ED3F2FED4AC3BD7511`
**Portable ZIP:** `BIOME_2.5.5_portable_windows_x64.zip`
**Portable SHA-256:** `D1886B7087AE0C8DF5DF5FB2D71E9ECDB3172D5ADB49D7F9F3B72B918AF2AD14`

---

## What changed

### Bug Fixes
- **Backup management reliability improved:** Backup rename/lock/unlock now includes stricter validation and safer backend handling for invalid names and collisions.
- **Locked backups are now protected from auto-prune:** Backups marked as locked are excluded from automatic cleanup.
- **Project import/create flow made more resilient:** Desktop folder validation now handles "folder not yet created" states cleanly, and import flow better handles mixed metadata states.
- **Tooltip/modal interaction regression fixed:** Tooltip behavior was refactored to avoid modal focus and click interference.
- **Database path isolation fixed across runtimes:** Dev, installed desktop, and portable builds now use separate database/backups locations to prevent cross-mode data collisions.
- **Legacy path typo migration added:** Existing desktop databases from legacy `biamanger` paths are automatically migrated to the corrected `biome` path when needed.

### New Features
- **Backup rename + lock/unlock controls:** Added backend endpoints and frontend controls in Database Management.
- **`biome.json` metadata flow:** Project creation now writes `biome.json`, and import can detect it to pre-fill metadata and seed resources.
- **Tauri file commands:** Added native JSON/text file read-write commands used by desktop metadata workflows.

### Technical Changes
- **Import resource seeding endpoint:** Added idempotent project resource seeding from `biome.json` resources in import workflows.

---

## Upgrade notes

This is a drop-in replacement for v2.5.4.

- No manual migration step is required.
- If a legacy desktop path using `biamanger` is detected, BIOME migrates it automatically to `biome`.

### Runtime storage destinations (validated)

- **Dev mode:**
	- `D:\DEV\BIOME\backend\data\database.sqlite`
	- `D:\DEV\BIOME\backend\data\backups`
- **Installed desktop (MSI):**
	- `%APPDATA%\com.biome.desktop\biome\database.sqlite`
	- `%APPDATA%\com.biome.desktop\biome\backups`
- **Portable ZIP:**
	- `<portable_root>\data\database.sqlite`
	- `<portable_root>\data\backups`

---

## Verify integrity

```powershell
Get-FileHash .\BIOME_2.5.5_x64_en-US.msi -Algorithm SHA256
Get-FileHash .\BIOME_2.5.5_portable_windows_x64.zip -Algorithm SHA256
```
