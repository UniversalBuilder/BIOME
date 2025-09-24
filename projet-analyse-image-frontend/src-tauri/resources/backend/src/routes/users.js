const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Get all users
router.get('/', async (req, res) => {
    try {
        const sql = `
            SELECT u.*, g.name as group_name 
            FROM users u 
            LEFT JOIN groups g ON u.group_id = g.id
            ORDER BY u.name`;
        const rows = await db.all(sql);
        res.json(rows || []);
    } catch (err) {
        console.error('Error getting users:', err);
        res.status(500).json({ error: err.message });
    }
});

// Create new user
router.post('/', async (req, res) => {
    const { name, email, group_id } = req.body;
    
    if (!name) {
        return res.status(400).json({ error: 'User name is required' });
    }

    try {
        const result = await db.run(
            'INSERT INTO users (name, email, group_id) VALUES (?, ?, ?)',
            [name, email || null, group_id || null]
        );
        
        const user = await db.get(
            `SELECT u.*, g.name as group_name 
             FROM users u 
             LEFT JOIN groups g ON u.group_id = g.id 
             WHERE u.id = ?`, 
            [result.lastID]
        );
        res.json(user);
    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).json({ error: err.message });
    }
});

// Update user
router.put('/:id', async (req, res) => {
    const { name, email, group_id } = req.body;
    const { id } = req.params;

    if (!name) {
        return res.status(400).json({ error: 'User name is required' });
    }

    try {
        await db.run(
            'UPDATE users SET name = ?, email = ?, group_id = ? WHERE id = ?',
            [name, email, group_id, id]
        );
        const user = await db.get(
            `SELECT u.*, g.name as group_name 
             FROM users u 
             LEFT JOIN groups g ON u.group_id = g.id 
             WHERE u.id = ?`, 
            [id]
        );
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error('Error updating user:', err);
        res.status(500).json({ error: err.message });
    }
});

// Delete user
router.delete('/:id', async (req, res) => {
    try {
        const result = await db.run('DELETE FROM users WHERE id = ?', [req.params.id]);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get users by group ID
router.get('/group/:id', async (req, res) => {
    try {
        const sql = `
            SELECT u.*, g.name as group_name 
            FROM users u 
            LEFT JOIN groups g ON u.group_id = g.id
            WHERE u.group_id = ?
            ORDER BY u.name`;
        const users = await db.all(sql, [req.params.id]);
        res.json(users || []);
    } catch (err) {
        console.error('Error getting group users:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get projects for user
router.get('/:id/projects', async (req, res) => {
    try {
        const sql = `
            SELECT p.* 
            FROM projects p 
            WHERE p.user_id = ?`;
        const projects = await db.all(sql, [req.params.id]);
        res.json(projects || []);
    } catch (err) {
        console.error('Error getting user projects:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;