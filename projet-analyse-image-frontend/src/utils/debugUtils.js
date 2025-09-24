// Debug utilities for Tauri environment detection

/**
 * Print detailed environment information to the console
 * Useful for debugging Tauri detection issues
 */
export const printEnvironmentInfo = () => {
  console.group('🔍 Environment Information');
  
  // Check window object
  console.log('Window object:', {
    location: window?.location?.href || 'undefined',
    protocol: window?.location?.protocol || 'undefined'
  });
  
  // Check Tauri-specific globals
  console.log('Tauri globals:', {
    __TAURI__: typeof window?.__TAURI__ !== 'undefined' ? 'present' : 'absent',
    __TAURI_IPC__: typeof window?.__TAURI_IPC__ !== 'undefined' ? 'present' : 'absent',
    __TAURI_METADATA__: typeof window?.__TAURI_METADATA__ !== 'undefined' ? 'present' : 'absent',
  });
  
  // Check protocol
  const isTauriProtocol = window?.location?.protocol === 'tauri:';
  console.log('Protocol check:', {
    protocol: window?.location?.protocol || 'undefined',
    isTauriProtocol
  });
  
  // Node environment
  console.log('Node environment:', {
    nodeEnv: process.env.NODE_ENV || 'undefined',
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development'
  });
  
  // Check URL parameters (for manual overrides)
  const urlParams = new URLSearchParams(window.location.search);
  const forceMode = urlParams.get('mode');
  console.log('URL parameters:', {
    mode: forceMode || 'not set'
  });
  
  // Screen information (desktop apps often have different dimensions)
  console.log('Screen information:', {
    width: window.innerWidth,
    height: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio
  });
  
  // Check user agent for browser detection
  console.log('User agent:', navigator.userAgent);
  
  console.groupEnd();
  
  return {
    isTauriProtocol,
    hasTauriGlobal: typeof window?.__TAURI__ !== 'undefined',
    hasTauriIPC: typeof window?.__TAURI_IPC__ !== 'undefined',
    hasTauriMetadata: typeof window?.__TAURI_METADATA__ !== 'undefined',
    forceMode
  };
};

/**
 * Create a simple overlay to display environment information
 * @param {boolean} isTauri - Whether the app is running in Tauri
 */
export const showEnvironmentOverlay = (isTauri) => {
  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') return;
  
  // Create overlay element
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.bottom = '10px';
  overlay.style.right = '10px';
  overlay.style.backgroundColor = isTauri ? 'rgba(122, 74, 249, 0.8)' : 'rgba(0, 169, 224, 0.8)';
  overlay.style.color = 'white';
  overlay.style.padding = '5px 10px';
  overlay.style.borderRadius = '4px';
  overlay.style.fontSize = '12px';
  overlay.style.fontFamily = 'monospace';
  overlay.style.zIndex = '9999';
  overlay.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
  
  // Set content
  overlay.textContent = `Mode: ${isTauri ? 'DESKTOP' : 'WEB'} | ${process.env.NODE_ENV}`;
  
  // Add toggle functionality
  overlay.addEventListener('click', () => {
    const details = printEnvironmentInfo();
    console.log('Environment details:', details);
    alert(`Running in ${isTauri ? 'DESKTOP' : 'WEB'} mode\n\nDetails logged to console.`);
  });
  
  // Add to document
  document.body.appendChild(overlay);
  
  return overlay;
};
