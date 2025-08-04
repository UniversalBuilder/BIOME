// Environment detection module
import { printEnvironmentInfo, showEnvironmentOverlay } from './debugUtils';

// Cached environment state
let _environmentState = null;

/**
 * Environment detection with multiple fallback strategies
 * @param {boolean} debug - Whether to log debug information
 * @returns {object} Environment information including isTauri flag
 */
export const detectEnvironment = (debug = false) => {
  // Return cached value if already computed
  if (_environmentState) return _environmentState;
  
  // Print debug info if requested
  if (debug) {
    printEnvironmentInfo();
  }
  
  // Expose environment info function globally for the debug console
  if (typeof window !== 'undefined') {
    window.__printEnvironmentInfo = printEnvironmentInfo;
  }

  // Strategy 1: Check for Tauri global object (most reliable)
  const hasTauriGlobal = typeof window !== 'undefined' && 
                         typeof window.__TAURI__ !== 'undefined';
  
  // Strategy 2: Check for Tauri protocol
  const isTauriProtocol = typeof window !== 'undefined' && 
                         window.location && 
                         window.location.protocol === 'tauri:';
  
  // Strategy 3: Check for Tauri IPC
  const hasTauriIPC = typeof window !== 'undefined' && 
                      typeof window.__TAURI_IPC__ !== 'undefined';
  
  // Strategy 4: Check for Tauri metadata
  const hasTauriMetadata = typeof window !== 'undefined' && 
                          typeof window.__TAURI_METADATA__ !== 'undefined';
                          
  // Strategy 5: Check for window features typical of desktop apps
  // This is a heuristic approach that might help when other methods fail
  const hasDesktopFeatures = typeof window !== 'undefined' && (
    // Check if window is exact size of screen (common for desktop apps)
    (window.outerWidth === window.screen.availWidth && 
     window.outerHeight === window.screen.availHeight) ||
    // Check if we're running in a specific non-standard protocol
    (window.location?.protocol && !['http:', 'https:', 'file:'].includes(window.location.protocol))
  );
  
  // Strategy 6: Check for specific Tauri properties on window
  // This might help with future Tauri versions that change the API
  const hasTauriWindowFeatures = typeof window !== 'undefined' && (
    // Check for any known Tauri object properties
    typeof window.__TAURI_INTERNALS__ !== 'undefined' ||
    typeof window.__TAURI_INVOKE_KEY__ !== 'undefined' ||
    typeof window.__TAURI_INVOKE__ !== 'undefined'
  );
  
  // Strategy 7: URL parameter override (for testing)
  const urlParams = typeof window !== 'undefined' ? 
                    new URLSearchParams(window.location.search) : null;
  const forceTauri = urlParams?.get('forceTauri') === 'true';
  const forceWeb = urlParams?.get('forceWeb') === 'true';
                    
  // Strategy 8: Check localStorage for a manual override
  // This allows for persistent overrides across page reloads
  const storedMode = typeof window !== 'undefined' && window.localStorage ? 
                    window.localStorage.getItem('biome_environment_mode') : null;
  const storedForceTauri = storedMode === 'desktop';
  const storedForceWeb = storedMode === 'web';
  
  // Final determination
  const isTauri = forceTauri || storedForceTauri ||
                  (!forceWeb && !storedForceWeb && (
                    // Main detection methods
                    hasTauriGlobal || 
                    isTauriProtocol || 
                    hasTauriIPC || 
                    hasTauriMetadata ||
                    // Additional heuristics
                    hasDesktopFeatures ||
                    hasTauriWindowFeatures ||
                    // If we're in production and user agent doesn't look like a common browser, 
                    // it's likely Tauri/desktop
                    (process.env.NODE_ENV === 'production' && 
                     typeof navigator !== 'undefined' && 
                     !/Chrome|Firefox|Safari|Edge|Opera/i.test(navigator.userAgent))
                  ));
  
  // Cache the result
  _environmentState = {
    isTauri,
    hasTauriGlobal,
    isTauriProtocol,
    hasTauriIPC, 
    hasTauriMetadata,
    hasDesktopFeatures,
    hasTauriWindowFeatures,
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
    forceTauri,
    forceWeb,
    storedForceTauri,
    storedForceWeb,
    storedMode
  };
  
  // Log the determination for debugging
  if (debug) {
    console.log('🧪 Environment detection:', _environmentState);
    
    // Show visual indicator in development mode
    if (process.env.NODE_ENV === 'development') {
      showEnvironmentOverlay(isTauri);
    }
  }
  
  return _environmentState;
};

/**
 * Check if the app is running in a Tauri desktop environment
 * @param {boolean} debug - Whether to log debug information
 * @returns {boolean} True if running in Tauri
 */
export const isTauri = (debug = false) => {
  const env = detectEnvironment(debug);
  return env.isTauri;
};

/**
 * Check if the app is running in a web browser
 * @param {boolean} debug - Whether to log debug information
 * @returns {boolean} True if running in a web browser
 */
export const isWeb = (debug = false) => {
  const env = detectEnvironment(debug);
  return !env.isTauri;
};

/**
 * Get a display-friendly description of the current environment
 * @param {boolean} detailed - Whether to include detailed information
 * @returns {string} A human-readable description of the environment
 */
export const getEnvironmentDescription = (detailed = false) => {
  const env = detectEnvironment();
  let description = `Running in ${env.isTauri ? 'DESKTOP' : 'WEB'} mode`;
  
  if (detailed) {
    const details = [];
    details.push(`Environment: ${process.env.NODE_ENV}`);
    
    if (env.isTauri) {
      if (env.hasTauriGlobal) details.push('Detected via Tauri global object');
      if (env.isTauriProtocol) details.push('Detected via Tauri protocol');
      if (env.hasTauriIPC) details.push('Detected via Tauri IPC');
      if (env.hasTauriMetadata) details.push('Detected via Tauri metadata');
    }
    
    if (env.forceTauri) details.push('Mode forced via URL parameter (desktop)');
    if (env.forceWeb) details.push('Mode forced via URL parameter (web)');
    
    description += `\n${details.join('\n')}`;
  }
  
  return description;
};

// Export a default interface
const Environment = {
  detect: detectEnvironment,
  isTauri,
  isWeb,
  getDescription: getEnvironmentDescription
};

export default Environment;
