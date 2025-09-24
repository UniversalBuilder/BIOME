const express = require('express');
const router = express.Router();
const db = require('../database/db');
const schema = require('../database/schema');

// Import individual route modules
const projectsRouter = require('./projects');
const groupsRouter = require('./groups');
const usersRouter = require('./users');

// Use route modules
router.use('/projects', projectsRouter);
router.use('/groups', groupsRouter);
router.use('/users', usersRouter);

// Get all groups
router.get('/groups', async (req, res) => {
    try {
        const groups = await db.all('SELECT * FROM groups ORDER BY name');
        console.log('Groups fetched:', groups); // Debug log
        res.json(groups);
    } catch (error) {
        console.error('Error fetching groups:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get users by group
router.get('/users/group/:groupId', async (req, res) => {
    try {
        const users = await db.all(
            'SELECT * FROM users WHERE group_id = ?',
            [req.params.groupId]
        );
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create project
router.post('/', async (req, res) => {
    const { name, description, status, start_date, user_id, group_id, time_spent_minutes = 0 } = req.body;
    
    try {
        const result = await db.run(
            `INSERT INTO projects (
                name, description, status, start_date, 
                user_id, time_spent_minutes
            ) VALUES (?, ?, ?, ?, ?, ?)`,

            [name, description, status || 'Preparing', start_date, user_id, time_spent_minutes]
        );
        
        // Get the created project with user and group info
        const project = await db.get(`
            SELECT 
                p.*,
                u.name as user_name,
                g.name as group_name,
                (SELECT COUNT(*) FROM journal_entries WHERE project_id = p.id) as journal_count
            FROM projects p
            LEFT JOIN users u ON p.user_id = u.id
            LEFT JOIN groups g ON u.group_id = g.id
            WHERE p.id = ?
        `, [result.lastID]);

        res.json(project);
    } catch (err) {
        console.error('Error creating project:', err);
        res.status(500).json({ error: err.message });
    }
});

// Database management routes
router.post('/database/reset', async (req, res) => {
    try {
        // Drop project_activities table if it exists (to fix any schema issues)
        await db.run(`DROP TABLE IF EXISTS project_activities`);
        
        // Apply schema to ensure all tables are created properly
        for (const statement of schema) {
            await db.run(statement);
        }
        
        console.log('Database schema has been reset');
        
        // Return success
        res.json({ success: true, message: 'Database schema has been reset' });
    } catch (error) {
        console.error('Error resetting database schema:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/database/info', (req, res) => {
    db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        res.json({ tables: tables.map(t => t.name) });
    });
});

module.exports = router;
