import React, { useState } from 'react';
import { databaseService } from '../services/api';

function DatabaseManager({ onDatabaseChange }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [showInfo, setShowInfo] = useState(false);

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Show confirmation dialog for import
        if (!window.confirm(
            'Importing a database will overwrite your current database. ' +
            'Make sure you have backed up any important data. Continue?'
        )) {
            event.target.value = '';
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            await databaseService.importDatabase(file);
            setSuccess('Database imported successfully');
            if (onDatabaseChange) onDatabaseChange();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
            event.target.value = '';
        }
    };

    const handleExport = async () => {
        try {
            const blob = await databaseService.exportDatabase();
            
            // Generate filename with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const defaultFilename = `database_backup_${timestamp}.sqlite`;
            
            if (window.__TAURI__) {
                // Tauri path
                const { save } = await import('@tauri-apps/plugin-dialog');
                const { writeBinaryFile } = await import('@tauri-apps/plugin-fs');
                
                const path = await save({
                    title: 'Export Database',
                    defaultPath: defaultFilename,
                    filters: [{
                        name: 'SQLite Database',
                        extensions: ['sqlite']
                    }]
                });

                if (path) {
                    const buffer = await blob.arrayBuffer();
                    await writeBinaryFile(path, buffer);
                    setSuccess(`Database has been exported to: ${path}`);
                }
            } else {
                // Fallback to traditional download
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = defaultFilename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                setSuccess('Database has been exported');
            }
        } catch (err) {
            console.error('Failed to export database:', err);
            setError('Failed to export database. Please try again.');
        }
    };

    const handleReset = async () => {
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            await databaseService.resetDatabase();
            setSuccess('Database reset successfully. Sample data has been initialized.');
            if (onDatabaseChange) onDatabaseChange();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
            setShowResetConfirm(false);
        }
    };

    return (
        <div className="database-manager-container w-full" key="database-manager">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

                {error && (
                    <div className="mb-4 p-4 bg-clay-100 dark:bg-clay-900/50 border-l-4 border-clay-500 text-clay-700 dark:text-clay-300 rounded shadow-sm">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-4 p-4 bg-forest-100 dark:bg-forest-900/50 border-l-4 border-forest-500 text-forest-700 dark:text-forest-300 rounded shadow-sm">
                        {success}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
                    {/* Export Database */}
                    <div className="bg-white dark:bg-night-800 rounded-lg border border-gray-200 dark:border-night-600 p-6 shadow-sm hover:shadow-lg transition-colors flex flex-col h-full">
                        <div className="flex flex-col items-center text-center flex-1">
                            <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-night-700 flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Export Database</h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-auto">Download a backup of your current database</p>
                            <button
                                onClick={handleExport}
                                disabled={loading}
                                className="w-full mt-4 py-3 px-4 text-sm font-medium rounded-xl backdrop-filter backdrop-blur-md bg-gradient-to-r from-green-400 to-lime-500 hover:from-green-500 hover:to-lime-600 text-white shadow-lg hover:shadow-xl border border-white/20 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                {loading ? 'Exporting...' : 'Export Database'}
                            </button>
                        </div>
                    </div>

                    {/* Import Database */}
                    <div className="bg-white dark:bg-night-800 rounded-lg border border-gray-200 dark:border-night-600 p-6 shadow-sm hover:shadow-lg transition-colors flex flex-col h-full">
                        <div className="flex flex-col items-center text-center flex-1">
                            <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-night-700 flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Import Database</h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-auto">Restore a database from a backup file</p>
                            <input
                                type="file"
                                accept=".sqlite"
                                onChange={handleFileUpload}
                                disabled={loading}
                                className="hidden"
                                id="database-file"
                            />
                            <label
                                htmlFor="database-file"
                                className="w-full mt-4 py-3 px-4 text-sm font-medium rounded-xl backdrop-filter backdrop-blur-md bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500 cursor-pointer"
                                style={{
                                    opacity: loading ? 0.5 : 1,
                                    cursor: loading ? 'not-allowed' : 'pointer'
                                }}
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                {loading ? 'Importing...' : 'Import Database'}
                            </label>
                        </div>
                    </div>

                    {/* Reset Database */}
                    <div className="bg-white dark:bg-night-800 rounded-lg border border-gray-200 dark:border-night-600 p-6 shadow-sm hover:shadow-lg transition-colors flex flex-col h-full">
                        <div className="flex flex-col items-center text-center flex-1">
                            <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-night-700 flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Reset Database</h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-auto">Reset the database to its initial state</p>
                            {!showResetConfirm ? (
                                <button
                                    onClick={() => setShowResetConfirm(true)}
                                    disabled={loading}
                                    className="w-full mt-4 py-3 px-4 text-sm font-medium rounded-xl backdrop-filter backdrop-blur-md bg-gradient-to-r from-red-400 to-orange-500 hover:from-red-500 hover:to-orange-600 text-white shadow-lg hover:shadow-xl border border-white/20 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Reset Database
                                </button>
                            ) : (
                                <div className="space-y-4 mt-4 w-full">
                                    <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500 text-orange-700 dark:text-orange-300 text-sm rounded">
                                        <p className="font-medium mb-2">⚠️ Warning: This action cannot be undone!</p>
                                        <ul className="list-disc list-inside text-sm space-y-1">
                                            <li>All project data will be deleted</li>
                                            <li>All user and group data will be reset</li>
                                            <li>Sample data will be reinitialized</li>
                                        </ul>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleReset}
                                            disabled={loading}
                                            className="flex-1 py-2 px-3 text-sm font-medium rounded-xl backdrop-filter backdrop-blur-md bg-gradient-to-r from-red-400 to-orange-500 hover:from-red-500 hover:to-orange-600 text-white shadow-lg hover:shadow-xl border border-white/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500"
                                        >
                                            {loading ? 'Resetting...' : 'Confirm Reset'}
                                        </button>
                                        <button
                                            onClick={() => setShowResetConfirm(false)}
                                            disabled={loading}
                                            className="flex-1 py-2 px-3 text-sm font-medium rounded-xl backdrop-filter backdrop-blur-md bg-gradient-to-r from-purple-400 to-indigo-500 hover:from-purple-500 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl border border-white/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Database Information Section */}
                <div className="mt-8 bg-white dark:bg-night-800 rounded-lg border border-gray-200 dark:border-night-600 shadow-sm">
                    <button 
                        onClick={() => setShowInfo(!showInfo)}
                        className="w-full p-6 text-left hover:bg-gray-50 dark:hover:bg-night-700 transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    >
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center justify-between">
                            <span className="flex items-center">
                                <span className="mr-2">ℹ️</span>
                                Database Information
                            </span>
                            <svg 
                                className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${showInfo ? 'rotate-180' : ''}`} 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </h3>
                    </button>
                    
                    {showInfo && (
                        <div className="px-6 pb-6 pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Database Structure</h4>
                                    <pre className="p-3 bg-gray-50 dark:bg-night-700 rounded-md overflow-auto text-sm text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-night-600">
{`Tables:
- projects (stores project information)
- users (user accounts)
- groups (organizational groups)
- journal_entries (project journal entries)
- activities (project activity logs)
`}
                                    </pre>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Usage Tips</h4>
                                    <ul className="list-disc list-inside space-y-1 text-gray-800 dark:text-gray-200 text-sm">
                                        <li>Export your database regularly for backup</li>
                                        <li>Import your database to restore from a backup</li>
                                        <li>Reset the database only when necessary</li>
                                        <li>Remember that resetting will delete all data</li>
                                        <li>The database file is stored locally on your device</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default DatabaseManager;