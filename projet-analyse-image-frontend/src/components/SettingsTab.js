import React, { useState, useEffect } from 'react';
import Environment from '../utils/environmentDetection';
import { useTheme } from '../contexts/ThemeContext';

function SettingsTab({ isActive, onNavigate }) {
  const [isTauri, setIsTauri] = useState(false);
  const { isDarkMode, toggleDarkMode } = useTheme();

  useEffect(() => {
    const checkTauriEnvironment = async () => {
      const result = Environment.isTauri();
      setIsTauri(result);
    };
    checkTauriEnvironment();
  }, []);

  const handleDarkModeChange = () => {
    toggleDarkMode();
  };

  const openDebugConsole = () => {
    // Emit custom event to open debug console
    window.dispatchEvent(new CustomEvent('openDebugConsole'));
  };

  if (!isActive) return null;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2" style={{
          background: 'linear-gradient(45deg, #144B7B, #499BA0, #7293A2)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 0 10px rgba(20, 75, 123, 0.3)'
        }}>
          Application Settings
        </h2>
        <p className="text-gray-600 dark:text-gray-300">Configure your BIOME application preferences and tools</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Environment Information */}
        <div className="bg-white dark:bg-night-800 rounded-lg border border-gray-200 dark:border-night-600 p-6 shadow-sm card-glow">
          <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-900 dark:text-gray-100 text-glow">
            <span className="mr-2">ℹ️</span>
            Environment Information
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 rounded-lg" style={{
              background: isTauri 
                ? 'linear-gradient(45deg, rgba(20, 75, 123, 0.1), rgba(73, 155, 160, 0.1))' 
                : 'linear-gradient(45deg, rgba(73, 155, 160, 0.1), rgba(114, 147, 162, 0.1))'
            }}>
              <span className="font-medium">Application Mode:</span>
              <span 
                className="px-3 py-1 rounded-full text-sm font-medium text-white"
                style={{
                  background: 'linear-gradient(45deg, #22c55e, #84cc16)'
                }}
              >
                {isTauri ? '🖥️ Desktop' : '🌐 Web'}
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

        {/* Development Tools */}
        <div className="bg-white dark:bg-night-800 rounded-lg border border-gray-200 dark:border-night-600 p-6 shadow-sm card-glow">
          <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-900 dark:text-gray-100 text-glow">
            <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Development Tools
          </h3>
          
          <div className="space-y-4">
            <button
              onClick={openDebugConsole}
              className="w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all duration-200 hover:scale-[1.02] btn-glow"
              style={{
                background: 'linear-gradient(45deg, rgba(20, 75, 123, 0.1), rgba(73, 155, 160, 0.1))',
                borderColor: 'rgba(20, 75, 123, 0.3)',
                color: '#144B7B'
              }}
            >
              <span className="flex items-center">
                <span className="mr-2">⚡</span>
                Open Debug Console
              </span>
              <span className="text-xs opacity-75">Ctrl+Shift+D</span>
            </button>
            
            <div className="text-sm text-gray-600 dark:text-gray-300 p-3 bg-gray-50 dark:bg-night-700 rounded-lg">
              The debug console provides detailed information about backend connectivity, 
              environment status, and troubleshooting tools.
            </div>
          </div>
        </div>

        {/* Appearance Settings */}
        <div className="bg-white dark:bg-night-800 rounded-lg border border-gray-200 dark:border-night-600 p-6 shadow-sm card-glow">
          <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-900 dark:text-gray-100 text-glow">
            <span className="mr-2">🎨</span>
            Appearance
          </h3>
          
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
                  background: 'linear-gradient(45deg, #22c55e, #84cc16)'
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
              🌙 Dark mode features the Avatar Pandora-inspired nighttime color palette with deep ocean blues and vibrant bioluminescent accents.
            </div>
          </div>
        </div>

        {/* Theme Information */}
        <div className="bg-white dark:bg-night-800 rounded-lg border border-gray-200 dark:border-night-600 p-6 shadow-sm lg:col-span-2 xl:col-span-3 card-glow">
          <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-900 dark:text-gray-100 text-glow">
            <span className="mr-2">🎭</span>
            Color Theme Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-200 mb-3">Current Theme: {isDarkMode ? 'Nighttime (Dark Mode)' : 'Daytime (Light Mode)'}</h4>
              <div className="flex flex-wrap gap-2 mb-3">
                {isDarkMode ? (
                  // Dark mode colors
                  <>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#05D59F' }}></div>
                      <span className="text-sm">Emerald</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#571BB0' }}></div>
                      <span className="text-sm">Grape</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#07BEBF' }}></div>
                      <span className="text-sm">Robin Egg Blue</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#0A1225' }}></div>
                      <span className="text-sm">Oxford Blue</span>
                    </div>
                  </>
                ) : (
                  // Light mode colors
                  <>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#144B7B' }}></div>
                      <span className="text-sm">Indigo Dye</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#499BA0' }}></div>
                      <span className="text-sm">Dark Cyan</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#7293A2' }}></div>
                      <span className="text-sm">Air Force Blue</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#134734' }}></div>
                      <span className="text-sm">Brunswick Green</span>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-200 mb-3">{isDarkMode ? 'Alternative: Daytime (Light Mode)' : 'Alternative: Nighttime (Dark Mode)'}</h4>
              <div className="flex flex-wrap gap-2 mb-3">
                {!isDarkMode ? (
                  // Show dark mode colors when in light mode
                  <>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#05D59F' }}></div>
                      <span className="text-sm">Emerald</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#571BB0' }}></div>
                      <span className="text-sm">Grape</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#07BEBF' }}></div>
                      <span className="text-sm">Robin Egg Blue</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#0A1225' }}></div>
                      <span className="text-sm">Oxford Blue</span>
                    </div>
                  </>
                ) : (
                  // Show light mode colors when in dark mode
                  <>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#144B7B' }}></div>
                      <span className="text-sm">Indigo Dye</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#499BA0' }}></div>
                      <span className="text-sm">Dark Cyan</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#7293A2' }}></div>
                      <span className="text-sm">Air Force Blue</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#134734' }}></div>
                      <span className="text-sm">Brunswick Green</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="text-sm text-gray-600 dark:text-gray-300 p-3 bg-gray-50 dark:bg-night-700 rounded-lg mt-4">
            The BIOME application uses an Avatar Pandora-inspired color palette that reflects the bioimage analysis environment with natural and technological elements.
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsTab;
