import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import Environment from '../utils/environmentDetection';

function Settings() {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [isTauri, setIsTauri] = useState(false);
  const [projectFolder, setProjectFolder] = useState('');
  const [autoBackup, setAutoBackup] = useState(false);
  const [backupFrequency, setBackupFrequency] = useState('weekly');

  useEffect(() => {
    const checkTauriEnvironment = async () => {
      const result = Environment.isTauri();
      setIsTauri(result);
    };
    checkTauriEnvironment();

    // Load saved settings
    const savedProjectFolder = localStorage.getItem('biome_project_folder');
    if (savedProjectFolder) {
      setProjectFolder(savedProjectFolder);
    }
    
    const savedAutoBackup = localStorage.getItem('biome_auto_backup');
    if (savedAutoBackup !== null) {
      setAutoBackup(savedAutoBackup === 'true');
    }
    
    const savedBackupFrequency = localStorage.getItem('biome_backup_frequency');
    if (savedBackupFrequency) {
      setBackupFrequency(savedBackupFrequency);
    }
  }, []);

  const handleDarkModeChange = () => {
    toggleDarkMode();
  };

  const handleSelectProjectFolder = async () => {
    if (!isTauri) return;
    
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Default Project Folder'
      });
      
      if (selected) {
        setProjectFolder(selected);
        localStorage.setItem('biome_project_folder', selected);
      }
    } catch (error) {
      console.error('Failed to select folder:', error);
    }
  };

  const handleAutoBackupChange = (enabled) => {
    setAutoBackup(enabled);
    localStorage.setItem('biome_auto_backup', enabled.toString());
  };

  const handleBackupFrequencyChange = (frequency) => {
    setBackupFrequency(frequency);
    localStorage.setItem('biome_backup_frequency', frequency);
  };

  const openDataFolder = async () => {
    if (!isTauri) return;
    
    try {
      const { appDataDir } = await import('@tauri-apps/api/path');
      const { invoke } = await import('@tauri-apps/api/core');
      const dataDir = await appDataDir();
      // Use existing Tauri command to open folder in explorer
      await invoke('open_in_explorer', { path: dataDir });
    } catch (error) {
      console.error('Failed to open data folder:', error);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
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
                  background: 'linear-gradient(45deg, #22c55e, #84cc16)'
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
              🌙 Dark mode uses a bioluminescent forest palette with deep ocean blues and vibrant glow accents. Light mode evokes primal shores with soft sands and teal waters.
            </div>
          </div>
        </div>

        {/* Data Management - Desktop Only */}
        {isTauri && (
          <div className="bg-white dark:bg-night-800 rounded-lg border border-gray-200 dark:border-night-600 p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Data Management</h3>
            
            <div className="space-y-4">
              {/* Default Project Folder */}
              <div>
                <label className="font-medium text-gray-700 dark:text-gray-200 block mb-2">Default Project Folder</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={projectFolder}
                    readOnly
                    placeholder="Not configured"
                    className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-night-700 border border-gray-200 dark:border-night-600 rounded-lg text-gray-700 dark:text-gray-300 truncate"
                  />
                  <button
                    onClick={handleSelectProjectFolder}
                    className="px-3 py-2 text-sm font-medium rounded-lg bg-bioluminescent-500/20 text-bioluminescent-600 dark:text-bioluminescent-400 hover:bg-bioluminescent-500/30 border border-bioluminescent-500/30 transition-colors"
                  >
                    Browse
                  </button>
                </div>
              </div>

              {/* Auto Backup Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-gray-700 dark:text-gray-200">Auto Backup</label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Automatically back up database</p>
                </div>
                <button
                  onClick={() => handleAutoBackupChange(!autoBackup)}
                  className={`relative inline-flex h-6 w-11 rounded-full transition-colors duration-200 ease-in-out ${
                    autoBackup ? '' : 'bg-gray-200'
                  }`}
                  style={autoBackup ? {
                    background: 'linear-gradient(45deg, #22c55e, #84cc16)'
                  } : {}}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${
                      autoBackup ? 'translate-x-6' : 'translate-x-1'
                    } mt-1`}
                  />
                </button>
              </div>

              {/* Backup Frequency */}
              {autoBackup && (
                <div>
                  <label className="font-medium text-gray-700 dark:text-gray-200 block mb-2">Backup Frequency</label>
                  <select
                    value={backupFrequency}
                    onChange={(e) => handleBackupFrequencyChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-night-700 border border-gray-200 dark:border-night-600 rounded-lg text-gray-700 dark:text-gray-300"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              )}

              {/* Open Data Folder */}
              <button
                onClick={openDataFolder}
                className="w-full flex items-center justify-center gap-2 p-3 bg-gray-50 dark:bg-night-700 border border-gray-200 dark:border-night-600 rounded-lg hover:bg-gray-100 dark:hover:bg-night-600 transition-colors text-gray-700 dark:text-gray-300"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                </svg>
                Open Data Folder
              </button>
              
              <div className="text-sm text-gray-600 dark:text-gray-300 p-3 bg-gray-50 dark:bg-night-700 rounded-lg">
                <p className="mb-2">📁 <strong>Backup Location:</strong> Backups are saved to the <code className="px-1 py-0.5 bg-gray-200 dark:bg-night-600 rounded text-xs">backups/</code> folder inside your app data directory.</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">To restore from backup, go to Database Management and import the backup file. Make sure to also restore any project folders if doing a full recovery.</p>
              </div>
            </div>
          </div>
        )}

        {/* Help & Documentation */}
        <div className="bg-white dark:bg-night-800 rounded-lg p-6 shadow-sm lg:col-span-2 xl:col-span-3">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Help &amp; Documentation</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Browse user guides, feature references, and FAQs. Documentation is loaded live from the GitHub repository.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: 'getting-started', label: 'Getting Started', desc: 'Installation & first steps' },
              { id: 'projects', label: 'Projects', desc: 'Create & manage projects' },
              { id: 'faq', label: 'FAQ', desc: 'Common questions' },
              { id: 'changelog', label: 'Changelog', desc: "What's new" },
            ].map(({ id, label, desc }) => (
              <Link
                key={id}
                to={`/help/${id}`}
                className="flex flex-col gap-1 p-3 rounded-lg bg-gray-50 dark:bg-night-700 hover:bg-bioluminescent-500/10 hover:border-bioluminescent-500/40 transition-colors group"
              >
                <span className="font-medium text-sm text-gray-900 dark:text-gray-100 group-hover:text-bioluminescent-600 dark:group-hover:text-bioluminescent-400 transition-colors">{label}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{desc}</span>
              </Link>
            ))}
          </div>
          <div className="mt-3">
            <Link
              to="/help"
              className="inline-flex items-center gap-1 text-sm text-bioluminescent-600 dark:text-bioluminescent-400 hover:underline"
            >
              Open full documentation →
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Settings;
