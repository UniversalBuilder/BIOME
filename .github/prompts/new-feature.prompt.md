---
mode: 'agent'
description: 'Start a new BIOME feature with the right context and checklist.'
---

# New BIOME feature

## Context
Read [project instructions](../copilot-instructions.md) before starting.

The feature to implement is: ${input:featureDescription:Describe the feature in one sentence}

## Pre-implementation checklist
Before writing any code, answer these questions and confirm with me:

1. **Scope** – Which layers are affected? (frontend / backend / Tauri / both)
2. **Environment-awareness** – Does the feature touch the filesystem, process launch, or native APIs? If yes, it requires a desktop/web code split using `Environment.isTauri()`.
3. **UI pattern** – Does it need a create / edit / delete flow? If yes, use `WizardFormModal` — do not invent a new modal pattern.
4. **Data** – Does it introduce new fields or tables? If yes, propose the schema change first and wait for approval before touching `schema.js` or `db.js`.
5. **Dual-mode I/O** – If it reads/writes files or calls the backend, route through `filesystemApi.js` or `tauriApi.js`.

## Implementation rules
- Never use deprecated `isTauriApp()` — always `Environment.isTauri()`.
- Maintain the Avatar-inspired palette; reuse existing `hover-soft` utilities.
- Chain PowerShell commands with `;`, not `&&`.
- Do not commit MSI or build artifacts.

## Post-implementation checklist
Before considering the feature done:

- [ ] Update or create `docs/user/<feature>.md`
- [ ] Add entry to `docs/user/index.json` if it's a new top-level section
- [ ] Add changelog entry to `docs/user/changelog.md`
- [ ] Update `CHANGELOG.md` at repo root (technical record)
- [ ] Verify the feature works in both web mode (`npm run start-both`) and desktop mode (`npm run tauri-dev`)
