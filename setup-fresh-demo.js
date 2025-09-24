const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Helper function to copy directories recursively
function copyDirectorySync(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        // Skip logs directories to avoid including old log files
        if (entry.name === 'logs') {
            continue;
        }
        
        if (entry.isDirectory()) {
            copyDirectorySync(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

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
    
    console.log('🗑️ Cleaning old database files...');
    [backendDb, tauriDb].forEach(dbPath => {
        if (fs.existsSync(dbPath)) {
            fs.unlinkSync(dbPath);
            console.log(`   Removed: ${dbPath}`);
        }
        // Also remove WAL and SHM files
        [`${dbPath}-wal`, `${dbPath}-shm`].forEach(file => {
            if (fs.existsSync(file)) {
                fs.unlinkSync(file);
                console.log(`   Removed: ${file}`);
            }
        });
    });
    
    try {
        console.log('🚀 Starting backend server to initialize demo database...');
        
        // Start backend server to initialize database
        const server = spawn('node', ['src/server.js'], {
            cwd: path.join(__dirname, 'backend'),
            stdio: 'inherit'
        });
        
        // Wait for server to initialize
        await new Promise((resolve) => {
            setTimeout(() => {
                server.kill('SIGTERM');
                console.log('🛑 Backend server stopped');
                resolve();
            }, 8000); // Wait 8 seconds for initialization
        });
        
        // Wait a bit more for file operations to complete
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Copy the entire backend to Tauri resources
        console.log('📁 Copying complete backend to Tauri resources...');
        const tauriBackendDir = path.join(__dirname, 'projet-analyse-image-frontend', 'src-tauri', 'resources', 'backend');
        
        // Remove existing backend resources
        if (fs.existsSync(tauriBackendDir)) {
            fs.rmSync(tauriBackendDir, { recursive: true, force: true });
            console.log('   Removed old backend resources');
        }
        
        // Copy the entire backend directory
        copyDirectorySync(path.join(__dirname, 'backend'), tauriBackendDir);
        console.log('✅ Complete backend copied to Tauri resources (including node_modules)');
        
        if (fs.existsSync(backendDb) && fs.existsSync(path.join(tauriBackendDir, 'data', 'database.sqlite'))) {
            console.log('🎉 Demo database setup completed successfully!');
            console.log('📊 Fresh demo data is now ready for MSI build');
        } else {
            throw new Error('Backend database was not created or copied properly');
        }
        
    } catch (error) {
        console.error('❌ Error setting up demo database:', error);
        process.exit(1);
    }
}

// Run the setup
setupDemoDatabase().then(() => {
    console.log('✨ Ready for MSI build with fresh demo data!');
    process.exit(0);
}).catch(error => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
});
