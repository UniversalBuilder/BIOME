# Getting Started with BIOME

BIOME (Biological Imaging Operations and Management Environment) is a project management tool designed for bioimage analysis facilities and research teams.

---

## Installation

### Desktop Application (Recommended)

The desktop version provides full filesystem access, offline capability, and native integrations.

1. Download the latest `.msi` installer from the [GitHub Releases page](https://github.com/UniversalBuilder/BIOME/releases)
2. Run the installer and follow the prompts
3. Launch BIOME from your Start Menu or Desktop shortcut

### Web Application

BIOME can also run in a browser, connected to a local backend server.

1. Clone or download the repository
2. Run `./setup-dependencies.ps1` in PowerShell to install all dependencies
3. Run `cd projet-analyse-image-frontend ; npm run start-both`
4. Open [http://localhost:3000](http://localhost:3000) in your browser

---

## First Launch

When you first open BIOME, the database will be **empty** — this is by design so your real data is never overwritten.

You have two options:

- **Start fresh** — head to the [Projects](#) page and create your first project
- **Load demo data** — go to **Database** → **Load Demo Data** to populate the app with example projects and researchers, so you can explore all features before adding real data

---

## Application Modes

| Feature | Desktop | Web |
|---|---|---|
| Full filesystem access | ✅ | ❌ |
| Offline operation | ✅ | ❌ |
| Auto-backup | ✅ | ❌ |
| Project folder integration | ✅ | ❌ (ZIP download) |
| All data management | ✅ | ✅ |

You can always check your current mode in **Settings** → **Environment Information**.

---

## Quick Orientation

| Section | Purpose |
|---|---|
| **Dashboard** | Overview of recent activity, project stats, and quick actions |
| **Projects** | Create, browse, and manage bioimage analysis projects |
| **Users & Groups** | Manage researchers and imaging core group memberships |
| **Table View** | Flat, sortable table of all projects |
| **Analytics** | Charts and statistics across your project portfolio |
| **Database** | Backup/restore, raw data access, demo data loading |
| **Settings** | Appearance, data paths, and auto-backup configuration |

---

## Next Steps

- [Create your first project](projects.md)
- [Add researchers and groups](users-and-groups.md)
- [Explore analytics](analytics.md)
