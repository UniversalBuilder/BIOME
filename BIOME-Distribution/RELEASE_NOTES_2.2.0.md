# BIOME v2.2.0 — Release Notes
**Date:** 2026-02-26

## What's New

### Demo Data Mode
A new **"Load Demo Data"** button appears in the **Database** page alongside Export, Import, and Reset. One click populates the database with a realistic set of bioimage analysis content:

- 3 imaging core groups (Confocal Microscopy Core, Widefield Imaging Center, Digital Pathology Unit)
- 6 researchers with group assignments
- 10 bioimage analysis projects spanning confocal, widefield, and digital pathology workflows
- ~20 journal entries covering project progress notes

**Safety first**: if the database already contains data when you click Load Demo Data, a timestamped backup is created automatically before any data is replaced. The backup filename is shown in the success message so you can restore it at any time from the Automatic Backups section.

### Empty Database on First Launch
BIOME now starts with a completely empty database on first install and after a Reset. Demo content is entirely opt-in. This ensures that:
- MSI distributions ship clean with no sample data mixed into production use
- Reset is a true "start from scratch" operation
- Screenshots for documentation can be taken with controlled, consistent data

---

## Bug Fixes

### Backup Date Display
All backups in the list were showing the same "Created" date (the filesystem modification time, which Windows sets identically for all files copied in the same operation). Dates are now parsed directly from the filename (`database-YYYY-MM-DD_HH-MM-SS.sqlite`), showing the correct individual creation timestamp for each entry.

### Delete Project Modal — Positioning
The "Delete Project" confirmation dialog was appearing at the document scroll position rather than in the center of the visible screen. It now uses a **React Portal** (rendered directly into `document.body`) so it always appears centered in the viewport regardless of scroll position or any CSS transform on parent elements.

The dialog also now uses the new **danger variant**: red button, warning triangle icon in the title, and a red bordered detail block listing what will be deleted.

### All Modals — Viewport Centering (React Portal)
`WizardFormModal` has been refactored to use `ReactDOM.createPortal` with `z-[9999]`. All confirmation modals throughout the app (Import, Restore, Demo Data, Delete Project) now reliably render at true viewport center.

---

## UI Improvements

### Project Creation Wizard
- Background changed from a heavy blue gradient (`from-sky-50 via-blue-50 to-cyan-100 / dark:via-blue-900 dark:to-cyan-900`) to a neutral `bg-gray-50 dark:bg-night-900`, consistent with the rest of the app.
- Main content card now uses the standard card style (`bg-white dark:bg-night-800`, `border`, `shadow-sm`) instead of a frosted-glass effect.

### + New Group / + New User Buttons
Both buttons now share the same **bioluminescent accent** style (matching the app's primary interactive color). Previously, "+ New Group" used blue and "+ New User" used green — the mismatch has been resolved.

When no group is selected, the "+ New User" button is visibly disabled (`opacity-60`, `cursor-not-allowed`) and shows a **tooltip** "Select a group first" on hover.

---

## Installation
Download `BIOME_2.2.0_x64_en-US.msi` and run it on Windows x64. Previous versions are automatically upgraded — your existing database is preserved.

**SHA256:** `6C77AC390A11197597B4352338432BE7F91ECCE166ED9BE529B2DBD9AEA596E6`
