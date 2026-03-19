// Tauri API integration module

import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { formatDateTime, getSavedTimezone } from '../utils/timeUtils';

// Import the improved environment detection
import Environment from '../utils/environmentDetection';

// Log Tauri environment detection on module load for debugging
console.log('🔍 TauriAPI module loaded, environment check:', 
  Environment.isTauri() ? 'DESKTOP MODE' : 'WEB MODE'
);

/**
 * Helper function to select a directory using Tauri dialog
 */
export const selectDirectory = async () => {
  console.log('Selecting directory with Tauri API...');
  
  try {
    // Always use the direct Environment import for most reliable detection
    if (!Environment.isTauri(true)) {
      throw new Error('Not running in Tauri environment');
    }
    
    // Use the built-in dialog API instead of a custom command
    return await open({
      directory: true,
      multiple: false,
      title: "Select Project Directory"
    });
  } catch (error) {
    console.error('Error selecting directory:', error);
    throw error;
  }
};

/**
 * Helper function to validate a project folder
 */
export const validateProjectFolder = async (projectPath) => {
  console.log('Validating project folder structure...');

  try {
    // Use direct Environment check for more reliable detection
    if (!Environment.isTauri()) {
      throw new Error('Not running in Tauri environment');
    }

    const cleanPath = projectPath.replace(/["']/g, '');
    return await invoke('validate_project_folder', {
      folderPath: cleanPath
    });
  } catch (error) {
    // When the path doesn't exist yet (new project folder), Rust returns a "Directory does not exist"
    // error. This is expected during Step 2 of the wizard before the folder is actually created.
    // Return a safe default instead of propagating the error.
    const msg = (error?.message || String(error)).toLowerCase();
    if (msg.includes('directory does not exist') || msg.includes('does not exist')) {
      console.log('Folder does not exist yet (new project) — returning empty validation result.');
      return { has_valid_structure: false, is_empty: true };
    }
    console.error('Error validating project folder:', error);
    throw error;
  }
};

/**
 * Helper function to create folder structure and initial readme
 */
export const createFolderStructure = async (basePath, projectName, projectDescription) => {
  console.log('Creating folder structure with Tauri API...');
  
  try {
    // Use direct Environment check for more reliable detection
    if (!Environment.isTauri()) {
      throw new Error('Not running in Tauri environment');
    }

    const cleanPath = basePath.replace(/["']/g, '');
    
    return await invoke('create_folder_structure', {
      basePath: cleanPath,
      projectName: projectName || 'Untitled Project',
      projectDescription: projectDescription || 'No description provided'
    });
  } catch (error) {
    console.error('Error creating folder structure:', error);
    throw error;
  }
};

/**
 * Helper function to update an existing readme
 */
export const updateReadme = async (basePath, projectName, projectDescription, journalEntries = []) => {
  console.log('Updating readme with Tauri API...');
  
  try {
    // Use direct Environment check for more reliable detection
    if (!Environment.isTauri()) {
      throw new Error('Not running in Tauri environment');
    }

    const cleanPath = basePath.replace(/["']/g, '');
    
    // Format journal entries for Rust
    const formattedEntries = journalEntries.map(entry => {
      const tz = getSavedTimezone();
      const editedNote = entry.edited_at ? `\n(edited${entry.edited_by ? ` by ${entry.edited_by}` : ''} on ${formatDateTime(entry.edited_at, tz)})` : '';
      return ({
        date: formatDateTime(entry.entry_date, tz),
        text: `${entry.entry_text}${editedNote}`
      });
    });
    
    return await invoke('update_readme_file', {
      basePath: cleanPath,
      projectName: projectName || 'Untitled Project',
      projectDescription: projectDescription || 'No description provided',
      journalEntries: formattedEntries
    });
  } catch (error) {
    console.error('Error updating readme:', error);
    throw error;
  }
};

/**
 * Helper function to scan project folder contents
 */
export const scanProjectFolder = async (projectPath) => {
  console.log('Scanning project folder with Tauri API...');
  
  try {
    // Use direct Environment check for more reliable detection
    if (!Environment.isTauri()) {
      throw new Error('Not running in Tauri environment');
    }

    const cleanPath = projectPath.replace(/["']/g, '');
    
    return await invoke('scan_project_folder', {
      projectPath: cleanPath
    });
  } catch (error) {
    console.error('Error scanning project folder:', error);
    throw error;
  }
};

/**
 * Write text content (e.g. JSON) to a file on the native filesystem.
 * Creates parent directories as needed.
 */
export const writeJsonFile = async (filePath, content) => {
  try {
    if (!Environment.isTauri()) {
      throw new Error('Not running in Tauri environment');
    }
    const cleanPath = filePath.replace(/["']/g, '');
    await invoke('write_json_file', { path: cleanPath, content });
  } catch (error) {
    console.error('Error writing JSON file:', error);
    throw error;
  }
};

/**
 * Read text content from a file on the native filesystem.
 * Returns the file contents as a string.
 */
export const readTextFile = async (filePath) => {
  try {
    if (!Environment.isTauri()) {
      throw new Error('Not running in Tauri environment');
    }
    const cleanPath = filePath.replace(/["']/g, '');
    return await invoke('read_text_file', { path: cleanPath });
  } catch (error) {
    console.error('Error reading text file:', error);
    throw error;
  }
};

/**
 * Helper to open a path in the system file explorer
 */
export const openInExplorer = async (path) => {
  try {
    if (!Environment.isTauri()) {
      throw new Error('Not running in Tauri environment');
    }
    const cleanPath = (path || '').replace(/["']/g, '');
    if (!cleanPath) throw new Error('Invalid path');
    await invoke('open_in_explorer', { path: cleanPath });
    return true;
  } catch (error) {
    console.error('Error opening in explorer:', error);
    throw error;
  }
};