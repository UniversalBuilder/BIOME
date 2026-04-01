# BIOME v2.5.6 - Release Notes

**Release date:** 2026-04-01
**MSI:** "BIOME_2.5.6_x64_en-US.msi"
**SHA-256:** "3F0F258B0921C8AF747353721E377D3E4EE3AC47912BAFAD55310EA13D24EDAE"
**Portable ZIP:** "BIOME_2.5.6_portable_windows_x64.zip"
**Portable SHA-256:** "5780833E45E514F43DB1FF98EA33133905DA19B5132BEBA9DEC591E6DE5450A2"

---

## What changed

### Bug Fixes
- **Desktop Backup Reliability:** Packaged desktop versions (MSI and Portable) now correctly bundle the new lock, unlock, and ename backup endpoints that were missing in v2.5.5 desktop distribution.
- **Backup Timestamp & Restores:** Fixed an issue where renamed backup files displayed the wrong creation timestamp (and showed localized time instead of UTC-relative preservation), and allowed restoring backups with customized .sqlite names safely in the /api/database/restore flow.

---

## Upgrade notes

This is a drop-in replacement for v2.5.5 and strictly provides bug fixes.

### Runtime storage destinations
- **Installed desktop (MSI):**
- "%APPDATA%\com.biome.desktop\biome\database.sqlite"
- **Portable ZIP:**
- "<portable_root>\data\database.sqlite"

---

## Verify integrity

```powershell
Get-FileHash .\BIOME_2.5.6_x64_en-US.msi -Algorithm SHA256
Get-FileHash .\BIOME_2.5.6_portable_windows_x64.zip -Algorithm SHA256
```
