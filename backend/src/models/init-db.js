const sampleGroups = [
    { name: 'Research Team' },
    { name: 'Development Team' },
    { name: 'Analysis Team' }
];

const sampleUsers = [
    { name: 'John Doe', email: 'john@example.com', group_id: 1 },
    { name: 'Jane Smith', email: 'jane@example.com', group_id: 1 },
    { name: 'Bob Wilson', email: 'bob@example.com', group_id: 2 },
    { name: 'Alice Brown', email: 'alice@example.com', group_id: 3 }
];

async function initializeSampleData(db) {
    try {
        // Insert sample groups
        for (const group of sampleGroups) {
            await db.run('INSERT INTO groups (name) VALUES (?)', [group.name]);
            console.log('Inserted group:', group.name);
        }
        
        // Insert sample users
        for (const user of sampleUsers) {
            await db.run(
                'INSERT INTO users (name, email, group_id) VALUES (?, ?, ?)',
                [user.name, user.email, user.group_id]
            );
            console.log('Inserted user:', user.name);
        }
    } catch (error) {
        console.error('Error initializing sample data:', error);
        throw error;
    }
}

module.exports = {
    initializeSampleData
};
