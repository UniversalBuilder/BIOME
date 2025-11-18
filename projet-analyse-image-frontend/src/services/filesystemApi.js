// Filesystem API Service
// This service provides filesystem operations that work in both Tauri and web environments

import { createFolderStructure, validateProjectFolder, updateReadme, scanProjectFolder, openInExplorer } from './tauriApi';
import Environment from '../utils/environmentDetection';

// Base URL for API endpoints
const getApiUrl = () => {
  // In production build, the backend will be hosted at the dynamic port
  if (process.env.NODE_ENV === 'production') {
    const port = localStorage.getItem('biome_backend_port') || '3001';
    return `http://localhost:${port}/api`;
  }
  
  // In development, use the standard port or environment variable
  return process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
};

/**
 * Helper function to handle API responses
 */
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText);
  }
  return response;
};

/**
 * Create project folder structure in a way that works in both Tauri and web environments
 */
export const createProjectStructure = async (basePath, projectName, projectDescription) => {
  try {
    // If running in Tauri environment, use native approach
    const isTauri = Environment.isTauri();
    console.log(`[filesystemApi] createProjectStructure detected environment: ${isTauri ? 'Tauri' : 'Web'}`);
    
    if (isTauri) {
      console.log('[filesystemApi] Using Tauri native folder creation');
      return await createFolderStructure(basePath, projectName, projectDescription);
    } else {
      console.log('[filesystemApi] Using web fallback folder creation');
      // If running in web environment, use backend API approach
      // This will create a ZIP file for download
      const response = await fetch(`${getApiUrl()}/filesystem/create-structure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectName,
          projectDescription,
          folderName: basePath.split(/[/\\]/).pop() // Extract folder name from path
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${errorText}`);
      }
      
      // Return the current timestamp as the result
      // The actual download will be handled automatically by the browser
      return new Date().toISOString();
    }
  } catch (error) {
    console.error('Error creating project structure:', error);
    throw error;
  }
};

/**
 * Validate project folder structure in a way that works in both Tauri and web environments
 */
export const validateProjectStructure = async (projectPath, folderCreated) => {
  try {
    // If running in Tauri environment, use native approach
    if (Environment.isTauri()) {
      return await validateProjectFolder(projectPath);
    } else {
      // If running in web environment, use backend API approach
      const response = await fetch(`${getApiUrl()}/filesystem/validate-structure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectPath,
          folderCreated
        })
      });
      
      return handleResponse(response).then(res => res.json());
    }
  } catch (error) {
    console.error('Error validating project structure:', error);
    // Return a default validation result for web environment
    return {
      has_valid_structure: Boolean(folderCreated),
      is_empty: !folderCreated
    };
  }
};

/**
 * Generate and download a README file for web users
 */
export const downloadReadmeTemplate = async (projectName, projectDescription, journalEntries = [], status = '', software = '', outputType = '') => {
  const date = new Date().toISOString().split('T')[0];
  
  let readmeContent = 
    `# ${projectName || 'Untitled Project'}\n\n` +
    `## Description\n${projectDescription || 'No description provided'}\n\n` +
    `## Project Details\n` +
    `- Created: ${date}\n` +
  `- Status: ${status || 'Not specified'}\n` +
  `- Software: ${software || 'Not specified'}\n` +
  `- Output/Result Type: ${outputType || 'Unspecified'}\n\n` +
    `## Journal Entries\n\n`;
    
  // Add journal entries if available
  if (journalEntries && journalEntries.length > 0) {
    journalEntries.forEach(entry => {
      const entryDate = new Date(entry.entry_date).toISOString().split('T')[0];
      const editedNote = entry.edited_at ? `\n(edited${entry.edited_by ? ` by ${entry.edited_by}` : ''} on ${new Date(entry.edited_at).toLocaleString()})` : '';
      readmeContent += `### ${entryDate}\n${entry.entry_text}${editedNote}\n\n`;
    });
  } else {
    readmeContent += 'No journal entries yet.\n\n';
  }
  
  // Create and download the file
  const blob = new Blob([readmeContent], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `README-${projectName || 'Project'}.md`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
  
  return date;
};

/**
 * Open folder in OS file explorer (desktop only). Returns true if triggered.
 */
export const openFolderInExplorer = async (projectPath) => {
  try {
    if (Environment.isTauri()) {
      await openInExplorer(projectPath);
      try { window.toast?.('Opened folder in Explorer', { type: 'success', duration: 1200 }); } catch {}
      return true;
    }
    try { window.toast?.('Desktop-only: opening folders requires the BIOME app', { type: 'info', duration: 2200 }); } catch {}
    return false;
  } catch (e) {
    console.error('openFolderInExplorer failed:', e);
    try { window.toast?.('Failed to open folder', { type: 'error' }); } catch {}
    return false;
  }
};

// Export all filesystem-related functions including direct Tauri functions
export {
  updateReadme,
  scanProjectFolder
};
