/*
 * BIOME Demo Database Initialization
 * Creates realistic sample data for bioimage analysis projects
 * Updated for v1.1.0 with enhanced project fields and JSON array handling
 */

const demoGroups = [
    { 
        name: 'Confocal Microscopy Core', 
        description: 'Advanced confocal and multiphoton imaging facility' 
    },
    { 
        name: 'Widefield Imaging Center', 
        description: 'High-throughput fluorescence and brightfield imaging' 
    },
    { 
        name: 'Digital Pathology Unit', 
        description: 'Slide scanning and whole slide image analysis' 
    }
];

const demoUsers = [
    { name: 'Dr. Sarah Chen', email: 'sarah.chen@facility.edu', group_id: 1 },
    { name: 'Michael Rodriguez', email: 'm.rodriguez@facility.edu', group_id: 1 },
    { name: 'Dr. Emma Thompson', email: 'e.thompson@facility.edu', group_id: 2 },
    { name: 'James Wilson', email: 'j.wilson@facility.edu', group_id: 2 },
    { name: 'Dr. Lisa Park', email: 'l.park@facility.edu', group_id: 3 },
    { name: 'Alex Kumar', email: 'a.kumar@facility.edu', group_id: 3 }
];

const demoProjects = [
    // Confocal Microscopy Projects
    {
        name: '3D Neuronal Network Reconstruction',
        description: 'High-resolution confocal imaging of neuronal networks in brain organoids for 3D reconstruction analysis using Imaris. Focus on dendritic spine morphology and synaptic connectivity patterns.',
        status: 'Active',
        software: 'Imaris',
        time_spent_minutes: 2340, // 39 hours
        creation_date: '2024-11-15 09:30:00',
        last_updated: '2025-01-20 14:22:00',
        start_date: '2024-11-15',
        project_path: '/projects/confocal/neuronal-network-3d',
        folder_created: 1,
        user_id: 1,
        image_types: '["confocal microscopy"]',
        sample_type: '["whole organ / animal"]',
        objective_magnification: '63x oil immersion',
        analysis_goal: '["3D reconstruction", "object morphometry"]'
    },
    {
        name: 'Live Cell Calcium Dynamics',
        description: 'Time-lapse confocal microscopy of calcium signaling in cardiomyocytes. Measuring calcium wave propagation and frequency analysis for cardiac function studies.',
        status: 'Completed',
        software: 'Fiji',
        time_spent_minutes: 1680, // 28 hours
        creation_date: '2024-10-08 10:15:00',
        last_updated: '2024-12-03 16:45:00',
        start_date: '2024-10-08',
        project_path: '/projects/confocal/calcium-dynamics',
        folder_created: 1,
        user_id: 2,
        image_types: '["time lapse microscopy", "confocal microscopy"]',
        sample_type: '["cells in multiwell plates"]',
        objective_magnification: '40x water immersion',
        analysis_goal: '["intensity measurement"]'
    },
    {
        name: 'Mitochondrial Dynamics Analysis',
        description: 'Super-resolution confocal analysis of mitochondrial morphology and dynamics in response to oxidative stress. Tracking mitochondrial fusion and fission events.',
        status: 'Active',
        software: 'Imaris',
        time_spent_minutes: 1920, // 32 hours
        creation_date: '2025-01-05 08:45:00',
        last_updated: '2025-01-22 11:30:00',
        start_date: '2025-01-05',
        project_path: '/projects/confocal/mitochondrial-dynamics',
        folder_created: 1,
        user_id: 1,
        image_types: '["super resolution microscopy", "confocal microscopy"]',
        sample_type: '["cells on slides"]',
        objective_magnification: '100x oil immersion',
        analysis_goal: '["object morphometry"]'
    },
    
    // Widefield Microscopy Projects
    {
        name: 'High-Throughput Cell Counting Pipeline',
        description: 'Automated batch processing of fluorescent cell images for quantitative analysis. Development of FIJI/ImageJ macros for standardized cell counting across multiple experimental conditions.',
        status: 'Active',
        software: 'CellProfiler',
        time_spent_minutes: 2760, // 46 hours
        creation_date: '2024-12-01 13:20:00',
        last_updated: '2025-01-21 15:10:00',
        start_date: '2024-12-01',
        project_path: '/projects/widefield/cell-counting-pipeline',
        folder_created: 1,
        user_id: 3,
        image_types: '["widefield fluorescence microscopy", "high content screening"]',
        sample_type: '["cells in multiwell plates"]',
        objective_magnification: '20x air',
        analysis_goal: '["object counting"]'
    },
    {
        name: 'Fluorescence Intensity Quantification',
        description: 'Systematic analysis of protein expression levels using widefield fluorescence microscopy. Measuring signal intensity, background correction, and statistical analysis across treatment groups.',
        status: 'Review',
        software: 'Fiji',
        time_spent_minutes: 840, // 14 hours
        creation_date: '2025-01-18 09:00:00',
        last_updated: '2025-01-22 10:15:00',
        start_date: '2025-01-20',
        project_path: '/projects/widefield/fluorescence-quantification',
        folder_created: 1,
        user_id: 4,
        image_types: '["widefield fluorescence microscopy"]',
        sample_type: '["tissue slices"]',
        objective_magnification: '10x and 40x air',
        analysis_goal: '["intensity measurement"]'
    },
    {
        name: 'Drug Screening Assay Analysis',
        description: 'Large-scale analysis of cell viability and morphology changes in response to drug treatments. Processing 384-well plate imaging data for dose-response curves.',
        status: 'Completed',
        software: 'CellProfiler',
        time_spent_minutes: 3600, // 60 hours
        creation_date: '2024-09-15 11:30:00',
        last_updated: '2024-11-28 14:20:00',
        start_date: '2024-09-15',
        project_path: '/projects/widefield/drug-screening',
        folder_created: 1,
        user_id: 3,
        image_types: '["high content screening", "widefield fluorescence microscopy"]',
        sample_type: '["cells in multiwell plates"]',
        objective_magnification: '10x air',
        analysis_goal: '["object classification", "object counting"]'
    },
    
    // Digital Pathology Projects
    {
        name: 'Tissue Classification with QuPath',
        description: 'Machine learning-based classification of tissue regions in H&E stained whole slide images using QuPath. Training classifiers for tumor, stroma, and necrotic regions identification.',
        status: 'Active',
        software: 'QuPath',
        time_spent_minutes: 4200, // 70 hours
        creation_date: '2024-10-22 14:45:00',
        last_updated: '2025-01-21 16:30:00',
        start_date: '2024-10-22',
        project_path: '/projects/pathology/tissue-classification',
        folder_created: 1,
        user_id: 5,
        image_types: '["slide scanning"]',
        sample_type: '["tissue slices"]',
        objective_magnification: 'Slide scanner (multi-resolution)',
        analysis_goal: '["object classification"]'
    },
    {
        name: 'Whole Slide IHC Quantification',
        description: 'Quantitative analysis of immunohistochemistry staining across entire tissue sections. Measuring positive cell percentages and staining intensity distribution using digital pathology tools.',
        status: 'On Hold',
        software: 'QuPath',
        time_spent_minutes: 2880, // 48 hours
        creation_date: '2024-11-30 08:15:00',
        last_updated: '2025-01-20 13:45:00',
        start_date: '2024-11-30',
        project_path: '/projects/pathology/ihc-quantification',
        folder_created: 1,
        user_id: 6,
        image_types: '["slide scanning"]',
        sample_type: '["tissue slices"]',
        objective_magnification: 'Slide scanner (20x equivalent)',
        analysis_goal: '["intensity measurement", "object counting"]'
    },
    {
        name: 'Tumor Microenvironment Mapping',
        description: 'Spatial analysis of immune cell infiltration in tumor samples using multiplex immunofluorescence whole slide imaging. Characterizing cell-cell interactions and spatial relationships.',
        status: 'Preparing',
        software: 'Fiji',
        time_spent_minutes: 1560, // 26 hours
        creation_date: '2025-01-10 12:00:00',
        last_updated: '2025-01-22 09:20:00',
        start_date: '2025-01-15',
        project_path: '/projects/pathology/tumor-microenvironment',
        folder_created: 1,
        user_id: 5,
        image_types: '["slide scanning", "widefield fluorescence microscopy"]',
        sample_type: '["tissue slices"]',
        objective_magnification: 'Slide scanner (40x equivalent)',
        analysis_goal: '["object classification", "intensity measurement"]'
    },
    {
        name: 'Automated Particle Analysis Workflow',
        description: 'Development of automated particle counting and size analysis pipeline for nanoparticle characterization. Project discontinued due to equipment limitations and budget constraints.',
        status: 'Cancelled',
        software: 'ImageJ',
        time_spent_minutes: 720, // 12 hours
        creation_date: '2024-09-01 10:00:00',
        last_updated: '2024-10-15 16:30:00',
        start_date: '2024-09-01',
        project_path: '/projects/widefield/particle-analysis',
        folder_created: 1,
        user_id: 4,
        image_types: '["widefield microscopy"]',
        sample_type: '["other"]',
        objective_magnification: '40x air',
        analysis_goal: '["object counting", "object morphometry"]'
    }
];

const demoJournalEntries = [
    // Neuronal Network Project
    { project_id: 1, entry_text: 'Project initiated. Set up confocal imaging protocol for brain organoids. Optimized staining conditions for MAP2 and synaptophysin.', entry_date: '2024-11-15 10:00:00' },
    { project_id: 1, entry_text: 'Completed first round of imaging. Acquired 15 z-stacks with 0.2μm step size. Image quality excellent with minimal photobleaching.', entry_date: '2024-11-20 14:30:00' },
    { project_id: 1, entry_text: 'Started 3D reconstruction in Imaris. Created surface renderings for dendrites and spine detection algorithms are working well.', entry_date: '2024-12-05 11:15:00' },
    { project_id: 1, entry_text: 'Quantified 1,247 dendritic spines across 8 neurons. Spine density measurements completed. Moving to connectivity analysis.', entry_date: '2025-01-10 16:45:00' },
    { project_id: 1, entry_text: 'Updated analysis pipeline with new spine classification criteria. Added mushroom, stubby, and thin spine categories.', entry_date: '2025-01-20 14:22:00' },
    
    // Calcium Dynamics Project  
    { project_id: 2, entry_text: 'Live imaging setup optimized. Cells loaded with Fluo-4 AM. Temperature and CO2 control stable throughout recordings.', entry_date: '2024-10-08 11:00:00' },
    { project_id: 2, entry_text: 'Recorded calcium responses to electrical stimulation. 30 cells tracked over 10-minute periods. Clear propagating waves observed.', entry_date: '2024-10-15 15:20:00' },
    { project_id: 2, entry_text: 'Developed MATLAB script for automated wave detection and frequency analysis. Processing 50+ time-lapse movies.', entry_date: '2024-11-02 13:45:00' },
    { project_id: 2, entry_text: 'Statistical analysis completed. Found significant differences in wave frequency between control and treated groups (p<0.001).', entry_date: '2024-11-28 10:30:00' },
    { project_id: 2, entry_text: 'Project completed. Results compiled for manuscript. All data archived and analysis scripts documented.', entry_date: '2024-12-03 16:45:00' },
    
    // Cell Counting Pipeline
    { project_id: 4, entry_text: 'Started developing automated cell counting pipeline. Testing different segmentation algorithms in FIJI.', entry_date: '2024-12-01 14:00:00' },
    { project_id: 4, entry_text: 'Implemented watershed segmentation with size filtering. Achieving 95% accuracy compared to manual counts on test images.', entry_date: '2024-12-15 11:30:00' },
    { project_id: 4, entry_text: 'Created batch processing macro for 96-well plate analysis. Processed 2,304 images in 4 hours vs 3 days manually.', entry_date: '2025-01-08 16:00:00' },
    { project_id: 4, entry_text: 'Added quality control metrics and automated report generation. Pipeline ready for validation on new datasets.', entry_date: '2025-01-21 15:10:00' },
    
    // Tissue Classification
    { project_id: 7, entry_text: 'Project setup in QuPath completed. Imported 45 H&E whole slide images for training dataset preparation.', entry_date: '2024-10-22 15:30:00' },
    { project_id: 7, entry_text: 'Manually annotated tumor, stroma, and necrotic regions on 20 training slides. Created pixel classifier training data.', entry_date: '2024-11-10 12:45:00' },
    { project_id: 7, entry_text: 'Trained random forest classifier achieving 92% accuracy on validation set. Fine-tuning hyperparameters.', entry_date: '2024-12-18 14:20:00' },
    { project_id: 7, entry_text: 'Applied classifier to remaining 25 slides. Extracting morphometric features for each tissue class.', entry_date: '2025-01-15 10:15:00' },
    // Particle Analysis Project (Cancelled)
    { project_id: 10, entry_text: 'Project initiated. Setup automated particle detection pipeline using ImageJ. Initial testing with standard particles.', entry_date: '2024-09-01 11:00:00' },
    { project_id: 10, entry_text: 'Developed macro for automated particle counting. Tested on various particle sizes with good accuracy.', entry_date: '2024-09-15 14:30:00' },
    { project_id: 10, entry_text: 'Project cancelled due to equipment upgrade requirements and budget limitations. Analysis pipeline archived.', entry_date: '2024-10-15 16:30:00' }
];

const demoActivities = [
    // Recent activities across projects
    { project_id: 1, activity_type: 'status_update', activity_date: '2025-01-22 09:15:00', details: 'Status changed to Active', changed_fields: 'status' },
    { project_id: 1, activity_type: 'time_update', activity_date: '2025-01-20 14:22:00', details: 'Added 2.5 hours of analysis time', changed_fields: 'time_spent_minutes' },
    { project_id: 3, activity_type: 'project_update', activity_date: '2025-01-22 11:30:00', details: 'Updated project description and methodology', changed_fields: 'description,last_updated' },
    { project_id: 4, activity_type: 'time_update', activity_date: '2025-01-21 15:10:00', details: 'Added 4 hours for pipeline optimization', changed_fields: 'time_spent_minutes' },
    { project_id: 7, activity_type: 'project_update', activity_date: '2025-01-21 16:30:00', details: 'Added feature extraction scripts', changed_fields: 'description,last_updated' },
    { project_id: 8, activity_type: 'status_update', activity_date: '2025-01-20 13:45:00', details: 'Status changed to On Hold - waiting for clinical samples', changed_fields: 'status' },
    { project_id: 9, activity_type: 'status_update', activity_date: '2025-01-22 09:20:00', details: 'Status changed to Preparing', changed_fields: 'status' },
    { project_id: 5, activity_type: 'status_update', activity_date: '2025-01-22 10:15:00', details: 'Status changed to Review - analysis complete, awaiting feedback', changed_fields: 'status' },
    { project_id: 10, activity_type: 'status_update', activity_date: '2024-10-15 16:30:00', details: 'Project cancelled due to equipment and budget constraints', changed_fields: 'status' }
];

async function initializeDemoDatabase(db) {
    try {
        await db.run('BEGIN TRANSACTION');
        
        // Clear existing data
        await db.run('DELETE FROM project_activities');
        await db.run('DELETE FROM journal_entries');
        await db.run('DELETE FROM projects');
        await db.run('DELETE FROM users');
        await db.run('DELETE FROM groups');
        await db.run('DELETE FROM sqlite_sequence');

        console.log('Initializing demo database with bioimage analysis projects...');

        // Insert demo groups
        for (const group of demoGroups) {
            await db.run(
                'INSERT INTO groups (name, description) VALUES (?, ?)',
                [group.name, group.description]
            );
        }
        console.log(`Inserted ${demoGroups.length} facility groups`);

        // Insert demo users
        for (const user of demoUsers) {
            await db.run(
                'INSERT INTO users (name, email, group_id) VALUES (?, ?, ?)',
                [user.name, user.email, user.group_id]
            );
        }
        console.log(`Inserted ${demoUsers.length} demo users`);

        // Insert demo projects
        for (const project of demoProjects) {
            await db.run(
                `INSERT INTO projects (
                    name, description, status, software, time_spent_minutes,
                    creation_date, last_updated, start_date, project_path,
                    folder_created, user_id, image_types, sample_type,
                    objective_magnification, analysis_goal
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    project.name, project.description, project.status, project.software,
                    project.time_spent_minutes, project.creation_date, project.last_updated,
                    project.start_date, project.project_path, project.folder_created,
                    project.user_id, project.image_types, project.sample_type,
                    project.objective_magnification, project.analysis_goal
                ]
            );
        }
        console.log(`Inserted ${demoProjects.length} bioimage analysis projects`);

        // Insert demo journal entries
        for (const entry of demoJournalEntries) {
            await db.run(
                'INSERT INTO journal_entries (project_id, entry_text, entry_date) VALUES (?, ?, ?)',
                [entry.project_id, entry.entry_text, entry.entry_date]
            );
        }
        console.log(`Inserted ${demoJournalEntries.length} journal entries`);

        // Insert demo activities
        for (const activity of demoActivities) {
            await db.run(
                'INSERT INTO project_activities (project_id, activity_type, activity_date, details, changed_fields) VALUES (?, ?, ?, ?, ?)',
                [activity.project_id, activity.activity_type, activity.activity_date, activity.details, activity.changed_fields]
            );
        }
        console.log(`Inserted ${demoActivities.length} project activities`);

        await db.run('COMMIT');
        console.log('Demo database initialization completed successfully!');
        console.log('\nDemo data includes:');
        console.log('- 3 imaging facility cores (Confocal, Widefield, Digital Pathology)');
        console.log('- 6 facility staff members');
        console.log('- 10 realistic bioimage analysis projects');
        console.log('- Confocal: 3D reconstruction, live cell imaging, super-resolution');
        console.log('- Widefield: high-throughput analysis, batch processing, drug screening');
        console.log('- Digital Pathology: tissue classification, IHC quantification, spatial analysis');
        console.log('- Sample journal entries and activity logs');
        
    } catch (error) {
        await db.run('ROLLBACK');
        console.error('Error initializing demo database:', error);
        throw error;
    }
}

module.exports = {
    initializeDemoDatabase,
    demoGroups,
    demoUsers,
    demoProjects,
    demoJournalEntries,
    demoActivities
};
