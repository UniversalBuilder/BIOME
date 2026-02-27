# Projects

Projects are the core unit of work in BIOME. Each project represents a bioimage analysis engagement — from initial consultation to final delivery.

---

## Creating a Project

1. Click the **+ New Project** button on the Dashboard or Projects page
2. Work through the wizard steps:
   - **Basic Info** — Name, PI, status, dates
   - **Sample & Imaging** — Sample type, image types, objective magnification
   - **Analysis** — Analysis goal, software tools
   - **Notes** — Free-text description and internal notes
3. Click **Create** to save

Projects are created with status **Preparing** by default.

---

## Project Statuses

| Status | Meaning |
|---|---|
| **Preparing** | Initial setup, waiting for samples or data |
| **Active** | Work is ongoing |
| **In Progress** | Actively being analysed |
| **Review** | Results under review with the PI |
| **On Hold** | Paused, waiting on researcher or resources |
| **Completed** | Fully delivered |
| **Cancelled** | Project was cancelled |
| **Archived** | Closed and archived for record-keeping |

---

## Editing a Project

- Click on a project card to open its detail panel
- Click **Edit Project** to enter edit mode
- Change any field and click **Save**

---

## Project Details View

The project detail panel is divided into two zones:

- **Zone A — Project Metadata**: Information fields (PI, dates, status, sample type, etc.). These are greyed out in view mode — click **Edit Project** to modify.
- **Zone B — Project Workspace**: Folder and file action buttons (open folder, create structure, export). These are always active.

---

## Project Folders (Desktop only)

On the desktop version, each project can be linked to a filesystem folder:

1. Open a project → Zone B
2. Click **Select Project Folder** to pick or create a folder
3. Click **Create Folder Structure** to scaffold standard subdirectories
4. Click **Open in Explorer** to browse the folder directly

In web mode, **Export as ZIP** is available as an alternative.

---

## Filtering & Searching

The Projects page provides:

- **Status filter** — click a status chip to show only matching projects
- **Search bar** — full-text search across project name, PI, and description
- **Table View** — switch to `/table` for a sortable flat list of all projects

---

## Deleting a Project

1. Open the project detail panel
2. Click **Delete Project** (bottom of the form)
3. Confirm in the modal dialog

> ⚠️ Deletion is permanent. The filesystem folder is **not** deleted — only the database record is removed.
