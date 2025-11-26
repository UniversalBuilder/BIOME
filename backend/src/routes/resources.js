const express = require('express');
const router = express.Router();
const db = require('../database/db');
const fs = require('fs');
const path = require('path');

// Helper to check file existence
const checkFileExists = (filePath) => {
    try {
        return fs.existsSync(filePath);
    } catch (e) {
        return false;
    }
};

/**
 * Validate resources for a project
 * Checks if the files referenced in project_resources exist on disk
 */
router.post('/validate', async (req, res) => {
    const { projectId } = req.body;
    
    if (!projectId) {
        return res.status(400).json({ error: 'Project ID is required' });
    }

    try {
        // Get project to find the base path
        const project = await db.get('SELECT * FROM projects WHERE id = ?', [projectId]);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        if (!project.project_path) {
            return res.status(400).json({ error: 'Project has no path defined' });
        }

        // Get all resources for the project
        const resources = await db.all('SELECT * FROM project_resources WHERE project_id = ?', [projectId]);
        
        const missingResources = [];
        const validResources = [];

        for (const resource of resources) {
            // Construct the expected full path
            // Resources are stored in <project_path>/reference/<filename>
            const expectedPath = path.join(project.project_path, 'reference', resource.filename);
            
            if (!checkFileExists(expectedPath)) {
                missingResources.push({
                    ...resource,
                    expectedPath
                });
            } else {
                validResources.push({
                    ...resource,
                    expectedPath
                });
            }
        }

        res.json({
            projectId,
            projectPath: project.project_path,
            totalResources: resources.length,
            missingCount: missingResources.length,
            missingResources,
            validResources
        });

    } catch (err) {
        console.error('Error validating resources:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * Search for missing resources in a specific directory
 * This is used when the user points to a new folder where files might be
 */
router.post('/search', async (req, res) => {
    const { projectId, searchPath } = req.body;

    if (!projectId || !searchPath) {
        return res.status(400).json({ error: 'Project ID and search path are required' });
    }

    try {
        if (!checkFileExists(searchPath)) {
            return res.status(404).json({ error: 'Search path does not exist' });
        }

        // Get missing resources (we could reuse validate logic, but let's just get all and filter)
        const project = await db.get('SELECT * FROM projects WHERE id = ?', [projectId]);
        const resources = await db.all('SELECT * FROM project_resources WHERE project_id = ?', [projectId]);
        
        const missingResources = resources.filter(r => {
            const p = path.join(project.project_path, 'reference', r.filename);
            return !checkFileExists(p);
        });

        if (missingResources.length === 0) {
            return res.json({ matches: [] });
        }

        // Scan the search directory (non-recursive for now to be safe/fast, or maybe 1 level deep?)
        // Let's do recursive scan with depth limit
        const findFiles = (dir, depth = 0, maxDepth = 3) => {
            if (depth > maxDepth) return [];
            let results = [];
            try {
                const list = fs.readdirSync(dir, { withFileTypes: true });
                for (const entry of list) {
                    const fullPath = path.join(dir, entry.name);
                    if (entry.isDirectory()) {
                        results = results.concat(findFiles(fullPath, depth + 1, maxDepth));
                    } else if (entry.isFile()) {
                        results.push({
                            name: entry.name,
                            path: fullPath,
                            size: fs.statSync(fullPath).size
                        });
                    }
                }
            } catch (e) {
                console.warn(`Error scanning ${dir}:`, e.message);
            }
            return results;
        };

        const foundFiles = findFiles(searchPath);
        const matches = [];

        // Match missing resources against found files
        for (const resource of missingResources) {
            // Try to match by filename
            const match = foundFiles.find(f => f.name === resource.filename || f.name === resource.original_name);
            
            if (match) {
                matches.push({
                    resourceId: resource.id,
                    resourceName: resource.filename,
                    foundPath: match.path,
                    confidence: match.name === resource.filename ? 'high' : 'medium'
                });
            }
        }

        res.json({ matches });

    } catch (err) {
        console.error('Error searching resources:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * Relink resources
 * Updates the filename/path in the database or moves files
 * Actually, for BIOME, resources are expected to be in <project>/reference/
 * So "relinking" implies either:
 * 1. Moving the found file to <project>/reference/
 * 2. Updating the project path if ALL resources are found in a new location (Project Move)
 * 
 * The feature plan says: "Store both absolute and optional relative URIs".
 * But currently we only store `filename` which is relative to `reference/`.
 * 
 * If we find the file elsewhere, we should probably COPY/MOVE it to the correct `reference/` folder.
 * OR update the `filename` if it's just a rename.
 * 
 * Let's implement "Copy to Reference Folder" as the primary relink action.
 */
router.post('/relink', async (req, res) => {
    const { projectId, operations } = req.body; // operations: [{ resourceId, foundPath, action: 'copy'|'move' }]

    if (!projectId || !Array.isArray(operations)) {
        return res.status(400).json({ error: 'Invalid request format' });
    }

    try {
        const project = await db.get('SELECT * FROM projects WHERE id = ?', [projectId]);
        const referenceDir = path.join(project.project_path, 'reference');
        
        if (!fs.existsSync(referenceDir)) {
            fs.mkdirSync(referenceDir, { recursive: true });
        }

        const results = [];

        for (const op of operations) {
            const { resourceId, foundPath, action } = op;
            
            try {
                const resource = await db.get('SELECT * FROM project_resources WHERE id = ?', [resourceId]);
                if (!resource) {
                    results.push({ resourceId, success: false, error: 'Resource not found' });
                    continue;
                }

                const targetPath = path.join(referenceDir, resource.filename);
                
                // If target already exists, maybe rename the new one?
                // For now, overwrite or skip? Let's skip if exists
                if (checkFileExists(targetPath)) {
                    results.push({ resourceId, success: false, error: 'Target file already exists' });
                    continue;
                }

                if (action === 'move') {
                    fs.renameSync(foundPath, targetPath);
                } else {
                    // Default to copy
                    fs.copyFileSync(foundPath, targetPath);
                }

                results.push({ resourceId, success: true });

            } catch (e) {
                results.push({ resourceId, success: false, error: e.message });
            }
        }

        // Update project last_updated
        await db.run('UPDATE projects SET last_updated = datetime("now") WHERE id = ?', [projectId]);

        res.json({ results });

    } catch (err) {
        console.error('Error relinking resources:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
