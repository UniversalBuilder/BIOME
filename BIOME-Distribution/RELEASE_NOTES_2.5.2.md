# BIOME v2.5.2 — Release Notes

**Release date:** 2026-03-06  
**Type:** Patch — desktop bug fixes  
**Installer:** `BIOME_2.5.2_x64_en-US.msi`  
**SHA256:** `94968560CAF38538281FF764DCBD39B117AA5E4E9C4C0A4D1CBF8C04B9BF91AE`

---

## What's Fixed

Both issues affected the **installed desktop app (MSI) only**. The web / `tauri-dev` versions were unaffected because API calls are proxied differently in those environments.

### Metadata dropdowns empty in Edit / New Project

All dropdown fields (Output / Result Type, Sample Type, Imaging Techniques, Analysis Goal, Software) showed no options after installing the MSI, even though the same options appeared correctly in the dev build.

**Root cause:** `helmet()` was added to the Express backend in v2.5.0. By default, helmet sets the `Cross-Origin-Resource-Policy: same-origin` response header. In the Tauri desktop app, the WebView frontend is served from a different origin than the backend (`http://localhost:3001`). The browser (WebView2) enforced CORP and discarded the API responses — even though `cors()` was also present.

In dev/web mode, the webpack dev server proxies API calls, so the actual HTTP request originates server-side (no CORP check). In the MSI, the WebView fetches the backend directly — hence the mismatch.

**Fix:** `helmet()` is now called with `crossOriginResourcePolicy: { policy: 'cross-origin' }`, which explicitly allows cross-origin reads of the API responses. `cors()` continues to handle the CORS headers as before.

### Help & Documentation page failed to load

The Help page showed "Could not load documentation — Failed to fetch" immediately on the desktop app. The same page loaded correctly on the web version.

**Root cause:** The Tauri WebView's Content Security Policy (`connect-src`) did not include `https://raw.githubusercontent.com`. The BIOME help system fetches documentation at runtime from the GitHub repository; that fetch was silently blocked by the CSP.

**Fix:** `https://raw.githubusercontent.com` added to the `connect-src` directive in `tauri.conf.json`.

---

## Installation

1. Download `BIOME_2.5.2_x64_en-US.msi`
2. Right-click → **Run as administrator**
3. Follow the installation wizard

> **Upgrading from v2.5.0 or v2.5.1**: uninstall the previous version via **Control Panel → Programs**, then install v2.5.2. Your database and project data are preserved.

### Verify integrity (optional)

```powershell
Get-FileHash .\BIOME_2.5.2_x64_en-US.msi -Algorithm SHA256
# Expected: 94968560CAF38538281FF764DCBD39B117AA5E4E9C4C0A4D1CBF8C04B9BF91AE
```

### Windows Security Warning

BIOME is not yet code-signed. See the [Installation Guide](https://github.com/UniversalBuilder/BIOME#️-windows-security-warning) for SmartScreen and Smart App Control bypass instructions.

---

## Full Changelog

See [CHANGELOG.md](https://github.com/UniversalBuilder/BIOME/blob/main/CHANGELOG.md) for the complete history.
