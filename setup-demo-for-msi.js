const fs = require('fs');
const path = require('path');
const DatabaseManager = require('./backend/src/database/db');

async function setupDemoDatabase() {
    console.log('🗄️ Setting up fresh demo database for MSI distribution...');
    
    // Ensure data directories exist
    const backendDataDir = path.join(__dirname, 'backend', 'data');
    const tauriDataDir = path.join(__dirname, 'projet-analyse-image-frontend', 'src-tauri', 'resources', 'backend', 'data');
    
    if (!fs.existsSync(backendDataDir)) {
        fs.mkdirSync(backendDataDir, { recursive: true });
        console.log('✅ Created backend data directory');
    }
    
    if (!fs.existsSync(tauriDataDir)) {
        fs.mkdirSync(tauriDataDir, { recursive: true });
        console.log('✅ Created Tauri resources data directory');
    }
    
    // Remove any existing database files
    const backendDb = path.join(backendDataDir, 'database.sqlite');
    const tauriDb = path.join(tauriDataDir, 'database.sqlite');
    
    [backendDb, tauriDb].forEach(dbPath => {
        if (fs.existsSync(dbPath)) {
            fs.unlinkSync(dbPath);
            console.log(`🗑️ Removed old database: ${dbPath}`);
        }
        // Also remove WAL and SHM files
        [`${dbPath}-wal`, `${dbPath}-shm`].forEach(file => {
            if (fs.existsSync(file)) {
                fs.unlinkSync(file);
                console.log(`🗑️ Removed: ${file}`);
            }
        });
    });
    
    try {
        // Initialize empty database schema in backend
        console.log('🚀 Initializing empty database schema in backend...');
        const backendDbManager = DatabaseManager;
        // Set the database path manually
        backendDbManager.dbPath = backendDb;
        await backendDbManager.connect();
        console.log('✅ Backend database (empty schema) initialized successfully');
        
        // Copy the initialized database to Tauri resources
        console.log('📁 Copying database to Tauri resources...');
        fs.copyFileSync(backendDb, tauriDb);
        console.log('✅ Database copied to Tauri resources');
        
        console.log('🎉 Database setup completed successfully!');
        console.log('📊 MSI ships with an empty database — users start fresh.');
        console.log('   Use the "Load Demo Data" button in the Database page to populate with sample data.');
        
    } catch (error) {
        console.error('❌ Error setting up database:', error);
        process.exit(1);
    }
}

// Run the setup
setupDemoDatabase().then(() => {
    console.log('✨ Ready for MSI build with a clean, empty database!');
    process.exit(0);
});
