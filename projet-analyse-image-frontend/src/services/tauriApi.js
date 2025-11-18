// Tauri API integration module

import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';

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
      const editedNote = entry.edited_at ? `\n(edited${entry.edited_by ? ` by ${entry.edited_by}` : ''} on ${new Date(entry.edited_at).toLocaleString()})` : '';
      return ({
        date: new Date(entry.entry_date).toLocaleString(),
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