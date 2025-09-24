import * as nodeApi from './api';
import createTauriSqliteApiClient from './tauriSqliteApi';

/**
 * API Adapter that can switch between Node.js backend and Tauri SQLite implementation
 * This allows for a smooth transition and parallel testing of both implementations
 */
class ApiAdapter {
  constructor() {
    this.useTauriSqlite = false;
    this.tauriApiClient = null;
    
    // Check for configuration in localStorage
    if (localStorage.getItem('biome_use_tauri_sqlite') === 'true') {
      this.useTauriSqlite = true;
    }
    
    // Initialize the appropriate client
    this.initializeClient();
  }
  
  initializeClient() {
    if (this.useTauriSqlite) {
      this.tauriApiClient = createTauriSqliteApiClient();
    }
  }
  
  // Switch between implementations
  setUseTauriSqlite(value) {
    this.useTauriSqlite = value;
    localStorage.setItem('biome_use_tauri_sqlite', value.toString());
    this.initializeClient();
  }
  
  // User API
  async getAllUsers() {
    if (this.useTauriSqlite) {
      return await this.tauriApiClient.users.getAll();
    } else {
      return await nodeApi.userService.getAll();
    }
  }
  
  async createUser(userData) {
    if (this.useTauriSqlite) {
      return await this.tauriApiClient.users.create(
        userData.username,
        userData.email,
        userData.password
      );
    } else {
      return await nodeApi.userService.create(userData);
    }
  }
  
  // Project API
  async getAllProjects() {
    if (this.useTauriSqlite) {
      return await this.tauriApiClient.projects.getAll();
    } else {
      return await nodeApi.projectService.getAll();
    }
  }
  
  async createProject(projectData) {
    if (this.useTauriSqlite) {
      return await this.tauriApiClient.projects.create(
        projectData.name,
        projectData.description,
        projectData.project_path || projectData.folder_path,
        projectData.user_id || 1 // Default to first user if not specified
      );
    } else {
      return await nodeApi.projectService.create(projectData);
    }
  }
  
  // Group API
  async getAllGroups() {
    if (this.useTauriSqlite) {
      return await this.tauriApiClient.groups.getAll();
    } else {
      return await nodeApi.groupService.getAll();
    }
  }
  
  async createGroup(groupData) {
    if (this.useTauriSqlite) {
      return await this.tauriApiClient.groups.create(
        groupData.name,
        groupData.description
      );
    } else {
      return await nodeApi.groupService.create(groupData);
    }
  }
  
  // Check if the backend is available
  async checkBackendHealth() {
    if (this.useTauriSqlite) {
      // For Tauri SQLite, we're always healthy since it's embedded
      return { ok: true, data: { status: "ok", message: "SQLite backend active" } };
    } else {
      return await nodeApi.checkBackendHealth();
    }
  }
  
  // Database operations - only available in Node.js backend for now
  get databaseService() {
    if (!this.useTauriSqlite) {
      return nodeApi.databaseService;
    } else {
      // Placeholder for future SQLite implementation
      return {
        resetDatabase: () => Promise.reject("Not implemented in SQLite mode"),
        getDatabaseInfo: () => Promise.resolve({ 
          version: "1.2.0",
          mode: "SQLite embedded",
          tables: ["users", "projects", "groups"] 
        }),
        exportDatabase: () => Promise.reject("Not implemented in SQLite mode"),
        importDatabase: () => Promise.reject("Not implemented in SQLite mode")
      };
    }
  }
}

// Create a singleton instance
const apiAdapter = new ApiAdapter();

export default apiAdapter;