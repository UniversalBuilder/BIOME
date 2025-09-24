# BIOME Frontend

Bio Imaging Organization and Management Environment — React 18 + TailwindCSS frontend. This app runs in both web and desktop modes (Tauri).

## Quick Start

- Web dev (frontend only):
	- From repo root: `npm run start-both` (starts backend and frontend)
- Desktop dev (Tauri):
	- From `projet-analyse-image-frontend`: `npm run tauri-dev`
- Production MSI build:
	- From `projet-analyse-image-frontend`: `npm run simple-msi`

If it's your first time or dependencies changed, run at repo root:

- `./setup-dependencies.ps1` (or `npm run setup-deps` from `projet-analyse-image-frontend`)

## Notable UI Updates (v1.2.0)

- Unified modal style via `WizardFormModal.jsx`:
	- Used in Project Creation Wizard, Users & Groups (add/edit), and all delete confirmations
	- Props: `isOpen, title, inlineError, onClose, onSubmit, submitLabel, loading, disabled`
- Hover consistency with `.hover-soft` utility:
	- Applied to dashboard quick actions, lists, and interactive rows
	- Light and dark mode friendly
- Dashboard polish:
	- Quick Start shows last three projects with visible hover feedback
	- Stats row assigns explicit grid areas so the Completion Rate card fills the row without gaps

## Scripts

In `projet-analyse-image-frontend` directory:

- `npm start` — Frontend dev server
- `npm run start-both` — Frontend + backend
- `npm run tauri-dev` — Desktop dev with hot reload
- `npm run build` — Production web build
- `npm run simple-msi` — Quick MSI build using Tauri
- `npm run setup-deps` — Run root dependency setup script

## Environment Detection

Always use `Environment.isTauri()` from `src/utils/environmentDetection.js` when branching for desktop vs web. The filesystem API automatically routes to Tauri or backend.

## Notes

- ESLint warnings may mention exhaustive-deps; follow the code comments if behavior is intentional.
- If Tailwind safelist warns about status classes, it’s safe to ignore; statuses are provided dynamically at runtime.
