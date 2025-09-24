#!/usr/bin/env node

/*
 * BIOME Demo Database Setup Script
 * Clears existing database and initializes with demo data
 */

const path = require('path');
const fs = require('fs');

// Clear existing database files
const dataDir = path.join(__dirname, 'backend', 'data');
const databaseFiles = [
    path.join(dataDir, 'database.sqlite'),
    path.join(dataDir, 'database.sqlite-wal'),
    path.join(dataDir, 'database.sqlite-shm'),
    path.join(dataDir, 'database.sqlite.tmp')
];

console.log('🧹 Clearing existing database files...');
console.log(`📁 Looking in: ${dataDir}`);

let filesRemoved = 0;
databaseFiles.forEach(file => {
    if (fs.existsSync(file)) {
        try {
            fs.unlinkSync(file);
            console.log(`   ✓ Removed ${path.basename(file)}`);
            filesRemoved++;
        } catch (error) {
            console.log(`   ⚠️  Could not remove ${path.basename(file)} - file may be in use`);
            console.log(`      Stop the backend server first, then run this script again`);
        }
    }
});

if (filesRemoved === 0) {
    console.log('   ℹ️  No database files found (already clean)');
}

console.log('\n🎯 Database cleared! Next backend startup will initialize with demo data.');
console.log('\n📋 Demo data includes:');
console.log('  • 3 Imaging Facility Cores');
console.log('  • 6 Facility Staff Members');
console.log('  • 9 Realistic Bioimage Analysis Projects:');
console.log('    - Confocal: 3D reconstruction, live imaging, super-resolution');
console.log('    - Widefield: high-throughput analysis, batch processing');
console.log('    - Digital Pathology: tissue classification, IHC quantification');
console.log('  • Journal entries and activity logs');
console.log('\n🚀 Next steps:');
console.log('  1. Run: cd projet-analyse-image-frontend');
console.log('  2. Run: npm run start-both');
console.log('  3. Open: http://localhost:3000');
console.log('\n✨ Enjoy the demo data!');
