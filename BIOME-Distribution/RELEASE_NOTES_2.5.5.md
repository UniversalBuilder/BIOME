# BIOME v2.5.5 - Release Notes

**Release date:** 2026-03-19  
**MSI:** `BIOME_2.5.5_x64_en-US.msi`  
**SHA-256:** `A26F3922ED6F0217152E58F2A10AD370EFE6B70B8858268C8A75253C8C07D3A6`

---

## What changed

### Bug Fixes
- **Backup management reliability improved:** Backup rename/lock/unlock now includes stricter validation and safer backend handling for invalid names and collisions.
- **Locked backups are now protected from auto-prune:** Backups marked as locked are excluded from automatic cleanup.
- **Project import/create flow made more resilient:** Desktop folder validation now handles "folder not yet created" states cleanly, and import flow better handles mixed metadata states.
- **Tooltip/modal interaction regression fixed:** Tooltip behavior was refactored to avoid modal focus and click interference.

### New Features
- **Backup rename + lock/unlock controls:** Added backend endpoints and frontend controls in Database Management.
- **`biome.json` metadata flow:** Project creation now writes `biome.json`, and import can detect it to pre-fill metadata and seed resources.
- **Tauri file commands:** Added native JSON/text file read-write commands used by desktop metadata workflows.

### Technical Changes
- **Import resource seeding endpoint:** Added idempotent project resource seeding from `biome.json` resources in import workflows.

---

## Upgrade notes

This is a drop-in replacement for v2.5.4. No data migration is required.

---

## Verify integrity

```powershell
Get-FileHash .\BIOME_2.5.5_x64_en-US.msi -Algorithm SHA256
```
