const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const fsp = fs.promises;
const archiver = require('archiver');
const { v4: uuidv4 } = require('uuid');
const os = require('os');

// Ensure the temporary directory exists
const tempDir = path.join(os.tmpdir(), 'biome-temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

/**
 * Create project folder structure and return as ZIP file
 * This endpoint creates a project folder structure for web users
 * and returns it as a downloadable ZIP file
 */
router.post('/create-structure', async (req, res) => {
    try {
        const { projectName, projectDescription, folderName } = req.body;

        if (!projectName) {
            return res.status(400).json({ error: 'Project name is required' });
        }

        // Create a unique folder name if not provided
        const uniqueFolderName = folderName || `${new Date().toISOString().split('T')[0]}_${projectName.replace(/[^a-z0-9]/gi, '_')}`;
        
        // Create a unique temporary directory for this operation
        const sessionId = uuidv4();
        const sessionDir = path.join(tempDir, sessionId);
        const projectDir = path.join(sessionDir, uniqueFolderName);
        
        // Create the directory structure
        await fsp.mkdir(projectDir, { recursive: true });
        
        // Create bioimage analysis folder structure
        const bioImageFolders = [
            { folder: 'request', subfolders: ['documents', 'images', 'notes'] },
            { folder: 'sample_data', subfolders: ['original', 'test_subset'] },
            { folder: 'processed_data', subfolders: ['converted', 'preprocessed', 'intermediate'] },
            { folder: 'references', subfolders: ['articles', 'protocols', 'manuals'] },
            { folder: 'scripts', subfolders: [] },
            { folder: 'results', subfolders: ['analysis_results', 'tutorials', 'protocols', 'examples'] }
        ];

        for(const { folder, subfolders } of bioImageFolders) {
            const folderPath = path.join(projectDir, folder);
            await fsp.mkdir(folderPath);
            
            // Create main folder description
            let description;
            switch(folder) {
                case 'request':
                    description = 'Contains the initial user request and supporting documentation';
                    break;
                case 'sample_data':
                    description = 'Contains the raw biological images provided for analysis';
                    break;
                case 'processed_data':
                    description = 'Contains intermediate processing results';
                    break;
                case 'references':
                    description = 'Contains scientific and technical documentation';
                    break;
                case 'scripts':
                    description = 'Contains all analysis code and automation scripts. Place your analysis pipelines, custom functions, and batch processing code here.';
                    break;
                case 'results':
                    description = 'Contains final outputs and deliverables';
                    break;
                default:
                    description = `Directory for ${folder}`;
            }
            
            await fsp.writeFile(
                path.join(folderPath, 'README.txt'), 
                description
            );
            
            // Create subfolders if any
            for(const subfolder of subfolders) {
                const subfolderPath = path.join(folderPath, subfolder);
                await fsp.mkdir(subfolderPath);
                
                // Add descriptive placeholder for each subfolder
                let subDescription;
                switch(`${folder}/${subfolder}`) {
                    case 'request/documents':
                        subDescription = 'Project specifications, requirements, and communication files';
                        break;
                    case 'request/images':
                        subDescription = 'Reference images from the initial request';
                        break;
                    case 'request/notes':
                        subDescription = 'Project planning and meeting notes';
                        break;
                    case 'sample_data/original':
                        subDescription = 'Original unmodified images from the biological sample';
                        break;
                    case 'sample_data/test_subset':
                        subDescription = 'Small subset of images for testing analysis pipelines';
                        break;
                    case 'processed_data/converted':
                        subDescription = 'Format-converted images (e.g., TIFF to other formats)';
                        break;
                    case 'processed_data/preprocessed':
                        subDescription = 'Images after initial processing (denoising, calibration)';
                        break;
                    case 'processed_data/intermediate':
                        subDescription = 'Temporary analysis files and intermediate results';
                        break;
                    case 'references/articles':
                        subDescription = 'Relevant scientific papers and literature';
                        break;
                    case 'references/protocols':
                        subDescription = 'Analysis protocols and methodology documentation';
                        break;
                    case 'references/manuals':
                        subDescription = 'Software manuals and technical guides';
                        break;
                    case 'results/analysis_results':
                        subDescription = 'Final quantitative results, measurements, and statistics';
                        break;
                    case 'results/tutorials':
                        subDescription = 'Step-by-step guides for reproducing the analysis';
                        break;
                    case 'results/protocols':
                        subDescription = 'Finalized analysis protocols for future use';
                        break;
                    case 'results/examples':
                        subDescription = 'Example outputs and sample results';
                        break;
                    default:
                        subDescription = `Files for ${subfolder}`;
                }
                
                await fsp.writeFile(
                    path.join(subfolderPath, 'README.txt'), 
                    subDescription
                );
            }
        }
        
        // Create README.txt
        const readmeContent = `PROJECT: ${projectName}
DATE: ${new Date().toISOString().split('T')[0]}
DESCRIPTION: ${projectDescription || 'No description provided'}

This bioimage analysis project folder structure was generated by BIOME (Bio Imaging Organization and Management Environment).

PROJECT STRUCTURE:

🎯 request/
Contains the initial user request and supporting documentation
- documents/: Project specifications, requirements, and communication
- images/: Reference images from the initial request
- notes/: Project planning and meeting notes

🔬 sample_data/
Contains the raw biological images provided for analysis
- original/: Original unmodified images from the biological sample
- test_subset/: Small subset of images for testing analysis pipelines

⚙️ processed_data/
Contains intermediate processing results
- converted/: Format-converted images (e.g., TIFF to other formats)
- preprocessed/: Images after initial processing (denoising, calibration)
- intermediate/: Temporary analysis files and intermediate results

📚 references/
Contains scientific and technical documentation
- articles/: Relevant scientific papers and literature
- protocols/: Analysis protocols and methodology documentation
- manuals/: Software manuals and technical guides

💻 scripts/
Contains all analysis code and automation scripts
- Analysis pipelines and image processing scripts
- Custom functions and utilities
- Batch processing and automation code

📊 results/
Contains final outputs and deliverables
- analysis_results/: Final quantitative results, measurements, and statistics
- tutorials/: Step-by-step guides for reproducing the analysis
- protocols/: Finalized analysis protocols for future use
- examples/: Example outputs and sample results

USAGE NOTES:
1. Place your raw images in sample_data/original/
2. Use sample_data/test_subset/ for pipeline development
3. Save intermediate processing steps in processed_data/
4. Document your methodology in references/protocols/
5. Place final results and reports in results/analysis_results/
`;
        await fsp.writeFile(path.join(projectDir, 'README.txt'), readmeContent);
        
        // Create journal.md
        const journalContent = `# Project Journal: ${projectName}

## Overview
${projectDescription || 'No description provided'}

## Journal Entries

### ${new Date().toISOString().split('T')[0]} - Project Created
Initial project structure created.
`;
        await fsp.writeFile(path.join(projectDir, 'journal.md'), journalContent);
        
        // Create ZIP archive
        const zipPath = path.join(sessionDir, `${uniqueFolderName}.zip`);
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', {
            zlib: { level: 9 }
        });
        
        archive.pipe(output);
        
        // Add the project directory to the archive
        archive.directory(projectDir, uniqueFolderName);
        
        // Finalize the archive
        await archive.finalize();
        
        // Wait for the archive to be written
        await new Promise((resolve) => {
            output.on('close', resolve);
        });
        
        // Send the ZIP file
        res.download(zipPath, `${uniqueFolderName}.zip`, (err) => {
            if (err) {
                console.error('Error sending ZIP file:', err);
            }
            
            // Clean up temporary files
            try {
                fs.rmSync(sessionDir, { recursive: true, force: true });
            } catch (cleanupErr) {
                console.error('Error cleaning up temporary files:', cleanupErr);
            }
        });
        
    } catch (error) {
        console.error('Error creating project structure:', error);
        res.status(500).json({
            error: 'Failed to create project structure',
            details: error.message
        });
    }
});

/**
 * Validate project folder structure
 * This endpoint checks if a folder has a valid project structure
 * (This is a mock for web users since they can't check real folders)
 */
router.post('/validate-structure', (req, res) => {
    // For web users, we always return positive validation if they've created a folder
    // since we can't actually verify the structure on their local machine
    const { folderCreated } = req.body;
    
    res.json({
        has_valid_structure: Boolean(folderCreated),
        is_empty: !folderCreated
    });
});

module.exports = router;
