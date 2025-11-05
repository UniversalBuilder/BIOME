const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Add a helper function to record project activity
const recordProjectActivity = async (projectId, activityType, details, changedFields = null) => {
  try {
    console.log(`Recording activity: ${activityType} for project ${projectId} - ${details}`);
    const result = await db.run(
      `INSERT INTO project_activities 
       (project_id, activity_type, details, changed_fields) 
       VALUES (?, ?, ?, ?)`,
      [projectId, activityType, details, changedFields ? JSON.stringify(changedFields) : null]
    );
    console.log(`Activity recorded successfully with ID: ${result.lastID}`);
    return result;
  } catch (error) {
    console.error('Error recording project activity:', error);
    return null;
  }
};

// Get all projects
router.get('/', async (req, res) => {
    try {
        const sql = `
            SELECT 
                p.*,
                u.name as user_name,
                g.name as group_name
            FROM projects p
            LEFT JOIN users u ON p.user_id = u.id
            LEFT JOIN groups g ON u.group_id = g.id
            ORDER BY p.last_updated DESC, p.creation_date DESC
        `;
        const rows = await db.all(sql);
        res.json(rows || []);
    } catch (err) {
        console.error('Error getting projects:', err);
        res.status(500).json({ error: err.message });
    }
});

// IMPORTANT: Place this BEFORE any /:id routes to avoid route conflicts
// Get all project activities
router.get('/activities', async (req, res) => {
    try {
        // Check if table exists first to avoid errors on first run
        const tableExists = await db.get(`
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='project_activities'
        `);
        
        if (!tableExists) {
            console.log('project_activities table does not exist yet');
            return res.json([]);
        }
        
        console.log('Fetching all project activities...');
        const sql = `
            SELECT 
                a.*,
                p.name as project_name
            FROM project_activities a
            JOIN projects p ON a.project_id = p.id
            ORDER BY a.activity_date DESC
            LIMIT 50
        `;
        const rows = await db.all(sql);
        console.log(`Found ${rows.length} activities`);
        res.json(rows || []);
    } catch (err) {
        console.error('Error getting project activities:', err);
        res.status(500).json({ error: err.message });
    }
});

// Export activities as CSV
router.get('/activities/export', async (req, res) => {
    try {
        // Get all activities with project names
        const sql = `
            SELECT 
                a.*,
                p.name as project_name,
                u.name as user_name,
                g.name as group_name
            FROM project_activities a
            JOIN projects p ON a.project_id = p.id
            LEFT JOIN users u ON p.user_id = u.id
            LEFT JOIN groups g ON u.group_id = g.id
            ORDER BY a.activity_date DESC
        `;
        const rows = await db.all(sql);
        
        // Set headers for CSV download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=project_activities.csv');
        
        // Write CSV header
        res.write('Date,Project,User,Group,Type,Details,Changed Fields\n');
        
        // Write each activity as a CSV row
        rows.forEach(activity => {
            const date = new Date(activity.activity_date).toLocaleString();
            
            // Process changed_fields if available
            let changedFieldsText = '';
            if (activity.changed_fields) {
                try {
                    const changedFields = JSON.parse(activity.changed_fields);
                    if (changedFields) {
                        // Format each changed field
                        changedFieldsText = Object.keys(changedFields)
                            .map(field => {
                                const from = changedFields[field].from;
                                const to = changedFields[field].to;
                                
                                // Format time_spent_minutes specially
                                if (field === 'time_spent_minutes') {
                                    const fromHrs = from ? `${Math.floor(from / 60)}h ${from % 60}m` : '0h';
                                    const toHrs = to ? `${Math.floor(to / 60)}h ${to % 60}m` : '0h';
                                    return `Time: ${fromHrs} → ${toHrs}`;
                                }
                                
                                // Format other fields
                                const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                                const fromValue = from !== null && from !== undefined ? String(from) : '(none)';
                                const toValue = to !== null && to !== undefined ? String(to) : '(none)';
                                
                                return `${fieldName}: ${fromValue} → ${toValue}`;
                            })
                            .join('; ');
                    }
                } catch (error) {
                    console.error('Error parsing changed fields', error);
                    changedFieldsText = '(error parsing changed fields)';
                }
            }
            
            const csvRow = [
                date,
                activity.project_name || '',
                activity.user_name || '',
                activity.group_name || '',
                activity.activity_type || '',
                activity.details || '',
                changedFieldsText
            ].map(field => `"${(field || '').toString().replace(/"/g, '""')}"`).join(',');
            
            res.write(csvRow + '\n');
        });
        
        res.end();
    } catch (err) {
        console.error('Error exporting activities:', err);
        res.status(500).json({ error: err.message });
    }
});

// Create project
router.post('/', async (req, res) => {
    const { name, description, status, software, time_spent_minutes, project_path, 
            folder_created, readme_last_updated, start_date, user_id,
            image_types, sample_type, objective_magnification, analysis_goal } = req.body;
    
    try {
        // Validate required fields
        if (!name) {
            return res.status(400).json({ error: 'Project name is required' });
        }

        console.log('Creating new project with data:', JSON.stringify({
            name,
            description: description?.substring(0, 100) + '...',
            status,
            software,
            start_date,
            user_id
        }, null, 2));

        // Start a transaction to ensure atomic operation
        await db.run('BEGIN TRANSACTION');

        try {
            // Insert the project with all possible fields
            const result = await db.run(
                `INSERT INTO projects (
                    name, description, status, software, time_spent_minutes,
                    project_path, folder_created, readme_last_updated,
                    start_date, user_id, creation_date, last_updated,
                    image_types, sample_type, objective_magnification, analysis_goal
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), ?, ?, ?, ?)`,
                [
                    name,
                    description || '',
                    status || 'Intake',
                    software || null,
                    parseInt(time_spent_minutes) || 0,
                    project_path || null,
                    folder_created || 0,
                    readme_last_updated || null,
                    start_date || new Date().toISOString().split('T')[0],
                    user_id || null,
                    image_types || null,
                    sample_type || null,
                    objective_magnification || null,
                    analysis_goal || null
                ]
            );
            
            if (!result.lastID) {
                throw new Error('Failed to create project - no ID returned');
            }

            const newProjectId = result.lastID;
            console.log(`New project created with ID: ${newProjectId}`);
            
            // Record project creation activity with proper initial state tracking
            await recordProjectActivity(
                newProjectId,
                'create',
                'Project created',
                {
                    name: { from: null, to: name },
                    description: { from: null, to: description || '' },
                    status: { from: null, to: status || 'Intake' },
                    software: { from: null, to: software || null },
                    start_date: { from: null, to: start_date || new Date().toISOString().split('T')[0] },
                    user_id: { from: null, to: user_id || null },
                    time_spent_minutes: { from: null, to: parseInt(time_spent_minutes) || 0 }
                }
            );
            
            // Get the complete project data with joins
            const sql = `
                SELECT p.*,
                       u.name as user_name,
                       u.email as user_email,
                       g.name as group_name,
                       g.id as group_id
                FROM projects p
                LEFT JOIN users u ON p.user_id = u.id
                LEFT JOIN groups g ON u.group_id = g.id
                WHERE p.id = ?`;
                
            const project = await db.get(sql, [newProjectId]);
            
            if (!project) {
                throw new Error('Failed to retrieve created project');
            }
            
            // Commit the transaction
            await db.run('COMMIT');
            
            console.log('Returning newly created project:', JSON.stringify(project, null, 2));
            res.json(project);
        } catch (err) {
            // Rollback on error
            await db.run('ROLLBACK');
            throw err;
        }
    } catch (err) {
        console.error('Error creating project:', err);
        res.status(500).json({ error: err.message });
    }
});

// Add new route to get journal entries for a project
router.get('/:id/journal', (req, res) => {
    const sql = 'SELECT id, project_id, entry_text, datetime(entry_date) as entry_date, edited_at, edited_by FROM journal_entries WHERE project_id = ? ORDER BY entry_date DESC';
    db.all(sql, [req.params.id], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows || []);
    });
});

// Add new route to add journal entry
router.post('/:id/journal', async (req, res) => {
    const { entry_text } = req.body;
    const project_id = req.params.id;
    
    if (!entry_text) {
        return res.status(400).json({ error: 'Entry text is required' });
    }
    
    try {
        const result = await db.run(
            'INSERT INTO journal_entries (project_id, entry_text) VALUES (?, ?)',
            [project_id, entry_text]
        );
        
        // Also record this as a project activity
        await recordProjectActivity(
            project_id,
            'journal_entry',
            entry_text.substring(0, 100) + (entry_text.length > 100 ? '...' : '')
        );
        
        // Return the newly created entry with formatted date
        const row = await db.get(
            'SELECT id, entry_text, datetime(entry_date) as entry_date, edited_at, edited_by FROM journal_entries WHERE id = ?', 
            [result.lastID]
        );
        
        // Update project's last_updated timestamp
        await db.run(
            'UPDATE projects SET last_updated = datetime("now") WHERE id = ?',
            [project_id]
        );
        
        res.json(row);
    } catch (err) {
        console.error('Error adding journal entry:', err);
        res.status(500).json({ error: err.message });
    }
});

// Delete a journal entry
router.delete('/:id/journal/:entryId', async (req, res) => {
    const { id: projectId, entryId } = req.params;
    try {
        const existing = await db.get('SELECT * FROM journal_entries WHERE id = ? AND project_id = ?', [entryId, projectId]);
        if (!existing) {
            return res.status(404).json({ error: 'Journal entry not found' });
        }

        await db.run('DELETE FROM journal_entries WHERE id = ?', [entryId]);

        await recordProjectActivity(
            projectId,
            'journal_entry_deleted',
            (existing.entry_text || '').substring(0, 100)
        );
        await db.run('UPDATE projects SET last_updated = datetime("now") WHERE id = ?', [projectId]);
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting journal entry:', err);
        res.status(500).json({ error: err.message });
    }
});

// Edit an existing journal entry
router.patch('/:id/journal/:entryId', async (req, res) => {
    const { id: projectId, entryId } = req.params;
    const { entry_text, edited_by } = req.body || {};

    if (!entry_text || String(entry_text).trim() === '') {
        return res.status(400).json({ error: 'Entry text is required' });
    }

    try {
        // Ensure entry belongs to project
        const existing = await db.get('SELECT * FROM journal_entries WHERE id = ? AND project_id = ?', [entryId, projectId]);
        if (!existing) {
            return res.status(404).json({ error: 'Journal entry not found' });
        }

        // Update entry text and edited metadata
        await db.run(
            'UPDATE journal_entries SET entry_text = ?, edited_at = datetime("now"), edited_by = ? WHERE id = ?',
            [entry_text, edited_by || null, entryId]
        );

        // Record activity
        await recordProjectActivity(
            projectId,
            'journal_entry_edited',
            (entry_text || '').substring(0, 100) + ((entry_text || '').length > 100 ? '...' : ''),
            { journal_entry: { from: (existing.entry_text || '').substring(0, 100), to: (entry_text || '').substring(0, 100) } }
        );

        // Touch project last_updated
        await db.run('UPDATE projects SET last_updated = datetime("now") WHERE id = ?', [projectId]);

        // Return updated row
        const row = await db.get(
            'SELECT id, project_id, entry_text, datetime(entry_date) as entry_date, edited_at, edited_by FROM journal_entries WHERE id = ?',
            [entryId]
        );
        res.json(row);
    } catch (err) {
        console.error('Error editing journal entry:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get project by id
router.get('/:id', async (req, res) => {
    try {
        const project = await db.get(
            `SELECT p.*, 
                    u.name as user_name,
                    u.email as user_email,
                    u.id as user_id,
                    g.name as group_name,
                    g.id as group_id
             FROM projects p
             LEFT JOIN users u ON p.user_id = u.id
             LEFT JOIN groups g ON u.group_id = g.id
             WHERE p.id = ?`,
            [req.params.id]
        );

        if (!project) {
            res.status(404).json({ error: "Project not found" });
            return;
        }

        // Get journal entries in a separate query
        const entries = await db.all(
            `SELECT 
                id,
                entry_text,
                datetime(entry_date) as entry_date,
                edited_at,
                edited_by
             FROM journal_entries 
             WHERE project_id = ? 
             ORDER BY entry_date DESC`,
            [req.params.id]
        );

        // Add journal entries to project
        project.journal_entries = entries.map(entry => ({
            ...entry,
            entry_date: new Date(entry.entry_date).toISOString(),
            edited_at: entry.edited_at ? new Date(entry.edited_at).toISOString() : null
        }));

        // Format dates
        if (project.start_date) {
            project.start_date = new Date(project.start_date).toISOString().split('T')[0];
        }

        res.json(project);
    } catch (err) {
        console.error('Error getting project:', err);
        res.status(500).json({ error: err.message });
    }
});

// Update project
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    
    try {
        // Debugging the project path specifically
        if (updates.hasOwnProperty('project_path')) {
            console.log(`Project path update detected: "${updates.project_path}"`);
        }
        
        // Get original project data for comparison
        const originalProject = await db.get('SELECT * FROM projects WHERE id = ?', [id]);
        if (!originalProject) {
            return res.status(404).json({ error: "Project not found" });
        }
        
        // Track what fields changed
        const changedFields = {};
        
        // First update the project
        if (Object.keys(updates).length > 0) {
            // Only allow updating specific fields
            const allowedFields = [
                'name', 'description', 'status', 'software', 'time_spent_minutes',
                'project_path', 'folder_created', 'readme_last_updated',
                'start_date', 'user_id', 'image_types', 'sample_type', 
                'objective_magnification', 'analysis_goal'
            ];

            const fields = Object.keys(updates).filter(key => allowedFields.includes(key));
            
            if (fields.length > 0) {
                // Track what fields changed and their values
                fields.forEach(field => {
                    // Special handling for project_path which can be empty string, null or undefined
                    if (field === 'project_path') {
                        const originalValue = originalProject[field] || null;
                        const newValue = updates[field] || null;
                        
                        console.log(`Project path comparison: original='${originalValue}', new='${newValue}'`);
                        
                        if (originalValue !== newValue) {
                            changedFields[field] = {
                                from: originalValue,
                                to: newValue
                            };
                        }
                    } else {
                        // Normal handling for other fields
                        const originalValue = originalProject[field] !== null ? String(originalProject[field]) : null;
                        const newValue = updates[field] !== null ? String(updates[field]) : null;
                        
                        if (originalValue !== newValue) {
                            changedFields[field] = {
                                from: originalProject[field],
                                to: updates[field]
                            };
                        }
                    }
                });
                
                // Build SQL update query with proper parameter binding
                const updateValues = [];
                const updateFields = [];
                
                fields.forEach(field => {
                    updateFields.push(`${field} = ?`);
                    updateValues.push(updates[field]);
                });
                
                // Add timestamp to values and fields
                updateFields.push('last_updated = datetime("now")');
                
                const sql = `
                    UPDATE projects 
                    SET ${updateFields.join(', ')}
                    WHERE id = ?
                `;
                
                await db.run(sql, [...updateValues, id]);
                
                // Record the activity if any fields changed
                if (Object.keys(changedFields).length > 0) {
                    let activityDetails = 'Project updated: ';
                    activityDetails += Object.keys(changedFields)
                        .map(field => field.replace(/([A-Z])/g, ' $1').toLowerCase())
                        .join(', ');
                    
                    console.log(`Changes detected: ${JSON.stringify(changedFields)}`);
                    await recordProjectActivity(
                        id,
                        'update',
                        activityDetails,
                        changedFields
                    );
                } else {
                    console.log('No changes detected, skipping activity recording');
                }
            }
        }

        // Get the updated project with all related data
        const sql = `
            SELECT p.*,
                   u.name as user_name,
                   u.email as user_email,
                   g.name as group_name,
                   g.id as group_id
            FROM projects p
            LEFT JOIN users u ON p.user_id = u.id
            LEFT JOIN groups g ON u.group_id = g.id
            WHERE p.id = ?`;
            
        const project = await db.get(sql, [id]);
        
        if (!project) {
            return res.status(404).json({ error: "Project not found" });
        }
        
        // Get journal entries
        const entries = await db.all(
            'SELECT id, entry_text, datetime(entry_date) as entry_date, edited_at, edited_by FROM journal_entries WHERE project_id = ? ORDER BY entry_date DESC',
            [id]
        );
        
        // Add journal entries to project
        project.journal_entries = entries.map(entry => ({
            ...entry,
            entry_date: new Date(entry.entry_date).toISOString(),
            edited_at: entry.edited_at ? new Date(entry.edited_at).toISOString() : null
        }));

        // Format dates for consistency
        if (project.start_date) {
            project.start_date = new Date(project.start_date).toISOString().split('T')[0];
        }
        
        res.json(project);
    } catch (err) {
        console.error('Error updating project:', err);
        res.status(500).json({ error: err.message });
    }
});

// Update project users
router.post('/:id/users', async (req, res) => {
    const { users } = req.body;
    const projectId = req.params.id;

    try {
        // First delete all existing project users
        await db.run('DELETE FROM project_users WHERE project_id = ?', [projectId]);

        // Then add the new users
        for (const userId of users) {
            await db.run(
                'INSERT INTO project_users (project_id, user_id) VALUES (?, ?)',
                [projectId, userId]
            );
        }

        // Record the activity
        await recordProjectActivity(
            projectId,
            'update_users',
            `Project users updated: ${users.length} users assigned`
        );

        // Return updated project
        const project = await db.get(
            'SELECT * FROM projects WHERE id = ?',
            [projectId]
        );
        res.json(project);
    } catch (err) {
        console.error('Error updating project users:', err);
        res.status(500).json({ error: err.message });
    }
});

// Delete project
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        // First get the project name for the activity log
        const project = await db.get('SELECT name FROM projects WHERE id = ?', [id]);
        if (!project) {
            res.status(404).json({ error: "Project not found" });
            return;
        }
        
        const result = await db.run('DELETE FROM projects WHERE id = ?', [id]);
        
        if (result.changes === 0) {
            res.status(404).json({ error: "Project not found" });
            return;
        }
        
        res.json({ message: "Project deleted successfully" });
    } catch (err) {
        console.error('Error deleting project:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get all activities for a specific project
router.get('/:id/activities', async (req, res) => {
    try {
        const sql = `
            SELECT * FROM project_activities
            WHERE project_id = ?
            ORDER BY activity_date DESC
        `;
        const rows = await db.all(sql, [req.params.id]);
        res.json(rows || []);
    } catch (err) {
        console.error('Error getting project activities:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
