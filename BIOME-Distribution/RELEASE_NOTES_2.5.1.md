# BIOME v2.5.1 — Release Notes

**Release date:** 2026-03-06  
**Type:** Patch — bug fixes only  
**Installer:** `BIOME_2.5.1_x64_en-US.msi`  
**SHA256:** `4A52FF30F77940A33FFDEC401B15698ED840A009656020D2E45E87ED8A11732A`

---

## What's Fixed

### Demo data loading

Clicking **Database → Load Demo Data** failed with:

```
Failed to load demo data: SQLITE_ERROR: table projects has no column named objective_magnification
```

The `objective_magnification` column was removed in the v2.4.0 database migration, but the INSERT statement in `demo-data.js` still referenced it. Fixed — demo data now loads correctly.

### New project creation

The same stale column reference existed in the `POST /api/projects` route, causing project creation to fail with a database error. Fixed — new projects can be created without error.

### Demo data software values

All 10 sample projects in the demo dataset had their `software` field stored as a plain string (e.g. `Imaris`). Since v2.4.0, software is a multi‑select field stored as a JSON array. The invalid format prevented software values from displaying correctly in project details. Fixed — all demo projects now use `["Imaris"]`, `["Fiji"]`, etc.

One sample project used `ImageJ` which is not a seeded metadata option. Changed to `Fiji` (which is seeded by default).

---

## Installation

1. Download `BIOME_2.5.1_x64_en-US.msi`
2. Right-click → **Run as administrator**
3. Follow the installation wizard

> **First launch after upgrade**: existing project data is preserved. The database schema is unchanged from v2.5.0.

### Verify integrity (optional)

```powershell
Get-FileHash .\BIOME_2.5.1_x64_en-US.msi -Algorithm SHA256
# Expected: 4A52FF30F77940A33FFDEC401B15698ED840A009656020D2E45E87ED8A11732A
```

### Windows Security Warning

BIOME is not yet code-signed. See the [Installation Guide](https://github.com/UniversalBuilder/BIOME#️-windows-security-warning) for SmartScreen and Smart App Control bypass instructions.

---

## Upgrading from v2.5.0

Direct upgrade — uninstall v2.5.0 via **Control Panel → Programs**, then install v2.5.1. The SQLite database is not touched by the uninstaller; your data is preserved.

---

## Full Changelog

See [CHANGELOG.md](https://github.com/UniversalBuilder/BIOME/blob/main/CHANGELOG.md) for the complete history.
