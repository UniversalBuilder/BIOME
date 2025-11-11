import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import Environment from '../utils/environmentDetection';

function Settings() {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [isTauri, setIsTauri] = useState(false);
  const [webDesktopMode, setWebDesktopMode] = useState('auto'); // 'web', 'desktop', 'auto'

  useEffect(() => {
    const checkTauriEnvironment = async () => {
      const result = Environment.isTauri();
      setIsTauri(result);
    };
    checkTauriEnvironment();

    const savedWebDesktopMode = localStorage.getItem('biome_web_desktop_mode');
    if (savedWebDesktopMode !== null) {
      setWebDesktopMode(savedWebDesktopMode);
    }
  }, []);

  const handleDarkModeChange = () => {
    toggleDarkMode();
  };

  const handleWebDesktopModeChange = (value) => {
    setWebDesktopMode(value);
    localStorage.setItem('biome_web_desktop_mode', value);
    // TODO: Implement mode switching logic
  };

  const clearApplicationCache = () => {
    try {
      // Clear localStorage
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('biome_') || key.startsWith('app_')) {
          localStorage.removeItem(key);
        }
      });
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Force reload to clear any in-memory cache
      window.location.reload();
      
    } catch (error) {
      console.error('Failed to clear cache:', error);
      alert('Failed to clear cache. Please try refreshing the page manually.');
    }
  };

  const openDebugConsole = () => {
    // Dispatch custom event to open debug console
    window.dispatchEvent(new CustomEvent('openDebugConsole'));
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2" style={{
          background: 'linear-gradient(45deg, #00F7FF, #9B6BF3, #4DB4FF)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 0 10px rgba(0, 247, 255, 0.3)'
        }}>
          Application Settings
        </h2>
        <p className="text-gray-600 dark:text-gray-300">Configure your BIOME application preferences and tools</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Environment Information */}
        <div className="bg-white dark:bg-night-800 rounded-lg border border-gray-200 dark:border-night-600 p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Environment Information</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-night-700 rounded-lg">
              <span className="font-medium text-gray-900 dark:text-gray-100">Application Mode:</span>
              <span 
                className="px-3 py-1 rounded-full text-sm font-medium text-white"
                style={{
                  background: 'linear-gradient(45deg, #22c55e, #84cc16)',
                  boxShadow: '0 4px 12px rgba(34, 197, 94, 0.4)'
                }}
              >
                {isTauri ? 'Desktop' : 'Web'}
              </span>
            </div>
            
            <div className="text-sm text-gray-600 dark:text-gray-300 p-3 bg-gray-50 dark:bg-night-700 rounded-lg">
              {isTauri 
                ? 'Running as a desktop application with full filesystem access and native integrations.' 
                : 'Running in web browser with limited filesystem access. Consider using the desktop version for full functionality.'
              }
            </div>
          </div>
        </div>

        {/* Application Mode */}
        <div className="bg-white dark:bg-night-800 rounded-lg border border-gray-200 dark:border-night-600 p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Application Mode</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="font-medium text-gray-700 dark:text-gray-200">Preferred Mode</label>
              <div className="space-y-2">
                <label className="flex items-center text-gray-700 dark:text-gray-200">
                  <input
                    type="radio"
                    name="webDesktopMode"
                    value="auto"
                    checked={webDesktopMode === 'auto'}
                    onChange={(e) => handleWebDesktopModeChange(e.target.value)}
                    className="mr-2"
                  />
                  <span>Automatic (Detect environment)</span>
                </label>
                <label className="flex items-center text-gray-700 dark:text-gray-200">
                  <input
                    type="radio"
                    name="webDesktopMode"
                    value="web"
                    checked={webDesktopMode === 'web'}
                    onChange={(e) => handleWebDesktopModeChange(e.target.value)}
                    className="mr-2"
                  />
                  <span>Force Web Mode</span>
                </label>
                <label className="flex items-center text-gray-700 dark:text-gray-200">
                  <input
                    type="radio"
                    name="webDesktopMode"
                    value="desktop"
                    checked={webDesktopMode === 'desktop'}
                    onChange={(e) => handleWebDesktopModeChange(e.target.value)}
                    className="mr-2"
                  />
                  <span>Force Desktop Mode</span>
                </label>
              </div>
            </div>
            
            <div className="text-sm text-gray-600 dark:text-gray-300 p-3 bg-gray-50 dark:bg-night-700 rounded-lg">
              Mode switching functionality is in development. Currently displays detected environment.
            </div>
          </div>
        </div>

        {/* Development Tools */}
        <div className="bg-white dark:bg-night-800 rounded-lg border border-gray-200 dark:border-night-600 p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Development Tools</h3>
          
          <div className="space-y-4">
            <button
              onClick={openDebugConsole}
              className="w-full flex items-center justify-between p-3 bg-blue-50 dark:bg-night-700 border-2 border-blue-200 dark:border-bioluminescent-500 rounded-lg hover:bg-blue-100 dark:hover:bg-night-600 transition-colors"
            >
              <span className="text-gray-900 dark:text-gray-100">Open Debug Console</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">Ctrl+Shift+D</span>
            </button>

            {isTauri && (
              <button
                onClick={clearApplicationCache}
                className="w-full flex items-center justify-between p-3 bg-orange-50 dark:bg-night-700 border-2 border-orange-200 dark:border-orange-500 rounded-lg hover:bg-orange-100 dark:hover:bg-night-600 transition-colors"
              >
                <span className="text-gray-900 dark:text-gray-100">Clear Application Cache</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Fixes styling issues</span>
              </button>
            )}
            
            <div className="text-sm text-gray-600 dark:text-gray-300 p-3 bg-gray-50 dark:bg-night-700 rounded-lg">
              The debug console provides detailed information about backend connectivity, 
              environment status, and troubleshooting tools.
              {isTauri && (
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-night-600">
                  <strong>Cache Clearing:</strong> If status pill colors or styling appear incorrect after an update, 
                  use the cache clearing button to force reload fresh styles.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Appearance Settings */}
        <div className="bg-white dark:bg-night-800 rounded-lg border border-gray-200 dark:border-night-600 p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Appearance</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-gray-700 dark:text-gray-200">Dark Mode</label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Switch between light and dark theme</p>
              </div>
              <button
                onClick={handleDarkModeChange}
                className={`relative inline-flex h-6 w-11 rounded-full transition-colors duration-200 ease-in-out toggle-glow ${
                  isDarkMode ? '' : 'bg-gray-200'
                }`}
                style={isDarkMode ? {
                  background: 'linear-gradient(45deg, #22c55e, #84cc16)',
                  boxShadow: '0 4px 12px rgba(34, 197, 94, 0.4)'
                } : {}}
                title="Toggle dark mode"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${
                    isDarkMode ? 'translate-x-6' : 'translate-x-1'
                  } mt-1`}
                />
              </button>
            </div>
            
            <div className="text-sm text-gray-600 dark:text-gray-300 p-3 bg-gray-50 dark:bg-night-700 rounded-lg">
              🌙 Dark mode uses a bioluminescent forest palette with deep ocean blues and vibrant glow accents. Light mode evokes primal shores with soft sands and teal waters.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Settings;
