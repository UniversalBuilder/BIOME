# Database Management

The Database page provides tools for backing up, restoring, and managing your BIOME data.

---

## Backup

### Manual Backup

1. Go to **Database**
2. In the **Automatic Backups** section, click **Create Backup Now**
3. A timestamped `.sqlite` file is created in the `backups/` folder inside your app data directory

### Automatic Backup (Desktop only)

Configure auto-backup in **Settings** → **Data Management**:

- **Enable Auto Backup** — toggle on to activate scheduled backups
- **Frequency** — choose Daily or Weekly

Backups run automatically on app start when the configured interval has elapsed. A toast notification confirms successful backup creation.

---

## Restore from Backup

1. Go to **Database** → backup list
2. Find the backup you want to restore
3. Click **Restore** next to it
4. Confirm the action in the modal

> ⚠️ Restoring replaces your current database completely. A safety backup of the current database is created automatically before any restore.

---

## Backup Storage Location

On desktop, backups are stored in your OS application data directory under `backups/`:

| OS | Path |
|---|---|
| Windows | `%APPDATA%\BIOME\backups\` |
| macOS | `~/Library/Application Support/BIOME/backups/` |
| Linux | `~/.local/share/BIOME/backups/` |

You can open this folder directly from **Settings** → **Open Data Folder**.

---

## Reset Database

The **Reset Database** button in the Database page wipes all data and leaves the database completely empty (no demo data is re-seeded). Use this to start over completely.

> ⚠️ This action is irreversible. A backup is strongly recommended before resetting.

---

## Loading Demo Data

For evaluation or training purposes, you can populate BIOME with realistic sample data:

1. Go to **Database**
2. Click **Load Demo Data**
3. Confirm the action

This loads 10 sample projects, 6 researchers across 3 imaging core groups, and ~20 journal entries. If real data already exists, a safety backup is created first.

---

## Database File Format

BIOME uses a single **SQLite** file as its database. This makes it easy to:

- Copy and share between machines
- Open with any SQLite viewer (e.g., DB Browser for SQLite) for inspection
- Version control specific snapshots alongside your research data
