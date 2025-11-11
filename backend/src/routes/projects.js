const express = require('express');
const router = express.Router();
const db = require('../database/db');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

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
            image_types, sample_type, objective_magnification, analysis_goal, output_type } = req.body;
    
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
                    image_types, sample_type, objective_magnification, analysis_goal, output_type
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), ?, ?, ?, ?, ?)`,
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
                    analysis_goal || null,
                    output_type || null
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
                    time_spent_minutes: { from: null, to: parseInt(time_spent_minutes) || 0 },
                    output_type: { from: null, to: output_type || null }
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

// List project resources (references)
router.get('/:id/references', async (req, res) => {
    try {
        const rows = await db.all(
            `SELECT id, project_id, filename, original_name, mime_type, kind, caption, size, datetime(created_at) as created_at
             FROM project_resources WHERE project_id = ? ORDER BY created_at DESC`,
            [req.params.id]
        );
        res.json(rows || []);
    } catch (err) {
        console.error('Error getting project resources:', err);
        res.status(500).json({ error: err.message });
    }
});

// Upload one or more resources
router.post('/:id/references/upload', upload.array('files', 20), async (req, res) => {
    const projectId = req.params.id;
    try {
        const project = await db.get('SELECT id, project_path FROM projects WHERE id = ?', [projectId]);
        if (!project) return res.status(404).json({ error: 'Project not found' });
        if (!project.project_path) return res.status(400).json({ error: 'Project path is not set' });

        const referenceDir = path.join(project.project_path, 'reference');
        if (!fs.existsSync(referenceDir)) fs.mkdirSync(referenceDir, { recursive: true });

        const allowedDocs = new Set([
            'application/pdf', 'text/plain',
            'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]);

        const saved = [];
        for (const file of (req.files || [])) {
            const mime = file.mimetype || '';
            const isImage = mime.startsWith('image/') && (mime === 'image/jpeg' || mime === 'image/png');
            const isDoc = allowedDocs.has(mime);
            if (!isImage && !isDoc) {
                console.warn('Skipping unsupported file type:', mime, file.originalname);
                continue;
            }
            const kind = isImage ? 'image' : 'document';
            // Ensure unique filename by avoiding overwrite
            const baseName = path.basename(file.originalname).replace(/[\\/:*?"<>|]/g, '_');
            let target = path.join(referenceDir, baseName);
            const ext = path.extname(baseName);
            const nameNoExt = ext ? baseName.slice(0, -ext.length) : baseName;
            let idx = 1;
            while (fs.existsSync(target)) {
                const candidate = `${nameNoExt} (${idx})${ext}`;
                target = path.join(referenceDir, candidate);
                idx++;
            }
            fs.writeFileSync(target, file.buffer);
            const filename = path.basename(target);

            const result = await db.run(
                `INSERT INTO project_resources (project_id, filename, original_name, mime_type, kind, size)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [projectId, filename, file.originalname, mime, kind, file.size || null]
            );
            saved.push({ id: result.lastID, project_id: projectId, filename, original_name: file.originalname, mime_type: mime, kind, size: file.size || null });
        }

        // Touch project last_updated
        await db.run('UPDATE projects SET last_updated = datetime("now") WHERE id = ?', [projectId]);
        res.json({ uploaded: saved });
    } catch (err) {
        console.error('Error uploading project resources:', err);
        res.status(500).json({ error: err.message });
    }
});

// Download/serve a resource file
router.get('/:id/references/:resId/file', async (req, res) => {
    try {
        const project = await db.get('SELECT id, project_path FROM projects WHERE id = ?', [req.params.id]);
        if (!project || !project.project_path) return res.status(404).json({ error: 'Project not found or path missing' });
        const row = await db.get('SELECT * FROM project_resources WHERE id = ? AND project_id = ?', [req.params.resId, req.params.id]);
        if (!row) return res.status(404).json({ error: 'Resource not found' });
        const filePath = path.join(project.project_path, 'reference', row.filename);
        if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File missing on disk' });
        res.sendFile(path.resolve(filePath));
    } catch (err) {
        console.error('Error serving resource file:', err);
        res.status(500).json({ error: err.message });
    }
});

// Update resource metadata (caption only for now)
router.patch('/:id/references/:resId', async (req, res) => {
    try {
        const { caption } = req.body || {};
        const row = await db.get('SELECT * FROM project_resources WHERE id = ? AND project_id = ?', [req.params.resId, req.params.id]);
        if (!row) return res.status(404).json({ error: 'Resource not found' });
        await db.run('UPDATE project_resources SET caption = ? WHERE id = ?', [caption || null, req.params.resId]);
        const updated = await db.get('SELECT * FROM project_resources WHERE id = ?', [req.params.resId]);
        res.json(updated);
    } catch (err) {
        console.error('Error updating resource:', err);
        res.status(500).json({ error: err.message });
    }
});

// Delete a resource (record + file)
router.delete('/:id/references/:resId', async (req, res) => {
    try {
        const project = await db.get('SELECT id, project_path FROM projects WHERE id = ?', [req.params.id]);
        const row = await db.get('SELECT * FROM project_resources WHERE id = ? AND project_id = ?', [req.params.resId, req.params.id]);
        if (!row) return res.status(404).json({ error: 'Resource not found' });
        await db.run('DELETE FROM project_resources WHERE id = ?', [req.params.resId]);
        if (project && project.project_path) {
            const filePath = path.join(project.project_path, 'reference', row.filename);
            if (fs.existsSync(filePath)) {
                try { fs.unlinkSync(filePath); } catch {}
            }
        }
        await db.run('UPDATE projects SET last_updated = datetime("now") WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting resource:', err);
        res.status(500).json({ error: err.message });
    }
});

// Update README to include resources section between markers
router.post('/:id/readme/resources', async (req, res) => {
    try {
        const project = await db.get('SELECT id, project_path FROM projects WHERE id = ?', [req.params.id]);
        if (!project || !project.project_path) return res.status(400).json({ error: 'Project path is not set' });
        const readmePathTxt = path.join(project.project_path, 'README.txt');
        const readmePathMd = path.join(project.project_path, 'README.md');
        const targetReadme = fs.existsSync(readmePathTxt) ? readmePathTxt : readmePathMd;
        if (!fs.existsSync(targetReadme)) return res.status(404).json({ error: 'README not found' });

        const resources = await db.all('SELECT * FROM project_resources WHERE project_id = ? ORDER BY created_at DESC', [req.params.id]);
        const imgs = resources.filter(r => r.kind === 'image');
        const docs = resources.filter(r => r.kind !== 'image');

        const header = '\n\n=== RESOURCES (auto-generated) ===\n';
        const footer = '\n=== END RESOURCES ===\n';
        const lines = [];
        lines.push(header.trim());
        if (imgs.length) {
            lines.push('Images:');
            imgs.forEach(r => {
                lines.push(` - ${path.posix.join('reference', r.filename)}${r.caption ? ` — ${r.caption}` : ''}`);
            });
            lines.push('');
        }
        if (docs.length) {
            lines.push('Documents:');
            docs.forEach(r => {
                lines.push(` - ${path.posix.join('reference', r.filename)}${r.caption ? ` — ${r.caption}` : ''}`);
            });
            lines.push('');
        }
        const section = lines.join('\n').trim() + '\n' + footer.trim();

        let content = fs.readFileSync(targetReadme, 'utf8');
        const startIdx = content.indexOf('=== RESOURCES (auto-generated) ===');
        const endIdx = content.indexOf('=== END RESOURCES ===');
        if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
            const before = content.substring(0, startIdx);
            const after = content.substring(endIdx + '=== END RESOURCES ==='.length);
            content = before + section + after;
        } else {
            content = content.trimEnd() + '\n' + section;
        }
        fs.writeFileSync(targetReadme, content, 'utf8');
        await db.run('UPDATE projects SET last_updated = datetime("now") WHERE id = ?', [req.params.id]);
        res.json({ updated: true, readme: path.basename(targetReadme) });
    } catch (err) {
        console.error('Error updating README resources:', err);
        res.status(500).json({ error: err.message });
    }
});

// Unified README update: regenerates the entire README with project info, folder listings, journal, and resources
router.post('/:id/readme/update', async (req, res) => {
    try {
        const projectId = req.params.id;

        // Load project with basic fields
        const project = await db.get('SELECT * FROM projects WHERE id = ?', [projectId]);
        if (!project) return res.status(404).json({ error: 'Project not found' });
        if (!project.project_path) return res.status(400).json({ error: 'Project path is not set' });

        const projectDir = project.project_path;

        // Resolve README target: prefer existing README.txt or README.md; otherwise create README.md
        const readmeTxt = path.join(projectDir, 'README.txt');
        const readmeMd = path.join(projectDir, 'README.md');
        let targetReadme = null;
        if (fs.existsSync(readmeTxt)) targetReadme = readmeTxt;
        else if (fs.existsSync(readmeMd)) targetReadme = readmeMd;
        else {
            // default to md when missing
            targetReadme = readmeMd;
        }

        // Fetch journal entries latest first
        const journal = await db.all(
            'SELECT entry_text, datetime(entry_date) as entry_date, edited_at, edited_by FROM journal_entries WHERE project_id = ? ORDER BY entry_date DESC',
            [projectId]
        );

        // Fetch resources
        const resources = await db.all('SELECT * FROM project_resources WHERE project_id = ? ORDER BY created_at DESC', [projectId]);
        const imgs = resources.filter(r => r.kind === 'image');
        const docs = resources.filter(r => r.kind !== 'image');

        // Helper: parse JSON arrays stored as strings
        const parseArray = (val) => {
            if (!val) return null;
            try {
                const parsed = Array.isArray(val) ? val : JSON.parse(val);
                if (Array.isArray(parsed)) return parsed.join(', ');
            } catch { /* noop */ }
            return String(val);
        };

        // Helper: format file sizes
        const sizeStr = (bytes) => {
            if (typeof bytes !== 'number') return '';
            if (bytes >= 1024 * 1024) return `${(bytes / (1024*1024)).toFixed(1)} MB`;
            if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
            return `${bytes} bytes`;
        };

        // Scan folders and produce listings by known structure (depth 2) and include any extra folders at root
        const ensureArray = (x) => Array.isArray(x) ? x : (x ? [x] : []);
        const structure = [
            { folder: 'request', sub: ['documents', 'images', 'notes'] },
            { folder: 'sample_data', sub: ['original', 'test_subset'] },
            { folder: 'processed_data', sub: ['converted', 'preprocessed', 'intermediate'] },
            { folder: 'references', sub: ['articles', 'protocols', 'manuals'] },
            { folder: 'reference', sub: [] }, // where uploaded attachments live
            { folder: 'scripts', sub: [] },
            { folder: 'results', sub: ['analysis_results', 'tutorials', 'protocols', 'examples'] }
        ];

        const listFiles = (dir) => {
            try {
                return (fs.readdirSync(dir, { withFileTypes: true }) || [])
                    .filter(d => d.isFile())
                    .map(d => ({ name: d.name, size: (() => { try { return fs.statSync(path.join(dir, d.name)).size; } catch { return 0; } })() }));
            } catch { return []; }
        };

        const listDirs = (dir) => {
            try {
                return (fs.readdirSync(dir, { withFileTypes: true }) || [])
                    .filter(d => d.isDirectory())
                    .map(d => d.name);
            } catch { return []; }
        };

        const folderSections = [];
        // Track top-level entries to include any custom folders not in structure
        const topLevelDirs = new Set(listDirs(projectDir));
        for (const item of structure) {
            const folderPath = path.join(projectDir, item.folder);
            if (!fs.existsSync(folderPath)) continue;
            topLevelDirs.delete(item.folder);

            const topFiles = listFiles(folderPath);
            const subLines = [];
            let folderBytes = topFiles.reduce((s, f) => s + (f.size || 0), 0);

            // List files directly under the folder
            if (topFiles.length) {
                subLines.push('  Files:');
                topFiles.slice(0, 200).forEach(f => subLines.push(`  - ${f.name} (${sizeStr(f.size)})`));
                if (topFiles.length > 200) subLines.push(`  - … ${topFiles.length - 200} more`);
            }

            // Known subfolders first
            const desiredSubs = ensureArray(item.sub);
            const existingSubs = new Set(listDirs(folderPath));
            for (const sub of desiredSubs) {
                const subPath = path.join(folderPath, sub);
                if (!fs.existsSync(subPath)) {
                    subLines.push(`  - ${sub}/ (not created)`);
                    continue;
                }
                existingSubs.delete(sub);
                const files = listFiles(subPath);
                const bytes = files.reduce((s, f) => s + (f.size || 0), 0);
                folderBytes += bytes;
                subLines.push(`  - ${sub}/ (${files.length} files, ${sizeStr(bytes)})`);
                files.slice(0, 200).forEach(f => subLines.push(`    • ${f.name} (${sizeStr(f.size)})`));
                if (files.length > 200) subLines.push(`    • … ${files.length - 200} more`);
            }

            // Any extra subfolders get listed too
            for (const sub of Array.from(existingSubs).sort()) {
                const subPath = path.join(folderPath, sub);
                const files = listFiles(subPath);
                const bytes = files.reduce((s, f) => s + (f.size || 0), 0);
                folderBytes += bytes;
                subLines.push(`  - ${sub}/ (${files.length} files, ${sizeStr(bytes)})`);
                files.slice(0, 100).forEach(f => subLines.push(`    • ${f.name} (${sizeStr(f.size)})`));
                if (files.length > 100) subLines.push(`    • … ${files.length - 100} more`);
            }

            const titleLine = `- ${item.folder}/ (${sizeStr(folderBytes)})`;
            folderSections.push([titleLine, ...subLines].join('\n'));
        }

        // Include any top-level folders not part of our standard structure
        for (const extra of Array.from(topLevelDirs).sort()) {
            const p = path.join(projectDir, extra);
            const files = listFiles(p);
            const bytes = files.reduce((s, f) => s + (f.size || 0), 0);
            const lines = [`- ${extra}/ (${files.length} files, ${sizeStr(bytes)})`];
            files.slice(0, 100).forEach(f => lines.push(`  • ${f.name} (${sizeStr(f.size)})`));
            if (files.length > 100) lines.push(`  • … ${files.length - 100} more`);
            folderSections.push(lines.join('\n'));
        }

        // Build README content (Markdown-compatible, but readable as text)
        const nowIso = new Date().toISOString();
        const header = `# ${project.name || 'Untitled Project'}\n\n` +
            `## Overview\n` +
            `${project.description || 'No description provided.'}\n\n` +
            `## Project Metadata\n` +
            `- Status: ${project.status || 'Preparing'}\n` +
            `- Software: ${project.software || '—'}\n` +
            `- Output/Result Type: ${project.output_type || '—'}\n` +
            `- Imaging Techniques: ${parseArray(project.image_types) || '—'}\n` +
            `- Sample Type: ${parseArray(project.sample_type) || '—'}\n` +
            `- Objective Magnification: ${project.objective_magnification || '—'}\n` +
            `- Analysis Goal: ${parseArray(project.analysis_goal) || '—'}\n` +
            `- Project Path: ${project.project_path || '—'}\n` +
            `- Time Spent: ${(() => { const m = parseInt(project.time_spent_minutes||0); const h=Math.floor(m/60), mm=m%60; return mm?`${h}h ${mm}m`:`${h}h`; })()}\n` +
            `- Last Updated in BIOME: ${nowIso}\n\n`;

        const structureTitle = `## Project Structure\n`;
        const structureBody = folderSections.length
            ? folderSections.join('\n') + '\n\n'
            : 'No folders found yet.\n\n';

        // Journal section
        const journalTitle = '## Journal\n';
        const journalLines = [];
        if (journal && journal.length) {
            for (const e of journal) {
                const dateStr = (() => { try { return new Date(e.entry_date).toLocaleString(); } catch { return String(e.entry_date||''); } })();
                const edited = e.edited_at ? `\n(edited${e.edited_by ? ` by ${e.edited_by}` : ''} on ${new Date(e.edited_at).toLocaleString()})` : '';
                journalLines.push(`### ${dateStr}\n${e.entry_text}${edited}\n`);
            }
        } else {
            journalLines.push('No journal entries yet.');
        }

        // Resources section with markers
        const resTitle = '## Resources\n\n=== RESOURCES (auto-generated) ===\n';
        const resLines = [];
        if (imgs.length) {
            resLines.push('Images:');
            imgs.forEach(r => {
                const rel = path.posix.join('reference', r.filename);
                resLines.push(` - ${rel}${r.caption ? ` — ${r.caption}` : ''}`);
            });
            resLines.push('');
        }
        if (docs.length) {
            resLines.push('Documents:');
            docs.forEach(r => {
                const rel = path.posix.join('reference', r.filename);
                resLines.push(` - ${rel}${r.caption ? ` — ${r.caption}` : ''}`);
            });
            resLines.push('');
        }
        if (!imgs.length && !docs.length) {
            resLines.push('No resources have been uploaded yet.');
        }
        const resFooter = '=== END RESOURCES ===\n\n';

        const content = header + structureTitle + structureBody + journalTitle + journalLines.join('\n') + '\n\n' + resTitle + resLines.join('\n') + '\n' + resFooter;

        // If a README already exists and has resource markers, replace that block to avoid duplicates when switching formats
        if (fs.existsSync(targetReadme)) {
            try {
                let existing = fs.readFileSync(targetReadme, 'utf8');
                const start = existing.indexOf('=== RESOURCES (auto-generated) ===');
                const end = existing.indexOf('=== END RESOURCES ===');
                if (start !== -1 && end !== -1 && end > start) {
                    // Replace only the resources section while keeping potential manual edits around it
                    const before = existing.substring(0, start);
                    const after = existing.substring(end + '=== END RESOURCES ==='.length);
                    existing = before + '=== RESOURCES (auto-generated) ===\n' + resLines.join('\n') + '\n=== END RESOURCES ===' + after;
                    // Now rebuild around the new header/structure/journal sections to ensure completeness
                    fs.writeFileSync(targetReadme, content, 'utf8');
                } else {
                    fs.writeFileSync(targetReadme, content, 'utf8');
                }
            } catch {
                fs.writeFileSync(targetReadme, content, 'utf8');
            }
        } else {
            // Create new file
            fs.writeFileSync(targetReadme, content, 'utf8');
        }

        // Touch project last_updated and readme_last_updated
        await db.run('UPDATE projects SET last_updated = datetime("now"), readme_last_updated = datetime("now") WHERE id = ?', [projectId]);

        res.json({ updated: true, readme: path.basename(targetReadme), timestamp: new Date().toISOString() });
    } catch (err) {
        console.error('Error updating README (unified):', err);
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
                'objective_magnification', 'analysis_goal', 'output_type'
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
