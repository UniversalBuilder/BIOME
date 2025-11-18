// App Lifecycle Management Service
// This service manages the app's lifecycle events including startup and shutdown

import Environment from '../utils/environmentDetection';
import diagnostics from '../utils/diagnostics';

/**
 * Initialize app lifecycle handlers
 * This function should be called once when the app starts
 */
export const initAppLifecycle = () => {
  diagnostics.info('Lifecycle', 'Initializing app lifecycle handlers');
  
  if (Environment.isTauri()) {
    initTauriLifecycle();
  } else {
    initWebLifecycle();
  }
};

/**
 * Initialize Tauri-specific lifecycle handlers
 */
const initTauriLifecycle = () => {
  console.log('Setting up Tauri lifecycle handlers');
  
  try {
    // Listen for window close event to perform cleanup
    window.__TAURI__?.window?.getCurrent()?.listen('tauri://close-requested', async (event) => {
      console.log('Tauri app close requested');
      
      // Prevent the default close to allow cleanup
      event.preventDefault();
      
      // Perform cleanup operations
      const cleanupSuccess = await performCleanup();
      
      if (cleanupSuccess) {
        console.log('Cleanup completed, closing app');
        // Allow the window to close after cleanup
        setTimeout(() => {
          window.__TAURI__?.window?.getCurrent()?.close();
        }, 500);
      } else {
        console.error('Cleanup failed, forcing close');
        // Force close even if cleanup failed
        setTimeout(() => {
          window.__TAURI__?.window?.getCurrent()?.close();
        }, 1000);
      }
    });
    
    // Also handle beforeunload for additional safety
    window.addEventListener('beforeunload', async (event) => {
      console.log('Window beforeunload event in Tauri');
      await performCleanup();
    });
    
    console.log('Tauri lifecycle handlers set up successfully');
  } catch (error) {
    console.error('Failed to set up Tauri lifecycle handlers:', error);
  }
};

/**
 * Initialize web-specific lifecycle handlers
 */
const initWebLifecycle = () => {
  console.log('Setting up web lifecycle handlers');
  
  // Listen for page unload events
  window.addEventListener('beforeunload', async (event) => {
    console.log('Web app beforeunload event triggered');
    
    // Perform any cleanup operations
    await performCleanup();
    
    // Modern browsers no longer respect this, but included for legacy support
    event.preventDefault();
    event.returnValue = '';
  });
  
  console.log('Web lifecycle handlers set up successfully');
};

/**
 * Perform cleanup operations before app exit
 * This is called for both Tauri and web versions
 */
const performCleanup = async () => {
  console.log('Performing app cleanup before exit');
  
  try {
    // Save any unsaved data
    localStorage.setItem('biome_last_shutdown', new Date().toISOString());
    
    // Stop backend server if running in Tauri
    if (Environment.isTauri()) {
      try {
        console.log('Stopping backend server...');
        
        // First try to gracefully shutdown via API with shorter timeout
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 1000); // 1 second timeout
          
          await fetch('http://127.0.0.1:3001/api/shutdown', {
            method: 'POST',
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          console.log('Backend shutdown request sent');
          
          // Wait a moment for graceful shutdown
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (apiError) {
          console.log('Backend shutdown API call failed:', apiError.message);
        }
        
        // Force stop via Tauri command with retry logic
        try {
          const { invoke } = window.__TAURI__;
          await invoke('stop_backend_server');
          console.log('Backend server stopped via Tauri command');
        } catch (tauriError) {
          console.warn('Tauri stop command failed:', tauriError.message);
          
          // Try alternative process cleanup
          try {
            const { invoke: invokeBackup } = window.__TAURI__;
            await invokeBackup('force_kill_backend_processes');
            console.log('Backend processes force killed');
          } catch (forceError) {
            console.warn('Force kill also failed:', forceError.message);
          }
        }
        
        // Extended delay to ensure all processes are terminated
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error('Error stopping backend server:', error);
      }
      
      // Additional cleanup for Windows file handles
      try {
        // Clear any cached file handles in localStorage
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('file_handle') || key.includes('temp_'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        // Force close any open directories via Tauri
        const { invoke: invokeCleanup } = window.__TAURI__;
        await invokeCleanup('cleanup_file_handles').catch(error => {
          console.log('File handle cleanup not available:', error.message);
        });
        
      } catch (error) {
        console.warn('Error during file handle cleanup:', error);
      }
    }
    
    // Close any open file handles or connections
    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }
    
    // Additional cleanup for any remaining timers or intervals
    const highestTimeoutId = setTimeout(() => {}, 0);
    for (let i = highestTimeoutId; i >= 0; i--) {
      clearTimeout(i);
    }
    
    const highestIntervalId = setInterval(() => {}, 0);
    for (let i = highestIntervalId; i >= 0; i--) {
      clearInterval(i);
    }
    
    // Log the shutdown
    console.log('App cleanup completed successfully');
    return true;
  } catch (error) {
    console.error('Error during app cleanup:', error);
    return false;
  }
};

/**
 * Manually exit the application (useful for menu items, etc.)
 */
export const exitApp = async () => {
  diagnostics.info('Lifecycle', 'Manual app exit requested');
  
  // Perform cleanup
  await performCleanup();
  
  // Handle exit based on environment
  if (Environment.isTauri()) {
    try {
      // Exit the Tauri app
      window.__TAURI__?.process?.exit(0);
    } catch (error) {
      console.error('Failed to exit Tauri app:', error);
      // Fallback to closing the window
      window.__TAURI__?.window?.getCurrent()?.close();
    }
  } else {
    // For web version, we can't actually exit the browser
    // Just inform the user
    if (process.env.NODE_ENV !== 'development') {
      try { window.toast?.('You can now close this browser tab.', { type: 'info', duration: 2000 }); } catch {}
    }
  }
};

/**
 * Launch the app in the appropriate mode
 * @param {string} mode - 'web' or 'desktop'
 */
export const launchApp = (mode) => {
  diagnostics.info('Lifecycle', `Launching app in ${mode} mode`);
  if (mode === 'desktop' && !Environment.isTauri()) {
    // Attempt to launch desktop version from web
    const desktopProtocolUrl = `biome://open`;
    
    // Try to open the desktop app via custom protocol
    window.location.href = desktopProtocolUrl;
    
    // Fallback if protocol handler fails
    setTimeout(() => {
      // If we're still here, protocol handler didn't work
      // Offer download link or instructions
      // Use window.confirm directly instead of bare confirm to avoid ESLint error
      if (window.confirm('Desktop app not detected. Would you like to download it?')) {
        window.open('https://example.com/download/biome-desktop', '_blank');
      }
    }, 1000);
  } else if (mode === 'web' && Environment.isTauri()) {
    // Open web version from desktop app
    window.__TAURI__?.shell?.open('https://biome-web.example.com');
  }
};
