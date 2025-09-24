// Production initialization service for BIOME desktop app
import Environment from '../utils/environmentDetection';

// Backend server configuration
const BACKEND_PORT = 3001;
const MAX_STARTUP_WAIT = 30000; // 30 seconds
const HEALTH_CHECK_INTERVAL = 1000; // 1 second

class ProductionInitializer {
    constructor() {
        this.isInitialized = false;
        this.isInitializing = false;
        this.backendReady = false;
    }

    async initialize() {
        if (this.isInitialized || this.isInitializing) {
            return this.isInitialized;
        }

        this.isInitializing = true;

        try {
            console.log('🚀 Initializing BIOME production environment...');
            
            // Check if we're in desktop mode
            const isTauri = Environment.isTauri();
            
            if (isTauri) {
                console.log('✅ Running in Tauri desktop mode');
                
                // Wait for backend to be ready
                await this.waitForBackend();
                
                // Set production flags
                this.setupProductionEnvironment();
                
                console.log('✅ BIOME production initialization complete');
            } else {
                console.log('ℹ️  Running in web mode - no backend initialization needed');
            }

            this.isInitialized = true;
            return true;

        } catch (error) {
            console.error('❌ Failed to initialize BIOME production environment:', error);
            throw error;
        } finally {
            this.isInitializing = false;
        }
    }

    async waitForBackend(timeout = MAX_STARTUP_WAIT) {
        console.log('⏳ Waiting for backend server to start...');
        
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            try {
                const response = await fetch(`http://localhost:${BACKEND_PORT}/api/health`, {
                    method: 'GET',
                    timeout: 2000
                });
                
                if (response.ok) {
                    const healthData = await response.json();
                    console.log('✅ Backend server is ready:', healthData);
                    this.backendReady = true;
                    return true;
                }
            } catch (error) {
                // Backend not ready yet, continue waiting
                console.log(`⏳ Backend not ready yet, retrying... (${Math.floor((Date.now() - startTime) / 1000)}s)`);
            }
            
            await new Promise(resolve => setTimeout(resolve, HEALTH_CHECK_INTERVAL));
        }
        
        throw new Error(`Backend server failed to start within ${timeout/1000} seconds`);
    }

    setupProductionEnvironment() {
        // Set global flags for production
        window.BIOME_PRODUCTION = true;
        window.BIOME_BACKEND_PORT = BACKEND_PORT;
        
        // Store in localStorage for API service
        localStorage.setItem('biome_backend_port', BACKEND_PORT.toString());
        localStorage.setItem('biome_production_mode', 'true');
        
        console.log('✅ Production environment configured');
    }

    isProductionReady() {
        return this.isInitialized && this.backendReady;
    }

    getBackendUrl() {
        return `http://localhost:${BACKEND_PORT}`;
    }
}

// Export singleton instance
const productionInitializer = new ProductionInitializer();
export default productionInitializer;

// Convenience function for app startup
export const initializeProduction = async () => {
    return await productionInitializer.initialize();
};
