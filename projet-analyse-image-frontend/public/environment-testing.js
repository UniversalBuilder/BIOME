// Script to add URL parameter support for environment detection testing

/**
 * This script adds support for testing different environments via URL parameters
 * 
 * Usage examples:
 * http://localhost:3000/?forceTauri=true  - Force desktop mode
 * http://localhost:3000/?forceWeb=true    - Force web mode
 * 
 * This script is automatically injected into the HTML
 */

(function() {
  // Check if we're in the right environment and not in production
  // We use hostname to determine if we're in production (not a perfect check, but better than nothing)
  const isLocalhost = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' ||
                     window.location.hostname === '';
  
  if (typeof window !== 'undefined' && isLocalhost) {
    console.log('Environment testing script initialized');
    
    // Add a global debug function
    window.BIOME = window.BIOME || {};
    window.BIOME.debug = {
      // Force desktop mode (via URL parameter - temporary)
      forceDesktopMode: () => {
        const url = new URL(window.location);
        url.searchParams.set('forceTauri', 'true');
        url.searchParams.delete('forceWeb');
        window.location.href = url.toString();
      },
      
      // Force web mode (via URL parameter - temporary)
      forceWebMode: () => {
        const url = new URL(window.location);
        url.searchParams.set('forceWeb', 'true');
        url.searchParams.delete('forceTauri');
        window.location.href = url.toString();
      },
      
      // Persistent desktop mode (via localStorage)
      setPersistentDesktopMode: () => {
        localStorage.setItem('biome_environment_mode', 'desktop');
        window.location.reload();
      },
      
      // Persistent web mode (via localStorage)
      setPersistentWebMode: () => {
        localStorage.setItem('biome_environment_mode', 'web');
        window.location.reload();
      },
      
      // Reset to default detection
      resetMode: () => {
        const url = new URL(window.location);
        url.searchParams.delete('forceTauri');
        url.searchParams.delete('forceWeb');
        localStorage.removeItem('biome_environment_mode');
        window.location.href = url.toString();
      },
      
      // Show environment info
      showEnvInfo: () => {
        if (typeof window.__printEnvironmentInfo === 'function') {
          window.__printEnvironmentInfo();
          return 'Environment info logged to console';
        }
        return 'Environment info function not available';
      }
    };
    
    // Check if we have any environment URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const forceTauri = urlParams.get('forceTauri') === 'true';
    const forceWeb = urlParams.get('forceWeb') === 'true';
    
    if (forceTauri) {
      console.log('%c⚠️ FORCED DESKTOP MODE ENABLED', 'background: #6200ea; color: white; padding: 2px 4px; border-radius: 2px;');
    } else if (forceWeb) {
      console.log('%c⚠️ FORCED WEB MODE ENABLED', 'background: #0277bd; color: white; padding: 2px 4px; border-radius: 2px;');
    }
    
    // Add helper message to console
    console.log(
      '%cBIOME Environment Tools: %c\n' +
      '• window.BIOME.debug.forceDesktopMode() - Force desktop mode (temporary)\n' +
      '• window.BIOME.debug.forceWebMode() - Force web mode (temporary)\n' +
      '• window.BIOME.debug.setPersistentDesktopMode() - Force desktop mode (persistent)\n' +
      '• window.BIOME.debug.setPersistentWebMode() - Force web mode (persistent)\n' +
      '• window.BIOME.debug.resetMode() - Reset to auto-detection\n' +
      '• window.BIOME.debug.showEnvInfo() - Show environment details',
      'font-weight: bold; color: #2e7d32;', 'font-family: monospace; color: #0277bd;'
    );
    
    // Check stored mode
    const storedMode = localStorage.getItem('biome_environment_mode');
    if (storedMode) {
      console.log(
        '%c⚠️ PERSISTENT MODE OVERRIDE: %c' + storedMode.toUpperCase(),
        'background: #ff9800; color: white; padding: 2px 4px; border-radius: 2px;',
        'background: #4a148c; color: white; padding: 2px 4px; border-radius: 2px;'
      );
    }
  }
})();
