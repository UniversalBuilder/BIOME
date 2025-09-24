const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const os = require('os');
const { initializeDemoDatabase } = require('./demo-data');

class DatabaseManager {
    constructor() {
        // Use Tauri's app data directory if available, otherwise fall back to relative path
        this.dbPath = this.determineDatabasePath();
        this.dbDir = path.dirname(this.dbPath);
        this.db = null;
        
        console.log(`Database path set to: ${this.dbPath}`);
    }
    
    determineDatabasePath() {
        // If explicitly set via environment variable, use that
        if (process.env.DATABASE_PATH) {
            return process.env.DATABASE_PATH;
        }

        // For production Tauri app, use the app data directory
        if (process.env.TAURI_APP_DATA) {
            return path.join(process.env.TAURI_APP_DATA, 'biamanger', 'database.sqlite');
        }
        
        // For development, use app-specific folder in user's home directory for consistency
        if (process.env.NODE_ENV === 'production') {
            const appDataDir = process.platform === 'win32' 
                ? path.join(os.homedir(), 'AppData', 'Local', 'biamanger')
                : path.join(os.homedir(), '.biamanger');
            
            return path.join(appDataDir, 'database.sqlite');
        }
        
        // Default fallback for development
        return path.join(__dirname, '../../data/database.sqlite');
    }

    connect() {
        if (!fs.existsSync(this.dbDir)) {
            fs.mkdirSync(this.dbDir, { recursive: true });
        }

        const shouldInitialize = !fs.existsSync(this.dbPath);

        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, async (err) => {
                if (err) {
                    console.error('Error connecting to database:', err);
                    reject(err);
                    return;
                }
                
                console.log('Connected to SQLite database');
                
                try {
                    await this.run('PRAGMA foreign_keys = ON');

                    if (shouldInitialize) {
                        console.log('New database detected, initializing with demo data...');
                        await this.initDatabase();
                        await initializeDemoDatabase(this);
                    }
                    
                    resolve(this.db);
                } catch (initError) {
                    console.error('Error during database initialization:', initError);
                    reject(initError);
                }
            });
        });
    }

    async verifyDatabase() {
        const requiredTables = ['projects', 'users', 'groups', 'journal_entries', 'project_activities'];
        for (const table of requiredTables) {
            const row = await this.get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", [table]);
            if (!row) {
                throw new Error(`Database verification failed - missing table: ${table}`);
            }
        }
        return true;
    }

    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    console.error('Error in db.all:', err);
                    reject(err);
                    return;
                }
                resolve(rows);
            });
        });
    }

    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    console.error('Error in db.get:', err);
                    reject(err);
                    return;
                }
                resolve(row);
            });
        });
    }

    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    console.error('Error in db.run:', err);
                    reject(err);
                    return;
                }
                resolve({ lastID: this.lastID, changes: this.changes });
            });
        });
    }

    async initDatabase() {
        const schema = require('./schema');
        console.log('Initializing database schema...');
        try {
            await this.run('BEGIN TRANSACTION');
            
            for (const statement of schema) {
                await this.run(statement);
            }
            
            await this.run('COMMIT');
            console.log('Database schema initialized successfully');
        } catch (err) {
            await this.run('ROLLBACK');
            console.error('Error initializing database schema:', err);
            throw err;
        }
    }

    async resetDatabase() {
        try {
            // Close current connection
            if (this.db) {
                await new Promise((resolve, reject) => {
                    this.db.close((err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
            }

            // Delete the database file
            if (fs.existsSync(this.dbPath)) {
                console.log('Existing database deleted');
                fs.unlinkSync(this.dbPath);
            }

            // Create a new connection and initialize
            await this.connect();
            
            return true;
        } catch (err) {
            console.error('Error resetting database:', err);
            throw err;
        }
    }

    getDatabasePath() {
        return this.dbPath;
    }

    async initializeSampleData() {
        try {
            console.log('Initializing demo database with bioimage analysis projects...');
            await initializeDemoDatabase(this);
            console.log('Demo database initialization completed successfully!');
        } catch (err) {
            console.error('Error initializing demo data:', err);
            throw err;
        }
    }

    importDatabase(req) {
        return new Promise((resolve, reject) => {
            // Close existing connection
            if (this.db) {
                this.db.close();
            }

            // Create write stream for the temporary file
            const tempPath = this.dbPath + '.tmp';
            const writeStream = fs.createWriteStream(tempPath);

            req.on('error', (err) => {
                console.error('Error receiving file:', err);
                fs.unlinkSync(tempPath);
                reject(err);
            });

            writeStream.on('error', (err) => {
                console.error('Error writing file:', err);
                fs.unlinkSync(tempPath);
                reject(err);
            });

            writeStream.on('finish', async () => {
                try {
                    // Verify the imported file is a valid SQLite database
                    const tempDb = new sqlite3.Database(tempPath);
                    await new Promise((resolve, reject) => {
                        tempDb.get("SELECT name FROM sqlite_master WHERE type='table'", (err) => {
                            tempDb.close();
                            if (err) {
                                fs.unlinkSync(tempPath);
                                reject(new Error('Invalid SQLite database file'));
                                return;
                            }
                            resolve();
                        });
                    });

                    // Replace the existing database with the new one
                    if (fs.existsSync(this.dbPath)) {
                        fs.unlinkSync(this.dbPath);
                    }
                    fs.renameSync(tempPath, this.dbPath);

                    // Reconnect to the new database
                    await this.connect();
                    resolve();
                } catch (err) {
                    if (fs.existsSync(tempPath)) {
                        fs.unlinkSync(tempPath);
                    }
                    reject(err);
                }
            });

            req.pipe(writeStream);
        });
    }
}

const dbManager = new DatabaseManager();
module.exports = dbManager;
