# BIOME v2.5.3 — Release Notes

**Release date:** 2026-03-06
**MSI:** `BIOME_2.5.3_x64_en-US.msi`
**SHA-256:** `0CA1C3FBE9017EB853602DC8FCB662A85E5318AB8D265A193B48E8B9C9AABCEC`

---

## What changed

### Bug Fix — Metadata options empty on fresh install (desktop/MSI only)

On a brand-new installation the **Software**, **Imaging Techniques**, **Sample Type**, and **Analysis Goal** dropdown menus showed no options.

**Root cause:** The database schema initializer (`schema.js`) creates the `metadata_options` table on every startup using `CREATE TABLE IF NOT EXISTS` — without any seed data. The seeding migration in `db.js` was guarded by `if (!metaTable)`, meaning it only ran when the table did not exist yet. Because `schema.js` always creates the table first, the seed was permanently skipped on fresh installs and the table stayed empty forever.

Users who had upgraded from a pre-v2.4.0 release were not affected: for them the table genuinely did not exist when the migration first ran, so the seed executed correctly.

**Fix:** The seed is now conditioned on `COUNT(*) = 0` (table is empty) rather than the table not existing at all. The default options below are inserted via `INSERT OR IGNORE` — the operation is a no-op on databases that already contain user-configured options.

**Default options now seeded automatically:**

| Category | Values |
|---|---|
| Software | Fiji, ImageJ, CellProfiler, Imaris, QuPath, OMERO, Arivis, Other |
| Imaging Techniques | Widefield Fluorescence, Confocal Microscopy, Light Sheet Microscopy, Two-Photon Microscopy, TIRF Microscopy, STED Microscopy, STORM/PALM, Brightfield, Phase Contrast, DIC, Electron Microscopy, Other |
| Sample Type | Cells on Slides, Cells in Suspension, Tissue Slices, Whole Mount Tissue, Organoids, Embryos, Whole Organisms, In Vitro 3D Models, Other |
| Analysis Goal | Object Counting, Intensity Measurement, Colocalization Analysis, Cell Tracking, Morphological Profiling, Segmentation, Classification, Spatial Analysis, Time-lapse Analysis, Other |

---

## Upgrade notes

This is a drop-in replacement for v2.5.2. No data migration is required. If you already added custom metadata options through **Settings → Metadata Management**, they are preserved — the seed inserts new rows only when the table is completely empty.

---

## Verify integrity

```powershell
Get-FileHash .\BIOME_2.5.3_x64_en-US.msi -Algorithm SHA256
# Expected: 0CA1C3FBE9017EB853602DC8FCB662A85E5318AB8D265A193B48E8B9C9AABCEC
```
