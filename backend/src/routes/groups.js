const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Get all groups
router.get('/', async (req, res) => {
    try {
        const rows = await db.all('SELECT * FROM groups ORDER BY name');
        res.json(rows || []);
    } catch (err) {
        console.error('Error getting groups:', err);
        res.status(500).json({ error: err.message });
    }
});

// Create new group
router.post('/', async (req, res) => {
    const { name, description } = req.body;
    
    if (!name) {
        return res.status(400).json({ error: 'Group name is required' });
    }

    try {
        const result = await db.run(
            'INSERT INTO groups (name, description) VALUES (?, ?)',
            [name, description || null]
        );
        
        const group = await db.get('SELECT * FROM groups WHERE id = ?', [result.lastID]);
        res.json(group);
    } catch (err) {
        console.error('Error creating group:', err);
        if (err.message.includes('UNIQUE constraint failed')) {
            res.status(400).json({ error: 'A group with this name already exists' });
        } else {
            res.status(500).json({ error: err.message });
        }
    }
});

// Update group
router.put('/:id', async (req, res) => {
    const { name, description } = req.body;
    const { id } = req.params;

    if (!name) {
        return res.status(400).json({ error: 'Group name is required' });
    }

    try {
        await db.run(
            'UPDATE groups SET name = ?, description = ? WHERE id = ?',
            [name, description, id]
        );
        const group = await db.get('SELECT * FROM groups WHERE id = ?', [id]);
        if (!group) {
            return res.status(404).json({ error: 'Group not found' });
        }
        res.json(group);
    } catch (err) {
        console.error('Error updating group:', err);
        res.status(500).json({ error: err.message });
    }
});

// Delete group
router.delete('/:id', async (req, res) => {
    try {
        const result = await db.run('DELETE FROM groups WHERE id = ?', [req.params.id]);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Group not found' });
        }
        res.json({ message: 'Group deleted successfully' });
    } catch (err) {
        console.error('Error deleting group:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get users in group
router.get('/:id/users', async (req, res) => {
    try {
        const users = await db.all('SELECT * FROM users WHERE group_id = ?', [req.params.id]);
        res.json(users || []);
    } catch (err) {
        console.error('Error getting group users:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;