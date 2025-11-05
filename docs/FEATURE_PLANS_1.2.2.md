# BIOME 1.2.2 Feature Plan (Draft)

This document outlines the next set of features to be implemented after 1.2.1 bugfix release.

## 1) Editable Journal Entries

- Backend
  - DB: Add columns to `project_journal_entries` (or equivalent) table:
    - `edited_at` DATETIME NULL
    - `edited_by` TEXT NULL (user name or id if available)
  - Routes:
    - PATCH `/api/projects/:id/journal/:entryId` to edit text; sets `edited_at`, `edited_by`
    - GET returns `edited_at` fields
  - Validation: non-empty text; max length 5000 chars

- Frontend
  - UI: In Project Details > Journal Entries
    - Each entry has an Edit action (uses WizardFormModal)
    - Show small meta: `edited · <relative-time>` when applicable
  - Services: `updateJournalEntry(projectId, entryId, { text })`

- Export
  - Include `edited_at` and `edited_by` in export JSON/CSV

- Acceptance
  - Editing updates in DB; meta shows; activity feed logs edit event

## 2) Project Attachments (Reference subfolder)

- Storage
  - Desktop: Save files under `<project-root>/reference/`
  - Web: Use backend to generate ZIP and return download or store in server project folder (depending on environment)

- Backend
  - Routes:
    - POST `/api/projects/:id/attachments` (multipart): saves file to reference, returns metadata
    - GET `/api/projects/:id/attachments` : list
    - DELETE `/api/projects/:id/attachments/:attachmentId`
  - DB table `project_attachments`:
    - id (uuid)
    - project_id (fk)
    - file_name
    - file_type (mime)
    - file_size
    - created_at
  - README update: append links to attachments under Resources section

- Frontend
  - UI Section below Description:
    - Images (png/jpg): grid preview (lightbox later)
    - Documents (pdf, docx, txt): list with icons
  - Services to upload/list/delete; environment aware via tauri/web APIs

- Export
  - Include attachment metadata in export; files remain on disk in project folder

- Acceptance
  - Uploads work in desktop mode; web mode returns ZIP for download

## 3) Output/Result Type Classification

- Categories (initial set): Counseling, Video Tutorial, Script, Workflow/Protocol, Training
- DB
  - Add column `result_type` TEXT to `projects` (enum-like with validation)
- Backend
  - Accept `result_type` on create/update; filter parameter `?result_type=Script`
- Frontend
  - Project form: dropdown for Result Type (single select for now)
  - Project list: filter chip group (like Status/User/Group)
  - Analytics: add stats card/grouped count by result type

- Export
  - Include `result_type` in project export

## Migrations

- Add SQL migration scripts in `backend/src/database/schema.js` with safe ALTERs
- Bump DB schema version number

## Tracking & Telemetry

- Activity feed: log journal edits, attachments added/removed, result type changes

## Notes

- Follow environment detection pattern via `Environment.isTauri()`
- Reuse WizardFormModal for create/edit flows
