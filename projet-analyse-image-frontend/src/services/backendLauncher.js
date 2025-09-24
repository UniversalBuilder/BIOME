import { checkBackendHealth } from './api';
import Environment from '../utils/environmentDetection';

// Debug flag for console output - only show in development or when debugging is explicitly enabled
// Conditionally import Tauri APIs only when running in desktop mode
let invoke, getCurrentWebviewWindow, readTextFile, exists, appDataDir, appWindow;

if (Environment.isTauri()) {
  // Dynamic imports for Tauri APIs
  const importTauriApis = async () => {
    const coreModule = await import('@tauri-apps/api/core');
    invoke = coreModule.invoke;
    
    const webviewModule = await import('@tauri-apps/api/webviewWindow');
    getCurrentWebviewWindow = webviewModule.getCurrentWebviewWindow;
    appWindow = getCurrentWebviewWindow();
    
    const fsModule = await import('@tauri-apps/plugin-fs');
    readTextFile = fsModule.readTextFile;
    exists = fsModule.exists;
    
    const pathModule = await import('@tauri-apps/api/path');
    appDataDir = pathModule.appDataDir;
  };
  
  // Initialize Tauri APIs
  importTauriApis().catch(err => console.error('Failed to load Tauri APIs:', err));
}

// Backend server configuration
const DEFAULT_PORT = 3001;
const MAX_PORT_ATTEMPTS = 10; // Try up to 10 different ports
const API_BASE_URL_PREFIX = 'http://127.0.0.1:';
const DOCKER_CONFIG_PATH = 'docker_backend.json';

// Possible backend paths in development mode
const DEV_BACKEND_PATHS = [
    '../backend',                      // Relative path from frontend
    'D:/DEV/BIOME/backend',            // Absolute path
    './backend',                       // Symbolic link path
    '../../backend'                    // Alternative relative path
];

// In production, backend will be in the resource directory next to the executable
// In development, we'll try multiple possible paths
const BACKEND_PATH = Environment.isTauri() && process.env.NODE_ENV === 'production' 
    ? './resources/backend'
    : null;  // We'll determine this dynamically in dev mode

class BackendLauncher {
    constructor() {
        this.isStarted = false;
        this.startupAttempts = 0;
        this.maxRetries = 3;
        this.retryDelay = 2000; // 2 seconds between retries
        this.serverCheckInterval = null;
        this.port = DEFAULT_PORT;
        this.apiBaseUrl = `${API_BASE_URL_PREFIX}${this.port}`;
        this.isProduction = process.env.NODE_ENV === 'production';
        this.usingDockerBackend = false;
        this.backendPath = BACKEND_PATH;
    }

    getApiUrl(endpoint = '') {
        return `${this.apiBaseUrl}${endpoint}`;
    }

    async init() {
        try {
            // Check if we're running in web mode
            if (!Environment.isTauri()) {
                console.log('Running in web mode - assuming backend is started separately');
                this.isStarted = true;
                this.startHealthCheck();
                return true;
            }
            
            // Only proceed with Tauri-specific initialization in desktop mode
            // Check if we should use Docker backend
            const useDockerBackend = await this.checkForDockerBackend();
            
            if (useDockerBackend) {
                console.log('Using Docker backend - no need to start local backend server');
                this.usingDockerBackend = true;
                this.isStarted = true;
                
                // Start health check interval for Docker backend
                this.startHealthCheck();
                return true;
            }

            // In development mode, find the correct backend path
            if (!this.isProduction && !this.backendPath) {
                await this.findBackendPath();
            }
            
            // Get app data directory for logs
            const appDataDirPath = await appDataDir();
            console.log(`App data directory: ${appDataDirPath}`);
            
            // Set up application shutdown handler - using the proper event syntax
            if (appWindow && appWindow.onCloseRequested) {
                appWindow.onCloseRequested(async (event) => {
                    console.log('Window close requested, shutting down backend server...');
                    await this.stopServer();
                    // No need to call appWindow.close() - Tauri will handle this automatically
                    // after the event listener completes
                });
            }

            if (this.isProduction) {
                // In production, we need to find an available port
                this.port = await this.findAvailablePort();
                this.apiBaseUrl = `${API_BASE_URL_PREFIX}${this.port}`;
                console.log(`Using port ${this.port} for backend server`);
                
                // Store the port in localStorage for the API service to use
                localStorage.setItem('biome_backend_port', this.port.toString());
            }

            return this.startServer();
        } catch (error) {
            console.error('Error initializing backend launcher:', error);
            throw error;
        }
    }

    async checkForDockerBackend() {
        try {
            console.log('Checking for Docker backend configuration at:', DOCKER_CONFIG_PATH);
            
            // Try with straight file path first
            let configExists = await exists(DOCKER_CONFIG_PATH);
            
            if (!configExists) {
                // Try with absolute path (needed in some Tauri environments)
                try {
                    const absoluteConfigPath = await invoke('get_absolute_path', { 
                        relativePath: DOCKER_CONFIG_PATH 
                    }).catch(() => DOCKER_CONFIG_PATH);
                    
                    configExists = await exists(absoluteConfigPath);
                    if (configExists) {
                        console.log('Docker backend configuration found at absolute path:', absoluteConfigPath);
                    }
                } catch (error) {
                    console.log('Error checking absolute path, falling back to relative path');
                }
            }
            
            if (!configExists) {
                console.log('No Docker backend configuration found');
                return false;
            }
            
            // Read Docker backend configuration
            let configContent;
            try {
                configContent = await readTextFile(DOCKER_CONFIG_PATH);
            } catch (error) {
                console.warn('Error reading Docker config file:', error);
                
                // Try browser fetch as fallback for development mode
                try {
                    const response = await fetch(DOCKER_CONFIG_PATH);
                    configContent = await response.text();
                    console.log('Successfully read Docker config via fetch');
                } catch (fetchError) {
                    console.warn('Failed to fetch Docker config:', fetchError);
                    return false;
                }
            }
            
            // Parse configuration
            const config = JSON.parse(configContent);
            
            if (config.useDockerBackend) {
                console.log('Docker backend configuration found:', config);
                
                // Update port and API URL if specified in config
                if (config.backendPort) {
                    this.port = config.backendPort;
                }
                
                if (config.backendUrl) {
                    this.apiBaseUrl = config.backendUrl;
                } else {
                    this.apiBaseUrl = `${API_BASE_URL_PREFIX}${this.port}`;
                }

                // Store the port in localStorage for the API service to use
                localStorage.setItem('biome_backend_port', this.port.toString());
                localStorage.setItem('biome_using_docker_backend', 'true');
                localStorage.setItem('biome_backend_url', this.apiBaseUrl);
                
                // Verify Docker backend is actually accessible
                try {
                    console.log('Checking Docker backend health at:', this.apiBaseUrl);
                    const health = await checkBackendHealth();
                    if (health.ok) {
                        console.log('Docker backend health check passed');
                        return true;
                    }
                    console.warn('Docker backend configuration found but health check failed');
                    return false;
                } catch (error) {
                    console.warn('Docker backend health check failed:', error.message);
                    return false;
                }
            }
            
            return false;
        } catch (error) {
            console.warn('Error checking for Docker backend:', error);
            return false;
        }
    }

    async findAvailablePort() {
        for (let attempt = 0; attempt < MAX_PORT_ATTEMPTS; attempt++) {
            const testPort = DEFAULT_PORT + attempt;
            try {
                // Check if port is available using Tauri command
                const isAvailable = await invoke('check_port_available', { port: testPort });
                if (isAvailable) {
                    return testPort;
                }
                console.log(`Port ${testPort} is not available, trying next...`);
            } catch (error) {
                console.warn(`Error checking port ${testPort}:`, error);
                // Assume unavailable and continue
            }
        }
        
        // If we get here, we couldn't find an available port, use default and hope for the best
        console.warn(`Could not find available port after ${MAX_PORT_ATTEMPTS} attempts, using default port ${DEFAULT_PORT}`);
        return DEFAULT_PORT;
    }

    // New method to find the correct backend path in development mode
    async findBackendPath() {
        if (this.isProduction) {
            this.backendPath = './resources/backend';
            return;
        }

        console.log('Searching for backend path in development mode...');
        
        // Try to get the backend path from Tauri
        try {
            // First try to get app directory from Tauri
            const appDir = await invoke('get_app_dir').catch(() => null);
            
            if (appDir) {
                console.log(`App directory: ${appDir}`);
                // Try the paths relative to app directory
                for (const relPath of ['backend', '../backend', '../../backend']) {
                    const fullPath = `${appDir}/${relPath}`;
                    const exists = await invoke('check_dir_exists', { path: fullPath }).catch(() => false);
                    if (exists) {
                        this.backendPath = fullPath;
                        console.log(`Found backend at: ${this.backendPath}`);
                        return;
                    }
                }
            }
        } catch (error) {
            console.warn('Error getting app directory:', error);
        }
        
        // If we couldn't find it with Tauri, try the predefined paths
        for (const path of DEV_BACKEND_PATHS) {
            try {
                const exists = await invoke('check_dir_exists', { path }).catch(() => false);
                if (exists) {
                    this.backendPath = path;
                    console.log(`Found backend at: ${this.backendPath}`);
                    return;
                }
            } catch (error) {
                console.warn(`Error checking path ${path}:`, error);
            }
        }
        
        // If we couldn't find any valid path, use the first option and hope for the best
        this.backendPath = DEV_BACKEND_PATHS[0];
        console.warn(`Could not find a valid backend path, using default: ${this.backendPath}`);
    }

    async startServer() {
        if (this.isStarted) {
            console.log('Backend server is already running');
            return true;
        }

        try {
            console.log('Starting backend server...');
            console.log(`Using backend path: ${this.backendPath}`);
            
            // Pass the port, app data directory, and correct backend path to the backend server
            await invoke('start_backend_server', { 
                port: this.port,
                logToFile: true,
                backendPath: this.backendPath
            });
            
            // Wait for server to be ready
            const isReady = await this.waitForServer();
            if (!isReady) {
                throw new Error('Server failed to start within timeout period');
            }

            this.isStarted = true;
            this.startupAttempts = 0;
            
            // Start health check interval
            this.startHealthCheck();
            
            console.log('Backend server started successfully on port', this.port);
            return true;
        } catch (error) {
            console.error('Error starting backend server:', error);
            
            if (this.startupAttempts < this.maxRetries) {
                this.startupAttempts++;
                console.log(`Retrying server start (attempt ${this.startupAttempts}/${this.maxRetries})...`);
                await new Promise(resolve => setTimeout(resolve, this.retryDelay));
                return this.startServer();
            }
            
            throw new Error(`Failed to start backend server after ${this.maxRetries} attempts: ${error.message}`);
        }
    }

    async stopServer() {
        if (!this.isStarted) {
            console.log('Backend server is not running');
            return;
        }
        
        // If using Docker backend, we don't need to stop anything
        if (this.usingDockerBackend) {
            console.log('Using Docker backend - no need to stop local backend server');
            this.stopHealthCheck();
            this.isStarted = false;
            return;
        }

        try {
            // Stop health check
            this.stopHealthCheck();
            
            // Send shutdown request to backend server
            await fetch(this.getApiUrl('/api/shutdown'), {
                method: 'POST',
            }).catch(() => {
                // Ignore fetch errors during shutdown
                console.log('Backend server already stopped or shutdown endpoint not available');
            });

            // Invoke Tauri command to stop the server process
            await invoke('stop_backend_server');
            
            this.isStarted = false;
            console.log('Backend server stopped successfully');
        } catch (error) {
            console.error('Error stopping backend server:', error);
            // Don't throw error during shutdown
        }
    }

    async waitForServer(timeout = 15000) {
        const start = Date.now();
        console.log(`Waiting up to ${timeout}ms for server to be ready...`);
        
        while (Date.now() - start < timeout) {
            try {
                const health = await checkBackendHealth();
                if (health.ok) {
                    console.log('Server health check passed');
                    return true;
                }
                console.log('Server not ready yet:', health.error);
            } catch (error) {
                console.log('Error checking server health:', error.message);
            }
            
            // Wait before next attempt
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        console.error(`Server did not become ready within ${timeout}ms`);
        return false;
    }

    startHealthCheck() {
        // Clear any existing interval
        this.stopHealthCheck();
        
        // Check server health every 30 seconds
        this.serverCheckInterval = setInterval(async () => {
            try {
                const health = await checkBackendHealth();
                if (!health.ok) {
                    console.warn('Backend server health check failed, attempting restart...');
                    this.isStarted = false;
                    await this.startServer();
                }
            } catch (error) {
                console.warn('Backend server appears to be down, attempting restart...');
                this.isStarted = false;
                await this.startServer();
            }
        }, 30000);
    }

    stopHealthCheck() {
        if (this.serverCheckInterval) {
            clearInterval(this.serverCheckInterval);
            this.serverCheckInterval = null;
        }
    }
}

// Export singleton instance
const backendLauncher = new BackendLauncher();
export default backendLauncher;

// Add the ensureBackendRunning function that initializes the backend
export const ensureBackendRunning = async () => {
    if (!window.__TAURI__) {
        console.log('Not in Tauri environment, skipping backend launch');
        return;
    }

    try {
        // Initialize and start the backend
        await backendLauncher.init();
        console.log('Backend server initialization complete');
    } catch (error) {
        console.error('Failed to ensure backend is running:', error);
        // Remove the alert since the app works well without it
        throw error;
    }
};