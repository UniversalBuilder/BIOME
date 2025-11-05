// Use environment-specific API URL with dynamic port detection
const getApiUrl = () => {
  // Check if we're in a Tauri environment
  const isTauri = typeof window !== 'undefined' && window.__TAURI__;
  
  if (isTauri) {
    // In Tauri desktop app, always use localhost:3001
    // The backend should be auto-started by the Rust application
    return 'http://localhost:3001/api';
  }
  
  // In web environment, check production vs development
  if (process.env.NODE_ENV === 'production') {
    // Web production mode - may use different backend
    const port = localStorage.getItem('biome_backend_port') || '3001';
    return `http://localhost:${port}/api`;
  }
  
  // In development, use the standard port or environment variable
  return process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
};

// Utility function to handle API responses
const handleResponse = async (response, errorMessage) => {
    if (!response.ok) {
        const error = await response.text();
        console.error(`API Error: ${errorMessage}`, error);
        throw new Error(errorMessage + ': ' + error);
    }
};

// Add timeout and retry capabilities to fetch
const fetchWithRetry = async (url, options = {}, retries = 3, timeout = 5000) => {
    // Add AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    options.signal = controller.signal;
    
    try {
        const response = await fetch(url, options);
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            console.log(`Request to ${url} timed out, retries left: ${retries - 1}`);
        } else {
            console.log(`Fetch error: ${error.message}, retries left: ${retries - 1}`);
        }
        
        if (retries <= 1) throw error;
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 500));
        return fetchWithRetry(url, options, retries - 1, timeout);
    }
};

// Check backend health
export const checkBackendHealth = async () => {
    try {
        const apiUrl = getApiUrl();
        const response = await fetchWithRetry(`${apiUrl.replace('/api', '')}/api/health`, {}, 3, 2000);
        if (response.ok) {
            const data = await response.json();
            return { ok: true, data };
        }
        return { ok: false, error: 'Server responded with error' };
    } catch (error) {
        console.error('Backend health check failed:', error);
        return { ok: false, error: error.message };
    }
};

export const databaseService = {
    resetDatabase: async () => {
        const apiUrl = getApiUrl();
        const response = await fetchWithRetry(`${apiUrl}/database/reset`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        await handleResponse(response, 'Failed to reset database');
        return response.json();
    },

    getDatabaseInfo: async () => {
        const apiUrl = getApiUrl();
        const response = await fetchWithRetry(`${apiUrl}/database/info`);
        await handleResponse(response, 'Failed to get database info');
        return response.json();
    },

    exportDatabase: async () => {
        const apiUrl = getApiUrl();
        const response = await fetchWithRetry(`${apiUrl}/database/export`);
        await handleResponse(response, 'Failed to export database');
        return response.blob();
    },

    importDatabase: async (file) => {
        const apiUrl = getApiUrl();
        const response = await fetchWithRetry(`${apiUrl}/database/import`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/octet-stream',
            },
            body: file
        });
        await handleResponse(response, 'Failed to import database');
        return response.json();
    }
};

export const groupService = {
    getAll: async () => {
        const apiUrl = getApiUrl();
        const response = await fetchWithRetry(`${apiUrl}/groups`);
        await handleResponse(response, 'Failed to fetch groups');
        return response.json();
    },

    create: async (groupData) => {
        const apiUrl = getApiUrl();
        const response = await fetchWithRetry(`${apiUrl}/groups`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(groupData)
        });
        await handleResponse(response, 'Failed to create group');
        return response.json();
    },

    update: async (id, groupData) => {
        const apiUrl = getApiUrl();
        const response = await fetchWithRetry(`${apiUrl}/groups/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(groupData)
        });
        await handleResponse(response, 'Failed to update group');
        return response.json();
    },

    delete: async (id) => {
        const apiUrl = getApiUrl();
        const response = await fetchWithRetry(`${apiUrl}/groups/${id}`, {
            method: 'DELETE'
        });
        await handleResponse(response, 'Failed to delete group');
        return true;
    },

    getUsers: async (groupId) => {
        const apiUrl = getApiUrl();
        const response = await fetchWithRetry(`${apiUrl}/groups/${groupId}/users`);
        await handleResponse(response, 'Failed to fetch group users');
        return response.json();
    }
};

export const userService = {
    getAll: async () => {
        const apiUrl = getApiUrl();
        const response = await fetchWithRetry(`${apiUrl}/users`);
        await handleResponse(response, 'Failed to fetch users');
        return response.json();
    },

    create: async (userData) => {
        const apiUrl = getApiUrl();
        const response = await fetchWithRetry(`${apiUrl}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        await handleResponse(response, 'Failed to create user');
        return response.json();
    },

    update: async (id, userData) => {
        const apiUrl = getApiUrl();
        const response = await fetchWithRetry(`${apiUrl}/users/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        await handleResponse(response, 'Failed to update user');
        return response.json();
    },

    delete: async (id) => {
        const apiUrl = getApiUrl();
        const response = await fetchWithRetry(`${apiUrl}/users/${id}`, {
            method: 'DELETE'
        });
        await handleResponse(response, 'Failed to delete user');
        return true;
    },

    getProjects: async (userId) => {
        const apiUrl = getApiUrl();
        const response = await fetchWithRetry(`${apiUrl}/users/${userId}/projects`);
        await handleResponse(response, 'Failed to fetch user projects');
        return response.json();
    }
};

export const projectService = {
    getAll: async () => {
        const apiUrl = getApiUrl();
        const response = await fetchWithRetry(`${apiUrl}/projects`);
        await handleResponse(response, 'Failed to fetch projects');
        return response.json();
    },

    getById: async (id) => {
        const apiUrl = getApiUrl();
        const response = await fetchWithRetry(`${apiUrl}/projects/${id}`);
        await handleResponse(response, 'Failed to fetch project');
        return response.json();
    },

    create: async (projectData) => {
        const apiUrl = getApiUrl();
        const cleanData = {
            name: projectData.name || 'New Project',
            description: projectData.description || '',
            status: projectData.status || 'Intake',
            software: projectData.software || null,
            time_spent_minutes: parseInt(projectData.time_spent_minutes) || 0,
            project_path: projectData.project_path || null,
            folder_created: projectData.folder_created || false,
            readme_last_updated: projectData.readme_last_updated || null,
            start_date: projectData.start_date || new Date().toISOString().split('T')[0],
            user_id: projectData.user_id || null
        };

        console.log('Creating project with data:', JSON.stringify(cleanData, null, 2));
        
        const response = await fetchWithRetry(`${apiUrl}/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cleanData)
        });
        
        await handleResponse(response, 'Failed to create project');
        return response.json();
    },

    update: async (id, projectData) => {
        const apiUrl = getApiUrl();
        // Remove any temporary flags
        const cleanData = { ...projectData };
        delete cleanData.isTemp;
        delete cleanData.id;
        delete cleanData.creation_date;
        delete cleanData.last_updated;
        delete cleanData.group_id;
        delete cleanData.group_name;
        delete cleanData.user_name;
        delete cleanData.user_email;
        
        console.log(`Sending update request for project ${id} with data:`, JSON.stringify(cleanData, null, 2));
        
        const response = await fetchWithRetry(`${apiUrl}/projects/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cleanData)
        });
        
        await handleResponse(response, 'Failed to update project');
        const result = await response.json();
        console.log('Project update response:', JSON.stringify(result, null, 2));
        return result;
    },

    delete: async (id) => {
        const apiUrl = getApiUrl();
        const response = await fetchWithRetry(`${apiUrl}/projects/${id}`, {
            method: 'DELETE'
        });
        await handleResponse(response, 'Failed to delete project');
        return true;
    },

    addJournalEntry: async (id, entryText) => {
        const apiUrl = getApiUrl();
        const response = await fetchWithRetry(`${apiUrl}/projects/${id}/journal`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entry_text: entryText })
        });
        await handleResponse(response, 'Failed to add journal entry');
        return response.json();
    },
    
    editJournalEntry: async (projectId, entryId, entryText, editedBy = null) => {
        const apiUrl = getApiUrl();
        const response = await fetchWithRetry(`${apiUrl}/projects/${projectId}/journal/${entryId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entry_text: entryText, edited_by: editedBy })
        });
        await handleResponse(response, 'Failed to edit journal entry');
        return response.json();
    },
    
    deleteJournalEntry: async (projectId, entryId) => {
        const apiUrl = getApiUrl();
        const response = await fetchWithRetry(`${apiUrl}/projects/${projectId}/journal/${entryId}`, {
            method: 'DELETE'
        });
        await handleResponse(response, 'Failed to delete journal entry');
        return response.json();
    },
    
    getAllActivities: async () => {
        const apiUrl = getApiUrl();
        const response = await fetchWithRetry(`${apiUrl}/projects/activities`);
        await handleResponse(response, 'Failed to fetch project activities');
        return response.json();
    },
    
    getProjectActivities: async (id) => {
        const apiUrl = getApiUrl();
        const response = await fetchWithRetry(`${apiUrl}/projects/${id}/activities`);
        await handleResponse(response, 'Failed to fetch project activities');
        return response.json();
    },
    
    exportActivities: async () => {
        const apiUrl = getApiUrl();
        const response = await fetchWithRetry(`${apiUrl}/projects/activities/export`);
        await handleResponse(response, 'Failed to export activities');
        return response.blob();
    }
};
