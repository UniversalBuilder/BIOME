# BIOME v2.5.0 — Release Notes

**Release date:** 2026-03-05  
**Tag:** `v2.5.0`  
**Platform:** Windows x64

---

## What's New

### 📊 Analytics Exports (New Feature)

Projects can now be exported directly from the Analytics page in two professional formats:

**PDF Export**
- Full analytics report with cover page, summary table, and 10 embedded charts
- Charts included: Status Distribution, Output Type Distribution, Software Distribution, Date-Based Trends, Monthly Activity, Group Performance, Duration Distribution, Time Spent Distribution, Priority Distribution, Risk Distribution
- Respects the active date filter — exported data always matches what is displayed on screen
- One-click export via the "Export PDF" button in the Analytics toolbar

**Excel Export**
- Multi-sheet workbook: Summary, Projects (full data), and 5 dedicated chart data sheets (Status, Output Type, Software, Time, Duration distributions)
- All columns formatted and named for direct use in pivot tables or custom charts
- Also date-filter-aware — reflects the current Analytics view

---

## 🔒 Security Hardening

- **Content Security Policy (CSP)** — the Tauri webview CSP was previously set to `null` (no restrictions). It now enforces a restrictive policy: `default-src 'self'`, allowing only local resources and connections to `localhost` / `127.0.0.1` for backend API calls.
- **Helmet middleware** — the Express backend (both web and bundled Tauri modes) now uses the `helmet` package, setting secure HTTP headers (X-Content-Type-Options, X-Frame-Options, HSTS, etc.) on every response.

---

## 🔧 Maintenance & Quality

- **Version sync** — all `package.json` files, `Cargo.toml`, `tauri.conf.json`, and `app-meta.json` were out of sync (ranging from 2.0 to 2.4). All are now uniformly at **2.5.0**.
- **Repository cleanup** — removed 12 obsolete artefact files from the project root (stale logs, one-time migration scripts, superseded release notes, draft files). Moved Python icon utilities to `scripts/icon-utils/` and developer-only docs to `docs/dev/`.
- **Console noise removed** — 9 debug `console.log` statements removed from production code (`LandingPage.js`, `Dashboard.js`, `Layout.js`). An unused `Environment` import was also removed from `Layout.js`.
- **Documentation corrections** — three user-facing docs corrected after a systematic audit:
  - `projects.md`: removed reference to "objective magnification" (feature removed in v2.4.0); removed false "Export as ZIP" claim
  - `analytics.md`: corrected metric card names (were "Completed" + "Users", now "Avg. Time per Project" + "Completion Rate"); chart renamed "Group Performance"; Activity Feed correctly attributed to Dashboard only
  - `analytics-export.md`: PDF chart count corrected (11 → 10); Excel sheet count corrected (13+ → 7)

---

## Installation

Download `BIOME_2.5.0_x64_en-US.msi` and run the installer. The app will upgrade any existing installation in-place — your data and settings are preserved.

**SHA-256 checksum:**
```
A94EBD3FBE85EFFCFCCDB4B539F244EEF9303F68B3FB03CD19AC1C896BE0CA16
```

Verify before installing:
```powershell
Get-FileHash .\BIOME_2.5.0_x64_en-US.msi -Algorithm SHA256
```

---

## Upgrade Notes

No database migrations required. This release is a drop-in upgrade.
