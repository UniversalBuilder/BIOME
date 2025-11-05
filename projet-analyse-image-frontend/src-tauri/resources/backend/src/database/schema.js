const schema = [
  `CREATE TABLE IF NOT EXISTS groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`,

  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,  /* Remove UNIQUE constraint to allow multiple null/empty emails */
    group_id INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL
  )`,

  `CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'Preparing',
    software TEXT,
    time_spent_minutes INTEGER DEFAULT 0,
    creation_date TEXT DEFAULT (datetime('now')),
    last_updated TEXT DEFAULT (datetime('now')),
    start_date TEXT,
    project_path TEXT,
    folder_created BOOLEAN DEFAULT 0,
    readme_last_updated TEXT,
    user_id INTEGER,
    image_types TEXT,
    sample_type TEXT,
    objective_magnification TEXT,
    analysis_goal TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  )`,

  `CREATE TABLE IF NOT EXISTS journal_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    entry_text TEXT NOT NULL,
    entry_date TEXT DEFAULT (datetime('now')),
    edited_at TEXT,
    edited_by TEXT,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
  )`,
  
  `CREATE TABLE IF NOT EXISTS project_activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    activity_type TEXT NOT NULL,
    activity_date TEXT DEFAULT (datetime('now')),
    details TEXT,
    changed_fields TEXT,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
  )`
];

module.exports = schema;
