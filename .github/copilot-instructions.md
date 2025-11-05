
## BIOME – AI Agent Guidelines (concise)

- Architecture (big picture)
	- Frontend: React 18 + Tailwind (`projet-analyse-image-frontend/src/`)
	- Backend: Node/Express + SQLite (`backend/src`, DB at `backend/data/database.sqlite`)
	- Desktop: Tauri v2 bundles the same React app with Rust commands and a bundled Node backend (`src-tauri/resources/backend/`)
	- Design choice: Single codebase runs in web or desktop; services auto-route based on environment detection.

- Environment detection (critical)
	- Always use: `import Environment from '../utils/environmentDetection'; const isDesktop = Environment.isTauri();`
	- Never use deprecated `isTauriApp()` in `tauriApi.js`.
	- Pattern: feature-gate code paths (filesystem, process launch) by `isDesktop`.

- Dual‑mode I/O pattern
	- Use `src/services/filesystemApi.js` and `src/services/tauriApi.js` which pick Desktop (Rust/Tauri) vs Web (Express) automatically.
	- Example: `createProjectStructure()` performs real FS ops on desktop; returns a downloadable ZIP via backend in web mode.

- UI conventions
	- Central modal: `WizardFormModal` for create/edit/delete confirmations (apply across features for consistency).
	- Project details: multi‑select fields stored as JSON arrays in SQLite but shown as comma‑separated strings.
	- Subtle meta line replaces noisy status when empty: “Last updated • Created”.

- Key files to reference
	- Frontend: `src/components/`, `src/pages/`, `src/services/`, `src/utils/environmentDetection.js`
	- Backend: `backend/src/routes/`, `backend/src/database/schema.js`, `backend/src/server.js`
	- Desktop: `src-tauri/src/main.rs`, `src-tauri/tauri.conf.json`, resources under `src-tauri/resources/backend/`

- Build, run, and debug (Windows PowerShell)
	- First‑time setup: `./setup-dependencies.ps1` (root) – installs all deps; repo excludes node_modules.
	- Web dev: `cd projet-analyse-image-frontend ; npm run start-both` (frontend:3000 + backend:5000/3001)
	- Desktop dev: `cd projet-analyse-image-frontend ; npm run tauri-dev` (bundled backend, hot reload)
	- Production MSI: `cd projet-analyse-image-frontend ; npm run build-with-deps` (outputs to `BIOME-Distribution/`)
	- Use `;` to chain PowerShell commands; prefer PS style over `&&`.

- Distribution & history hygiene
	- Do not commit MSI or build artifacts. Publish binaries via GitHub Releases (repo history was reset to stay lean).
	- See `SOLO_RELEASE_CHECKLIST.md` and `CHANGELOG.md` for release flow; tag as `vX.Y.Z`, attach MSI, include checksum.

- Example snippets
	- Env check:
		```js
		import Environment from '../utils/environmentDetection';
		const isDesktop = Environment.isTauri();
		```
	- MSI checksum:
		```powershell
		Get-FileHash .\BIOME_1.2.0_x64_en-US.msi -Algorithm SHA256
		```

- Troubleshooting quick wins
	- Desktop debug console: Ctrl+Shift+D (check backend health, API connectivity, logs)
	- If builds fail or deps drift: `./setup-dependencies.ps1 -Clean` then rebuild.

- Style & theme notes
	- Maintain the Avatar‑inspired palette and consistent hover/Focus (`hover-soft`) utilities; follow existing component patterns.

Keep changes environment‑aware, reuse the modal pattern, and update the changelog when altering user‑visible behavior.