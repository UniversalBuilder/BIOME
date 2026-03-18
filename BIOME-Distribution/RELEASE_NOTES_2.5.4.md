# BIOME v2.5.4 - Release Notes

**Release date:** 2026-03-18  
**MSI:** `BIOME_2.5.4_x64_en-US.msi`  
**SHA-256:** `E81E84C24CCC4F7BCC504EA7B99277700BDE3FBE4E35DA3299C63A355FEE523A`

---

## What changed

### Bug Fixes
- **Project creation wizard scroll fixed:** The Create Project flow now scrolls correctly on smaller desktop windows, so all fields and action buttons are accessible without resizing.
- **Cancel button made consistent and clearer:** The wizard Cancel button now uses the same destructive visual language as the confirmation dialog (filled red button with white text).
- **Background rendering fixed while scrolling:** The wizard page background now covers the full scrollable area, including the bottom section around actions.

---

## Upgrade notes

This is a drop-in replacement for v2.5.3. No data migration is required.

---

## Verify integrity

```powershell
Get-FileHash .\BIOME_2.5.4_x64_en-US.msi -Algorithm SHA256
```
