# BIOME v2.1.0 — Release Notes
**Date:** 2026-02-26

## What's New

### Auto-Backup System
BIOME now protects your database automatically. A new backup scheduler reads your auto-backup settings (Settings page) and creates a timestamped SQLite snapshot when the configured interval (daily or weekly) has elapsed since the last backup.

You can also trigger a manual backup at any time from the **Database** page → **Automatic Backups** section → **Create Backup Now**. Each backup appears in the list with its filename, creation date, and size. You can restore any backup with one click.

### ProjectDetails Page — Visual Zone Separation
The project detail panel now clearly distinguishes two zones:
- **Project Metadata** (gray fill) — read-only in view mode; requires Edit Project to modify
- **Project Workspace** (bioluminescent tint) — always interactive; add resources and journal entries without entering edit mode

Fields in the metadata zone are dimmed when not in edit mode, making it immediately clear which areas respond to direct interaction.

## Bug Fixes
- Project wizard: `image_types`, `analysis_goal`, `sample_type`, `objective_magnification` were silently dropped when creating a new project — now correctly saved
- Default project status changed from `Intake` to `Preparing` on creation
- All `window.confirm()` dialogs replaced with styled modals (required for Tauri desktop compatibility)
- Backup directory now always placed next to the database file, regardless of backend launch working directory

## Installation
Download `BIOME_2.1.0_x64_en-US.msi` and run it on Windows x64. Previous versions are automatically upgraded.

**SHA256:** `FA2EB1976099BD1077C4CE7A6B929D25EFDCAEB4BF5DE66E6CE8AE7F19A88E1B`
