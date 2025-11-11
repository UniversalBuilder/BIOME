const express = require('express');
const cors = require('cors');
const path = require('path');
const projectRoutes = require('./routes/projects');
const userRoutes = require('./routes/users');
const groupRoutes = require('./routes/groups');
const filesystemRoutes = require('./routes/filesystem');
const dbManager = require('./database/db');
const fs = require('fs');

// For logging
const winston = require('winston');

// Global server reference for proper shutdown
let server = null;

// Determine app data directory - Tauri sets this environment variable
const APP_DATA_DIR = process.env.TAURI_APP_DATA || process.cwd();

// Set up logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
    defaultMeta: { service: 'BIOME-backend' },
  transports: [
    // Console logging
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Ensure log directory exists and add file logging
const logDir = path.join(APP_DATA_DIR, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Add file logging after ensuring directory exists
logger.add(new winston.transports.File({ 
  filename: path.join(logDir, 'backend-error.log'), 
  level: 'error' 
}));
logger.add(new winston.transports.File({ 
  filename: path.join(logDir, 'backend.log') 
}));

// Replace console.log with logger for better production logging
if (process.env.NODE_ENV === 'production') {
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  console.log = (...args) => {
    logger.info(args.join(' '));
    originalConsoleLog(...args);
  };
  console.error = (...args) => {
    logger.error(args.join(' '));
    originalConsoleError(...args);
  };
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

console.log('Initializing database...');

// Connect to database
dbManager.connect().then(() => {
    console.log('Database connected successfully');
    logger.info(`Database path: ${dbManager.getDatabasePath()}`);

    // Only set up routes after successful database connection
    app.use('/api/projects', projectRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/groups', groupRoutes);
    app.use('/api/filesystem', filesystemRoutes);

    // Database management routes
    app.get('/api/database/info', (req, res) => {
        try {
            const dbPath = dbManager.getDatabasePath();
            res.json({ 
                path: dbPath,
                exists: fs.existsSync(dbPath)
            });
        } catch (error) {
            logger.error('Error getting database info:', error);
            res.status(500).json({ error: error.message });
        }
    });

    app.post('/api/database/reset', async (req, res) => {
        try {
            await dbManager.resetDatabase();
            // After reset, initialize sample data
            await dbManager.initializeSampleData();
            res.json({ message: 'Database reset and initialized successfully' });
        } catch (error) {
            console.error('Error resetting database:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Export database
    app.get('/api/database/export', (req, res) => {
        try {
            const dbPath = dbManager.getDatabasePath();
            if (!fs.existsSync(dbPath)) {
                res.status(404).json({ error: 'Database file not found' });
                return;
            }

            // Set proper headers for file download
            res.setHeader('Content-Type', 'application/x-sqlite3');
            res.setHeader('Content-Disposition', 'attachment; filename=database-export.sqlite');
            
            // Create read stream and pipe to response
            const fileStream = fs.createReadStream(dbPath);
            fileStream.pipe(res);
            
            fileStream.on('error', (error) => {
                console.error('Error streaming database file:', error);
                res.status(500).json({ error: 'Failed to stream database file' });
            });
        } catch (error) {
            console.error('Error exporting database:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Import database
    app.post('/api/database/import', (req, res) => {
        dbManager.importDatabase(req)
            .then(() => {
                res.json({ message: 'Database imported successfully' });
            })
            .catch(error => {
                console.error('Error importing database:', error);
                res.status(500).json({ error: error.message });
            });
    });

    // Add a health check endpoint
    app.get('/api/health', (req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    
    // Add a simple test endpoint for debugging
    app.get('/api/test', (req, res) => {
        logger.info('Test endpoint accessed');
        res.json({ 
            message: 'Backend server is running!', 
            timestamp: new Date().toISOString(),
            node_version: process.version,
            platform: process.platform,
            arch: process.arch,
            cwd: process.cwd(),
            env: {
                NODE_ENV: process.env.NODE_ENV,
                PORT: process.env.PORT,
                TAURI_APP_DATA: process.env.TAURI_APP_DATA
            }
        });
    });

        // Application metadata endpoint (version, description, short changelog)
        app.get('/api/app/meta', (req, res) => {
            try {
                const rootDir = path.resolve(__dirname, '..', '..');
                // Prefer pre-generated app-meta.json if available (bundled or generated at build/dev)
                const bundledMetaCandidates = [
                    process.env.APP_META_FILE,
                    path.join(__dirname, '..', 'app-meta.json'),
                    path.join(__dirname, '..', '..', 'app-meta.json'),
                    path.join(rootDir, 'projet-analyse-image-frontend', 'resources', 'app-meta.json')
                ].filter(Boolean);

                for (const p of bundledMetaCandidates) {
                    try {
                        if (p && fs.existsSync(p)) {
                            const meta = JSON.parse(fs.readFileSync(p, 'utf8'));
                            // Ensure minimum fields
                            if (!meta.releaseDate) meta.releaseDate = new Date().toISOString().slice(0,10);
                            return res.json(meta);
                        }
                    } catch (e) {
                        logger.warn(`Failed reading bundled app meta at ${p}: ${e.message}`);
                    }
                }
                const fePkgPath = path.join(rootDir, 'projet-analyse-image-frontend', 'package.json');
                const bePkgPath = path.join(rootDir, 'backend', 'package.json');
                const changelogPath = path.join(rootDir, 'CHANGELOG.md');

                let version = null;
                let description = null;
                let source = null;

                const readJsonSafely = (p) => {
                    try {
                        if (fs.existsSync(p)) {
                            const txt = fs.readFileSync(p, 'utf8');
                            return JSON.parse(txt);
                        }
                    } catch (e) {
                        logger.warn(`Failed to read JSON at ${p}: ${e.message}`);
                    }
                    return null;
                };

                const fePkg = readJsonSafely(fePkgPath);
                if (fePkg && fePkg.version) {
                    version = fePkg.version;
                    description = fePkg.description || null;
                    source = 'frontend';
                }
                if (!version) {
                    const bePkg = readJsonSafely(bePkgPath);
                    if (bePkg && bePkg.version) {
                        version = bePkg.version;
                        description = description || bePkg.description || null;
                        source = source || 'backend';
                    }
                }

                // Parse changelog for the most recent released version
                let changelog = { version: null, date: null, summary: [] };
                try {
                    if (fs.existsSync(changelogPath)) {
                        const content = fs.readFileSync(changelogPath, 'utf8');
                        // Find first release header after Unreleased
                        const releaseRegex = /^## \[([^\]]+)\]\s*-\s*([^\n]+)$/m;
                        // Skip the first match if it's Unreleased; use exec in order
                        const lines = content.split(/\r?\n/);
                        let foundHeader = null;
                        for (let i = 0; i < lines.length; i++) {
                            const line = lines[i];
                            const m = line.match(/^## \[([^\]]+)\]\s*-\s*([^\n]+)$/);
                            if (m && m[1] && m[1].toLowerCase() !== 'unreleased') {
                                foundHeader = { idx: i, ver: m[1], date: m[2] };
                                break;
                            }
                        }
                        if (foundHeader) {
                            changelog.version = foundHeader.ver;
                            changelog.date = foundHeader.date;
                            // Collect bullet points until next release header
                            const bullets = [];
                            for (let j = foundHeader.idx + 1; j < lines.length; j++) {
                                const l = lines[j];
                                if (/^## \[/.test(l)) break; // next release section
                                const bulletMatch = /^\s*-\s+(.+)$/.exec(l);
                                if (bulletMatch) {
                                    bullets.push(bulletMatch[1].trim());
                                }
                            }
                            changelog.summary = bullets.slice(0, 6); // limit to 6 items
                        }
                    }
                } catch (e) {
                    logger.warn(`Failed to parse CHANGELOG.md: ${e.message}`);
                }

                res.json({
                    version: version || 'unknown',
                    description: description || 'BIOME - Bio Imaging Organization and Management Environment',
                    releaseDate: changelog.date || new Date().toISOString().slice(0,10),
                    source,
                    changelog
                });
            } catch (error) {
                logger.error('Error building app meta:', error);
                res.status(500).json({ error: 'Failed to read application metadata' });
            }
        });
    
    // Add shutdown endpoint
    app.post('/api/shutdown', async (req, res) => {
        logger.info('Shutdown request received, server will stop after response');
        res.json({ message: 'Server shutting down' });
        
        // Give time for the response to be sent before shutting down
        setTimeout(async () => {
            logger.info('Server shutting down now');
            
            try {
                // Close database connections gracefully
                if (dbManager && dbManager.db) {
                    logger.info('Closing database connections...');
                    await new Promise((resolve) => {
                        dbManager.db.close((err) => {
                            if (err) {
                                logger.error('Error closing database:', err);
                            } else {
                                logger.info('Database closed successfully');
                            }
                            resolve();
                        });
                    });
                }
                
                // Close the HTTP server
                if (server) {
                    logger.info('Closing HTTP server...');
                    server.close(() => {
                        logger.info('HTTP server closed');
                        process.exit(0);
                    });
                } else {
                    process.exit(0);
                }
                
            } catch (error) {
                logger.error('Error during shutdown:', error);
                process.exit(1);
            }
        }, 100);
    });

    // Start server
    server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        logger.info(`Server started on port ${PORT}`);
    });

    // Handle server shutdown gracefully
    process.on('SIGINT', () => {
        logger.info('SIGINT received, shutting down server...');
        server.close(() => {
            logger.info('Server shut down.');
            process.exit(0);
        });
    });

}).catch(err => {
    logger.error('Failed to connect to database:', err);
    console.error('Failed to connect to database:', err);
    // Don't exit the process, let the frontend handle the error
    console.log('Please use the database management interface to repair or reset the database.');
});

// Export the app for potential programmatic usage
module.exports = app;
