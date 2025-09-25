# Solo Release Workflow & Checklist

Practical end‑to‑end guide for maintaining, versioning, building, and publishing BIOME as a **solo maintainer** while keeping the repository lightweight and fast.

---

## 🔁 TL;DR (Copy/Paste Flow)
```powershell
# 1. Ensure working tree clean & on main
git switch main ; git pull --ff-only

# 2. Pick new version
$version = '1.3.0'   # example

# 3. Bump versions (see list below) then stage & commit
git add . ; git commit -m "chore(release): bump to v$version"

# 4. Build installer (installs deps automatically)
cd projet-analyse-image-frontend ; npm run build-with-deps ; cd ..

# 5. Tag & push
git tag v$version ; git push ; git push origin v$version

# 6. Create GitHub Release (attach MSI from BIOME-Distribution)
#    Use CHANGELOG entry body. Optionally include checksum.

# 7. Update CHANGELOG for next cycle (add Unreleased placeholder if desired)
```

---

## 🧭 Purpose
Provide a **repeatable**, **minimal-friction** process that:
1. Keeps Git history small (no large binaries committed)
2. Produces a signed-off MSI installer for users
3. Ensures version consistency across multiple files
4. Documents changes transparently (CHANGELOG + Release Notes)

---

## 🧩 Version Bump Targets (Search & Update)
Update all occurrences to the new version BEFORE tagging:

| Area | File / Location | Notes |
|------|-----------------|-------|
| Frontend NPM | `package.json` (root + frontend + backend if separate) | "version" field |
| Backend NPM | `backend/package.json` | Keep aligned |
| Rust / Tauri | `projet-analyse-image-frontend/src-tauri/tauri.conf.json` | `package.version` |
| Rust crate (if present) | `projet-analyse-image-frontend/src-tauri/Cargo.toml` | `version` |
| UI Display | About panel / constants (e.g., version badge) | Ensure visible to user |
| README | Version badge & any explicit version strings | Badge syntax: `version-x.y.z` |
| CHANGELOG | Add new section `## [x.y.z] - YYYY-MM-DD` | Describe Added / Changed / Fixed / Removed / Internal |

Tip: Do version edits first; stage them; THEN build so the MSI contains the correct version.

---

## 🏗️ Build Options

| Script | Command | When to Use | Notes |
|--------|---------|-------------|-------|
| Full setup + build | `npm run build-with-deps` | Normal release | Installs missing deps first |
| Quick MSI (existing deps) | `npm run simple-msi` | Iterative test builds | Assumes deps already installed |
| Desktop dev (hot reload) | `npm run tauri-dev` | Manual testing prior to release | Fast iteration |

Outputs: MSI placed under `BIOME-Distribution/` named `BIOME_<version>_x64_en-US.msi`.

---

## ✅ Pre-Tag Checklist
Tick mentally (or literally) before tagging:
- [ ] CHANGELOG updated (new section + accurate classifications)
- [ ] Version numbers synced across all targets
- [ ] Build completed without errors (MSI present)
- [ ] App launches (desktop) & demo data loads
- [ ] No debug/test artifacts accidentally added
- [ ] Working tree clean (`git status` shows nothing to commit)

---

## 🏷️ Tag & Release
```powershell
$version = '1.3.0'
git commit --allow-empty -m "chore(release): prepare v$version"  # (optional if need a final anchor)
git tag v$version
git push
git push origin v$version
```

Then create a **GitHub Release**:
1. Title: `BIOME v$version`
2. Body: Paste CHANGELOG section for that version
3. Attach MSI file from `BIOME-Distribution/`
4. (Optional) Add SHA256 checksum output

---

## 🔐 Integrity (Checksum)
```powershell
Get-FileHash .\BIOME_$version`_x64_en-US.msi -Algorithm SHA256
```
Include output in Release Notes (ensures users can validate integrity).

---

## 🧼 Keeping the Repo Lightweight
Do:
- Keep only **source code**, scripts, configs, docs
- Distribute binaries **only** via GitHub Releases (NOT committed)
- Add new large generated paths to `.gitignore` immediately

Avoid:
- Committing `node_modules/` or build output
- Adding MSI, archives, or heavy assets to history
- Rebasing/tag rewriting post-release (breaks integrity expectations)

If a large file slips in:
1. Remove file & commit
2. If already pushed and problematic: consider orphan branch reset again (as used for 1.2.0) before project grows further.

---

## 🧪 Verification Snapshot (Post-Tag)
```powershell
git fetch --tags
git show v$version --name-only --oneline
Get-ChildItem BIOME-Distribution -Filter *$version*.msi
```

---

## 🛠️ Helper Scripts
| Script | Purpose | Notes |
|--------|---------|-------|
| `scripts/publish-github-release.ps1` | Automates release creation + asset upload | Requires `GITHUB_TOKEN` env var |
| `scripts/set-default-branch.ps1` | Set repository default branch | One-time / rare use |

Example (PowerShell):
```powershell
$env:GITHUB_TOKEN = 'ghp_xxx'   # ephemeral token
./scripts/publish-github-release.ps1 -Repo "UniversalBuilder/BIOME" -Tag "v$version" -AssetPath "BIOME-Distribution/BIOME_${version}_x64_en-US.msi"
```

---

## 🚨 Troubleshooting Fast Map
| Symptom | Quick Action |
|---------|--------------|
| Build fails on missing deps | Run `./setup-dependencies.ps1 -Clean` |
| MSI missing after build | Re-run `npm run build-with-deps` and check logs |
| Version mismatch in UI | Rebuild after confirming About/version constant updated |
| Tag push rejected | `git pull --ff-only` then re-tag if local behind |
| Release asset upload fails | Verify token scopes: `repo` + correct file path |

---

## 🔄 After Releasing
Optional (but recommended):
- Create an issue / roadmap note for next version
- Start a `## [Unreleased]` section at top of CHANGELOG
- Capture any manual steps you wish to automate next time

---

## 🧪 Minimal Smoke Test (Desktop)
1. Launch installed app
2. Open 2–3 demo projects
3. Create a new project (ensure folder structure creation works)
4. Delete a project (confirm unified modal appears)
5. Close + relaunch (state & demo content persists)

---

## 📝 Release Notes Template Snippet
```
## [x.y.z] - YYYY-MM-DD
### Added
- ...
### Changed
- ...
### Fixed
- ...
### Removed
- ...
### Internal
- ...

Checksum (SHA256): <paste>
```

---

## 💡 Future Automation Ideas
- Script: auto-bump versions + update CHANGELOG date placeholder
- GitHub Action: On tag → build MSI → upload to Release draft
- Checksum generation integrated into publish script

---

## ✅ One-Page Final Checklist
1. Update CHANGELOG entry
2. Bump versions everywhere
3. Build MSI (`npm run build-with-deps`)
4. Test launch & demo data
5. Commit + tag + push
6. Create Release (attach MSI + checksum)
7. Start next cycle (Unreleased section)

---

Happy releasing! Keep it lean, predictable, and verifiable.
