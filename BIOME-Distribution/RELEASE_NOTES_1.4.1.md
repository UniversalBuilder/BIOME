# BIOME v1.4.1 – Release Notes (2025-11-11)

## Added
- Backend endpoint `/api/app/meta` exposing application version, description, and short changelog summary (web + packaged backend).
- Build-time generator `scripts/generate-app-meta.js` creates `app-meta.json` (bundled for desktop and available in dev) as a stable metadata source.

## Changed
- Dashboard About card now loads dynamic version/release date and displays top recent changes (fallback to current date if missing).
- Theme description wording updated to neutral “bioluminescent forest” (dark) / “primal shores” (light) language.
- Version bumped to 1.4.1 across frontend and backend for metadata consistency.

## Fixed
- Empty version/date display in About card when changelog parsing failed; now falls back gracefully and uses generated metadata.

## Repository
- Updated `repository` and `homepage` URLs in `frontend` and `backend` `package.json` to point to `UniversalBuilder/BIOME` for accurate online metadata.

## Download
- MSI: `BIOME_1.4.1_x64_en-US.msi`
- SHA256: See `.sha256` file in the release assets or compute locally:
  ```powershell
  Get-FileHash .\BIOME_1.4.1_x64_en-US.msi -Algorithm SHA256
  ```
