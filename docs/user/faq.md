# Frequently Asked Questions

---

## General

### What is BIOME?

BIOME (Biological Imaging Operations and Management Environment) is a project management application designed for bioimage analysis facilities. It helps facility managers and researchers track projects, manage researcher relationships, and analyse facility usage over time.

### Is my data stored in the cloud?

**No.** All data is stored locally in a SQLite database file on your machine. BIOME does not send any data to external servers. The only network requests the app makes are to fetch this documentation from GitHub.

### What's the difference between the Desktop and Web versions?

The desktop version (Tauri application) has full filesystem access — it can open project folders, create folder structures, and run automatic backups. The web version runs in a browser and requires a locally running backend server; it has limited filesystem access (ZIP export instead of direct folder operations).

---

## Projects

### Can I recover a deleted project?

Not directly through the UI. However, if you have a backup taken before the deletion, you can restore it from the Database page. Going forward, enabling **Auto Backup** in Settings is recommended.

### Why are the project information fields greyed out?

In view mode, fields in **Zone A (Project Metadata)** are intentionally greyed out to signal that they are read-only. Click **Edit Project** to make them editable.

### The PI dropdown is empty when creating a project — why?

You need to create at least one User in the **Users & Groups** section first. Users populate the PI dropdown in the project creation wizard.

---

## Users & Groups

### Why is the "+ New User" button disabled?

You must select a group in the left panel before adding a user. The button is disabled (greyed out with a tooltip) until a group is selected.

### Can a user belong to multiple groups?

Currently, each user belongs to one group. Multiple group membership is planned for a future version.

---

## Database & Backups

### Where are my backups stored?

On Windows: `%APPDATA%\BIOME\backups\`. You can open this folder from **Settings** → **Open Data Folder**.

### A backup restore replaced my data — can I undo it?

BIOME automatically creates a safety backup of your current database before every restore. Look in the backup list for a file timestamped just before your restore operation.

### Can I open the database with another tool?

Yes. The `.sqlite` file can be opened with [DB Browser for SQLite](https://sqlitebrowser.org/) or any SQLite-compatible tool. The schema is documented in `backend/src/database/schema.js`.

---

## Performance & Appearance

### How do I switch between light and dark mode?

Go to **Settings** → **Appearance** → toggle **Dark Mode**.

### The app feels slow when I have many projects — what can I do?

Use **Table View** (`/table`) for large datasets — it renders rows efficiently. The card-based Projects view is optimised for up to a few hundred projects. If you have thousands of records, the Table View is the recommended primary view.

---

## Desktop Application

### How do I update BIOME?

Download the latest installer from the [GitHub Releases page](https://github.com/UniversalBuilder/BIOME/releases) and run it. Your data is preserved across updates.

### The app launches but nothing loads — what should I do?

Open the debug console with **Ctrl+Shift+D** and check the backend health and API connectivity status. If the bundled backend failed to start, try relaunching the app. If the issue persists, run `./setup-dependencies.ps1 -Clean` and rebuild.
