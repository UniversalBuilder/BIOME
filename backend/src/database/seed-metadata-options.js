const Database = require('better-sqlite3');
const path = require('path');

/**
 * Seeds the metadata_options table with predefined values
 * Run this after creating a new database or after schema updates
 */
function seedMetadataOptions(dbPath) {
  const db = new Database(dbPath);

  // Define all metadata options with their categories and display order
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
    INSERT OR IGNORE INTO metadata_options (category, value, display_order, is_active)
    VALUES (@category, @value, @display_order, 1)
  `);

  const insertMany = db.transaction((options) => {
    for (const option of options) insert.run(option);
  });

  try {
    insertMany(metadataOptions);
    console.log(`✓ Seeded ${metadataOptions.length} metadata options`);
    return { success: true, count: metadataOptions.length };
  } catch (error) {
    console.error('✗ Error seeding metadata options:', error.message);
    return { success: false, error: error.message };
  } finally {
    db.close();
  }
}

// If run directly (not imported)
if (require.main === module) {
  const dbPath = process.argv[2] || path.join(__dirname, '../../data/database.sqlite');
  console.log(`Seeding metadata options in: ${dbPath}`);
  seedMetadataOptions(dbPath);
}

module.exports = seedMetadataOptions;
