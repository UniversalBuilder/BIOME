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
        // Initialize demo database in backend
        console.log('🚀 Initializing demo database in backend...');
        const backendDbManager = DatabaseManager;
        // Set the database path manually
        backendDbManager.dbPath = backendDb;
        await backendDbManager.connect();
        await backendDbManager.resetDatabase();
        console.log('✅ Backend demo database initialized successfully');
        
        // Copy the initialized database to Tauri resources
        console.log('📁 Copying database to Tauri resources...');
        fs.copyFileSync(backendDb, tauriDb);
        console.log('✅ Database copied to Tauri resources');
        
        console.log('🎉 Demo database setup completed successfully!');
        console.log('📊 Database includes:');
        console.log('   • 3 imaging facility cores');
        console.log('   • 6 demo users');  
        console.log('   • 9 bioimage analysis projects');
        console.log('   • Journal entries and project activities');
        
    } catch (error) {
        console.error('❌ Error setting up demo database:', error);
        process.exit(1);
    }
}

// Run the setup
setupDemoDatabase().then(() => {
    console.log('✨ Ready for MSI build with fresh demo data!');
    process.exit(0);
});
