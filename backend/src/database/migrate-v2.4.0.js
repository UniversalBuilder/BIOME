const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const seedMetadataOptions = require('./seed-metadata-options');

/**
 * Migration script to:
 * 1. Remove objective_magnification column from projects table
 * 2. Convert software field from single string to JSON array
 * 3. Seed metadata_options table with predefined values
 */
async function runMigrationv2_4_0(dbPath) {
  console.log('\n=== Starting BIOME v2.4.0 Database Migration ===\n');
  console.log(`Database path: ${dbPath}`);

  if (!fs.existsSync(dbPath)) {
    console.error(`✗ Database file not found: ${dbPath}`);
    return { success: false, error: 'Database file not found' };
  }

  // Create backup
  const backupPath = dbPath.replace('.sqlite', `.backup-${Date.now()}.sqlite`);
  console.log(`Creating backup: ${backupPath}`);
  fs.copyFileSync(dbPath, backupPath);
  console.log('✓ Backup created\n');

  const db = new Database(dbPath);
  
  try {
    // Start transaction
    db.exec('BEGIN TRANSACTION');

    // Step 1: Check if objective_magnification column exists
    console.log('Step 1: Checking for objective_magnification column...');
    const tableInfo = db.prepare('PRAGMA table_info(projects)').all();
    const hasObjectiveMag = tableInfo.some(col => col.name === 'objective_magnification');

    if (hasObjectiveMag) {
      console.log('  → Found objective_magnification column, removing it...');

      // SQLite doesn't support DROP COLUMN directly, so we need to recreate the table
      // Get all columns except objective_magnification
      const columns = tableInfo
        .filter(col => col.name !== 'objective_magnification')
        .map(col => col.name)
        .join(', ');

      // Create new table without objective_magnification
      db.exec(`
        CREATE TABLE projects_new (
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
          analysis_goal TEXT,
          output_type TEXT,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        )
      `);

      // Copy data from old table to new table
      db.exec(`INSERT INTO projects_new (${columns}) SELECT ${columns} FROM projects`);

      // Drop old table and rename new table
      db.exec('DROP TABLE projects');
      db.exec('ALTER TABLE projects_new RENAME TO projects');

      console.log('  ✓ objective_magnification column removed\n');
    } else {
      console.log('  → objective_magnification column not found (already removed)\n');
    }

    // Step 2: Convert software field from single string to JSON array
    console.log('Step 2: Converting software field to JSON array format...');
    
    // Get all projects with non-null software values
    const projects = db.prepare(`
      SELECT id, software FROM projects 
      WHERE software IS NOT NULL AND software != '' AND software NOT LIKE '[%'
    `).all();

    console.log(`  → Found ${projects.length} projects with single-value software field`);

    if (projects.length > 0) {
      const updateStmt = db.prepare(`UPDATE projects SET software = ? WHERE id = ?`);
      
      for (const project of projects) {
        // Convert single string value to JSON array
        const jsonArray = JSON.stringify([project.software]);
        updateStmt.run(jsonArray, project.id);
      }

      console.log(`  ✓ Converted ${projects.length} software fields to JSON array\n`);
    } else {
      console.log('  → No software fields to convert\n');
    }

    // Step 3: Check if metadata_options table exists and seed it
    console.log('Step 3: Seeding metadata_options table...');
    
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='metadata_options'").all();
    
    if (tables.length === 0) {
      console.error('  ✗ metadata_options table does not exist. Run schema update first.');
      throw new Error('metadata_options table not found');
    }

    // Check if table is already seeded
    const count = db.prepare('SELECT COUNT(*) as count FROM metadata_options').get();
    
    if (count.count > 0) {
      console.log(`  → metadata_options already has ${count.count} entries, skipping seed\n`);
    } else {
      // Seed the table
      const metadataOptions = [
        // Software options
        { category: 'software', value: 'CellProfiler', display_order: 1 },
        { category: 'software', value: 'Fiji', display_order: 2 },
        { category: 'software', value: 'Imaris', display_order: 3 },
        { category: 'software', value: 'KNIME', display_order: 4 },
        { category: 'software', value: 'Python', display_order: 5 },
        { category: 'software', value: 'ilastik', display_order: 6 },
        { category: 'software', value: 'QuPath', display_order: 7 },
        { category: 'software', value: 'Other', display_order: 8 },

        // Imaging Techniques options
        { category: 'imaging_techniques', value: 'widefield microscopy', display_order: 1 },
        { category: 'imaging_techniques', value: 'widefield fluorescence microscopy', display_order: 2 },
        { category: 'imaging_techniques', value: 'slide scanning', display_order: 3 },
        { category: 'imaging_techniques', value: 'confocal microscopy', display_order: 4 },
        { category: 'imaging_techniques', value: 'time lapse microscopy', display_order: 5 },
        { category: 'imaging_techniques', value: 'super resolution microscopy', display_order: 6 },
        { category: 'imaging_techniques', value: 'high content screening', display_order: 7 },
        { category: 'imaging_techniques', value: 'other', display_order: 8 },

        // Sample Type options
        { category: 'sample_type', value: 'cells on slides', display_order: 1 },
        { category: 'sample_type', value: 'tissue slices', display_order: 2 },
        { category: 'sample_type', value: 'cells in multiwell plates', display_order: 3 },
        { category: 'sample_type', value: 'whole organ / animal', display_order: 4 },
        { category: 'sample_type', value: 'other', display_order: 5 },

        // Analysis Goal options
        { category: 'analysis_goal', value: 'object counting', display_order: 1 },
        { category: 'analysis_goal', value: 'intensity measurement', display_order: 2 },
        { category: 'analysis_goal', value: '3D reconstruction', display_order: 3 },
        { category: 'analysis_goal', value: 'object classification', display_order: 4 },
        { category: 'analysis_goal', value: 'object morphometry', display_order: 5 },
        { category: 'analysis_goal', value: 'other', display_order: 6 },
      ];

      const insert = db.prepare(`
        INSERT INTO metadata_options (category, value, display_order, is_active)
        VALUES (@category, @value, @display_order, 1)
      `);

      for (const option of metadataOptions) {
        insert.run(option);
      }

      console.log(`  ✓ Seeded ${metadataOptions.length} metadata options\n`);
    }

    // Commit transaction
    db.exec('COMMIT');

    console.log('=== Migration completed successfully! ===\n');
    console.log(`Backup saved at: ${backupPath}\n`);

    return { success: true, backupPath };

  } catch (error) {
    // Rollback on error
    db.exec('ROLLBACK');
    console.error('\n✗ Migration failed:', error.message);
    console.error('Database has been rolled back to original state\n');

    // Restore from backup
    console.log('Restoring from backup...');
    db.close();
    fs.copyFileSync(backupPath, dbPath);
    console.log('✓ Database restored from backup\n');

    return { success: false, error: error.message };

  } finally {
    db.close();
  }
}

// If run directly (not imported)
if (require.main === module) {
  const dbPath = process.argv[2] || path.join(__dirname, '../../data/database.sqlite');
  runMigrationv2_4_0(dbPath)
    .then(result => {
      if (result.success) {
        process.exit(0);
      } else {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = runMigrationv2_4_0;
