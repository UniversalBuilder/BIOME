// Metadata Options API Service
// This service provides CRUD operations for metadata options (Software, Imaging Techniques, Sample Type, Analysis Goal)

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
    const errorData = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

/**
 * Get all active options for a specific category
 * @param {string} category - One of: 'software', 'imaging_techniques', 'sample_type', 'analysis_goal'
 * @returns {Promise<Array>} Array of option objects
 */
export const getOptionsByCategory = async (category) => {
  try {
    const response = await fetch(`${getApiUrl()}/metadata-options?category=${category}`);
    return handleResponse(response);
  } catch (error) {
    console.error(`Error fetching ${category} options:`, error);
    throw error;
  }
};

/**
 * Get all metadata options for all categories at once
 * @returns {Promise<Object>} Object with categories as keys and option arrays as values
 */
export const getAllOptions = async () => {
  try {
    const categories = ['software', 'imaging_techniques', 'sample_type', 'analysis_goal'];
    const promises = categories.map(category => getOptionsByCategory(category));
    const results = await Promise.all(promises);
    
    return {
      software: results[0],
      imagingTechniques: results[1],
      sampleTypes: results[2],
      analysisGoals: results[3]
    };
  } catch (error) {
    console.error('Error fetching all metadata options:', error);
    throw error;
  }
};

/**
 * Get a specific option by ID
 * @param {number} id - Option ID
 * @returns {Promise<Object>} Option object
 */
export const getOptionById = async (id) => {
  try {
    const response = await fetch(`${getApiUrl()}/metadata-options/${id}`);
    return handleResponse(response);
  } catch (error) {
    console.error(`Error fetching option ${id}:`, error);
    throw error;
  }
};

/**
 * Create a new option
 * @param {string} category - Category name
 * @param {string} value - Option value/label
 * @param {number} [displayOrder] - Display order (optional, will auto-increment if not provided)
 * @returns {Promise<Object>} Created option object
 */
export const createOption = async (category, value, displayOrder = null) => {
  try {
    const response = await fetch(`${getApiUrl()}/metadata-options`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ category, value, display_order: displayOrder })
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error creating option:', error);
    throw error;
  }
};

/**
 * Update an existing option
 * @param {number} id - Option ID
 * @param {Object} updates - Fields to update (value and/or display_order)
 * @returns {Promise<Object>} Updated option object
 */
export const updateOption = async (id, updates) => {
  try {
    const response = await fetch(`${getApiUrl()}/metadata-options/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });
    return handleResponse(response);
  } catch (error) {
    console.error(`Error updating option ${id}:`, error);
    throw error;
  }
};

/**
 * Delete an option (will fail if option is in use)
 * @param {number} id - Option ID
 * @returns {Promise<Object>} Success response
 * @throws {Error} If option is in use, throws error with usageCount
 */
export const deleteOption = async (id) => {
  try {
    const response = await fetch(`${getApiUrl()}/metadata-options/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      
      // If the error is a usage conflict, include the usage count in the error
      if (response.status === 409 && errorData.usageCount) {
        const error = new Error(errorData.error || 'Cannot delete option: in use');
        error.usageCount = errorData.usageCount;
        error.status = 409;
        throw error;
      }
      
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error(`Error deleting option ${id}:`, error);
    throw error;
  }
};

/**
 * Reorder options within a category
 * @param {string} category - Category name
 * @param {Array<number>} orderedIds - Array of option IDs in the desired order
 * @returns {Promise<Array>} Updated array of options in new order
 */
export const reorderOptions = async (category, orderedIds) => {
  try {
    const response = await fetch(`${getApiUrl()}/metadata-options/reorder/${category}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ orderedIds })
    });
    return handleResponse(response);
  } catch (error) {
    console.error(`Error reordering ${category} options:`, error);
    throw error;
  }
};

export default {
  getOptionsByCategory,
  getAllOptions,
  getOptionById,
  createOption,
  updateOption,
  deleteOption,
  reorderOptions
};
