import React, { useState, useEffect } from 'react';
import Environment from '../utils/environmentDetection';

/**
 * A debug component that displays the current environment info
 * Only visible in development mode
 */
const EnvironmentInfo = () => {
  const [visible, setVisible] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [env, setEnv] = useState({});
  
  // Get environment info on mount and when localStorage changes
  useEffect(() => {
    // Only show in development mode
    if (process.env.NODE_ENV !== 'development') {
      setVisible(false);
      return;
    }
    
    // Get environment details
    const envDetails = Environment.detect(true);
    setEnv(envDetails);
    
    // Set up a storage event listener to refresh when environment changes
    const handleStorageChange = (event) => {
      if (event.key === 'biome_environment_mode' || event.key === null) {
        const newEnvDetails = Environment.detect(true);
        setEnv(newEnvDetails);
      }
    };
    
    // Listen for localStorage changes
    window.addEventListener('storage', handleStorageChange);
    
    // Set up a periodic check every 5 seconds in case Tauri initializes late
    const intervalId = setInterval(() => {
      const newEnvDetails = Environment.detect(false); // Don't log every check
      if (newEnvDetails.isTauri !== env.isTauri) {
        setEnv(newEnvDetails);
        Environment.detect(true); // Log when we detect a change
      }
    }, 5000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalId);
    };
  }, [env.isTauri]);
  
  // Don't render if not visible or not in development
  if (!visible || process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  // Styles
  const containerStyle = {
    position: 'fixed',
    bottom: expanded ? '20px' : '10px',
    right: expanded ? '20px' : '10px',
    backgroundColor: env.isTauri ? 'rgba(122, 74, 249, 0.9)' : 'rgba(0, 169, 224, 0.9)',
    color: 'white',
    padding: expanded ? '15px' : '5px 10px',
    borderRadius: '4px',
    fontSize: expanded ? '14px' : '12px',
    fontFamily: 'monospace',
    zIndex: 9999,
    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    maxWidth: expanded ? '400px' : '200px'
  };
  
  const titleStyle = {
    fontWeight: 'bold',
    marginBottom: expanded ? '10px' : '0'
  };
  
  const detailStyle = {
    marginTop: '5px',
    display: expanded ? 'block' : 'none'
  };
  
  const buttonStyle = {
    marginTop: expanded ? '10px' : '0',
    padding: '2px 8px',
    borderRadius: '3px',
    border: 'none',
    backgroundColor: 'rgba(255,255,255,0.3)',
    color: 'white',
    fontSize: '11px',
    cursor: 'pointer'
  };
  
  // Handle click to expand/collapse
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };
  
  // Handle close
  const handleClose = (e) => {
    e.stopPropagation();
    setVisible(false);
  };
  
  // Force desktop mode
  const forceDesktopMode = (e) => {
    e.stopPropagation();
    localStorage.setItem('biome_environment_mode', 'desktop');
    window.location.reload();
  };
  
  // Force web mode
  const forceWebMode = (e) => {
    e.stopPropagation();
    localStorage.setItem('biome_environment_mode', 'web');
    window.location.reload();
  };
  
  // Reset to auto detection
  const resetMode = (e) => {
    e.stopPropagation();
    localStorage.removeItem('biome_environment_mode');
    window.location.reload();
  };
  
  // Prepare detection method information
  const detectionMethods = [];
  if (env.hasTauriGlobal) detectionMethods.push('window.__TAURI__');
  if (env.isTauriProtocol) detectionMethods.push('tauri: protocol');
  if (env.hasTauriIPC) detectionMethods.push('window.__TAURI_IPC__');
  if (env.hasTauriMetadata) detectionMethods.push('window.__TAURI_METADATA__');
  if (env.forceTauri) detectionMethods.push('URL parameter');
  if (env.forceWeb) detectionMethods.push('URL parameter (force web)');
  
  return (
    <div style={containerStyle} onClick={toggleExpanded}>
      <div style={titleStyle}>
        {env.isTauri ? '🖥️ DESKTOP MODE' : '🌐 WEB MODE'}
        <span style={{float: 'right', cursor: 'pointer'}} onClick={handleClose}>✕</span>
      </div>
      
      <div style={detailStyle}>
        <div>Environment: {process.env.NODE_ENV}</div>
        <div>Detected via: {detectionMethods.length ? detectionMethods.join(', ') : 'None'}</div>
        {(env.forceTauri || env.storedForceTauri) && 
          <div style={{color: 'yellow'}}>
            ⚠️ Desktop mode forced {env.storedForceTauri ? 'via localStorage' : 'via URL parameter'}
          </div>
        }
        {(env.forceWeb || env.storedForceWeb) && 
          <div style={{color: 'yellow'}}>
            ⚠️ Web mode forced {env.storedForceWeb ? 'via localStorage' : 'via URL parameter'}
          </div>
        }
        
        <div style={{marginTop: '10px', display: 'flex', gap: '5px', flexWrap: 'wrap'}}>
          <button 
            style={{...buttonStyle, background: env.isTauri ? 'rgba(255,255,255,0.3)' : 'rgba(122, 74, 249, 0.5)'}}
            onClick={forceDesktopMode}
          >
            Force Desktop
          </button>
          
          <button 
            style={{...buttonStyle, background: !env.isTauri ? 'rgba(255,255,255,0.3)' : 'rgba(0, 169, 224, 0.5)'}}
            onClick={forceWebMode}
          >
            Force Web
          </button>
          
          {(env.forceTauri || env.forceWeb || env.storedForceTauri || env.storedForceWeb) && (
            <button 
              style={{...buttonStyle, background: 'rgba(255,87,34,0.7)'}}
              onClick={resetMode}
            >
              Reset
            </button>
          )}
          
          <button 
            style={{...buttonStyle, background: 'rgba(255,255,255,0.2)'}}
            onClick={(e) => {
              e.stopPropagation();
              Environment.detect(true); // Log details to console
              try { window.toast?.('Environment details logged to console', { type: 'info', duration: 1600 }); } catch {}
            }}
          >
            Log Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnvironmentInfo;
