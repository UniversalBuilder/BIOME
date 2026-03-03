const express = require('express');
const router = express.Router();
const db = require('../database/db');

const VALID_CATEGORIES = ['software', 'imaging_techniques', 'sample_type', 'analysis_goal'];

// GET /api/metadata-options?category=X
router.get('/metadata-options', async (req, res) => {
  const { category } = req.query;
  if (!category) return res.status(400).json({ error: 'Category parameter is required' });
  if (!VALID_CATEGORIES.includes(category)) return res.status(400).json({ error: 'Invalid category' });

  try {
    const options = await db.all(
      `SELECT id, category, value, display_order, is_active, created_at
       FROM metadata_options
       WHERE category = ? AND is_active = 1
       ORDER BY display_order ASC, value ASC`,
      [category]
    );
    res.json(options);
  } catch (error) {
    console.error('Error fetching metadata options:', error);
    res.status(500).json({ error: 'Failed to fetch metadata options' });
  }
});

// GET /api/metadata-options/:id
router.get('/metadata-options/:id', async (req, res) => {
  try {
    const option = await db.get(
      'SELECT id, category, value, display_order, is_active, created_at FROM metadata_options WHERE id = ?',
      [req.params.id]
    );
    if (!option) return res.status(404).json({ error: 'Option not found' });
    res.json(option);
  } catch (error) {
    console.error('Error fetching metadata option:', error);
    res.status(500).json({ error: 'Failed to fetch metadata option' });
  }
});

// POST /api/metadata-options
router.post('/metadata-options', async (req, res) => {
  const { category, value, display_order } = req.body;
  if (!category || !value) return res.status(400).json({ error: 'Category and value are required' });
  if (!VALID_CATEGORIES.includes(category)) return res.status(400).json({ error: 'Invalid category' });

  try {
    // Auto-compute display_order if not provided
    let order = display_order;
    if (order === null || order === undefined) {
      const row = await db.get(
        'SELECT COALESCE(MAX(display_order), -1) + 1 AS next_order FROM metadata_options WHERE category = ?',
        [category]
      );
      order = row ? row.next_order : 0;
    }

    const result = await db.run(
      'INSERT INTO metadata_options (category, value, display_order) VALUES (?, ?, ?)',
      [category, value.trim(), order]
    );

    const created = await db.get('SELECT * FROM metadata_options WHERE id = ?', [result.lastID]);
    res.status(201).json(created);
  } catch (error) {
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'This option already exists in the category' });
    }
    console.error('Error creating metadata option:', error);
    res.status(500).json({ error: 'Failed to create metadata option' });
  }
});

// PUT /api/metadata-options/reorder/:category â€” must come BEFORE /:id
router.put('/metadata-options/reorder/:category', async (req, res) => {
  const { category } = req.params;
  const { orderedIds } = req.body;
  if (!VALID_CATEGORIES.includes(category)) return res.status(400).json({ error: 'Invalid category' });
  if (!Array.isArray(orderedIds)) return res.status(400).json({ error: 'orderedIds must be an array' });

  try {
    for (let i = 0; i < orderedIds.length; i++) {
      await db.run('UPDATE metadata_options SET display_order = ? WHERE id = ? AND category = ?',
        [i, orderedIds[i], category]);
    }
    const updated = await db.all(
      'SELECT * FROM metadata_options WHERE category = ? AND is_active = 1 ORDER BY display_order ASC, value ASC',
      [category]
    );
    res.json(updated);
  } catch (error) {
    console.error('Error reordering metadata options:', error);
    res.status(500).json({ error: 'Failed to reorder metadata options' });
  }
});

// PUT /api/metadata-options/:id
router.put('/metadata-options/:id', async (req, res) => {
  const { value, display_order, is_active } = req.body;
  const { id } = req.params;

  try {
    const existing = await db.get('SELECT * FROM metadata_options WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Option not found' });

    const newValue       = value         !== undefined ? value.trim()    : existing.value;
    const newOrder       = display_order !== undefined ? display_order   : existing.display_order;
    const newActive      = is_active     !== undefined ? is_active       : existing.is_active;

    await db.run(
      'UPDATE metadata_options SET value = ?, display_order = ?, is_active = ? WHERE id = ?',
      [newValue, newOrder, newActive, id]
    );
    const updated = await db.get('SELECT * FROM metadata_options WHERE id = ?', [id]);
    res.json(updated);
  } catch (error) {
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'This option already exists in the category' });
    }
    console.error('Error updating metadata option:', error);
    res.status(500).json({ error: 'Failed to update metadata option' });
  }
});

// DELETE /api/metadata-options/:id
router.delete('/metadata-options/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const option = await db.get('SELECT * FROM metadata_options WHERE id = ?', [id]);
    if (!option) return res.status(404).json({ error: 'Option not found' });

    // Map category key to JSON field name in projects table
    const fieldMap = {
      software:           'software',
      imaging_techniques: 'image_types',
      sample_type:        'sample_type',
      analysis_goal:      'analysis_goal',
    };
    const field = fieldMap[option.category];
    const escapedValue = option.value.replace(/'/g, "''");

    const usageRow = field
      ? await db.get(
          `SELECT COUNT(*) as count FROM projects WHERE ${field} LIKE '%"${escapedValue}"%'`
        )
      : { count: 0 };

    const usageCount = usageRow ? usageRow.count : 0;
    if (usageCount > 0) {
      return res.status(409).json({
        error: `Cannot delete: option is used in ${usageCount} project(s)`,
        usageCount
      });
    }

    await db.run('DELETE FROM metadata_options WHERE id = ?', [id]);
    res.json({ message: 'Option deleted successfully' });
  } catch (error) {
    console.error('Error deleting metadata option:', error);
    res.status(500).json({ error: 'Failed to delete metadata option' });
  }
});

module.exports = router;
