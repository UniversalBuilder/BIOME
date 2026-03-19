# BIOME v2.5.5 - Release Notes

**Release date:** 2026-03-19  
**MSI:** `BIOME_2.5.5_x64_en-US.msi`  
**SHA-256:** `0AF48BA6B2F78A85748B0869C49D7F27C9D371B8C0D36AF81F60E945C4D9A80E`
**Portable ZIP:** `BIOME_2.5.5_portable_windows_x64.zip`  
**Portable SHA-256:** `377672655B9C546359BC6748EE9D6FA6F1E3C2559EF5C00DAD18490037F79169`

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
