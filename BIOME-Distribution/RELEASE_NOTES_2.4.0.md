# BIOME v2.4.0 — Release Notes

**Release date:** 2026-03-03  
**Installer:** `BIOME_2.4.0_x64_en-US.msi`

---

## What's New

### Dynamic Metadata Options
Software, Imaging Techniques, Sample Type, and Analysis Goal are no longer hardcoded — they are now stored in the database and fully manageable without touching any configuration file.

- All four metadata fields are seeded with sensible defaults on first launch
- Dropdown menus in **Project Details** (edit mode) and the **New Project wizard** are now populated live from the database
- Options are sorted **A → Z** automatically in every dropdown and in the management UI

### Settings — Metadata Management Card
A new card in **Settings** lets you curate each category independently:

- Tabs for Software, Imaging Techniques, Sample Type, and Analysis Goal
- **Add** a new option via the text field at the bottom (Enter key or "+ Add" button)
- **Edit** any option inline — click the pencil icon that appears on hover
- **Delete** an option — click the × icon; a confirmation dialog appears; deletion is blocked if the option is currently used by one or more projects

Options are displayed as compact **chips** (flex-wrap layout) rather than full-width rows, reducing wasted vertical space.

---

## Improvements

- **Settings page scrollable**: the Settings page is now correctly scrollable within the app window's fixed-height layout
- **Alphabetical ordering**: metadata options are sorted A → Z both at the database query level and client-side, so newly added options always appear in the right position after saving

---

## Bug Fixes

- **Backend startup error**: a pre-existing syntax issue in the journal-entry SQL queries (`strftime` format strings nested inside single-quoted JS strings) caused the Node backend to fail on restart after any code change — now fixed by converting those strings to template literals
- **Metadata-options 404**: the `/api/metadata-options` routes were not registered in the running backend process when the app was already open — resolved; the route is now always available on startup

---

## Database Notes

This release adds a new `metadata_options` table. The migration runs automatically on first launch — no manual steps required. Existing project data is fully preserved.

---

## Upgrade Notes

Install over the previous version. The database migration is non-destructive and runs silently on startup.
