import React, { useState, useEffect, useCallback } from 'react';
import { databaseService } from '../services/api';
import { runManualBackup, getLastBackupDate } from '../services/backupService';
import WizardFormModal from './WizardFormModal';

function DatabaseManager({ onDatabaseChange }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [showInfo, setShowInfo] = useState(true);
    // Import confirmation modal
    const [showImportConfirm, setShowImportConfirm] = useState(false);
    const [pendingImportFile, setPendingImportFile] = useState(null);
    // Backups
    const [backups, setBackups] = useState([]);
    const [backupsLoading, setBackupsLoading] = useState(false);
    const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
    const [restoringFilename, setRestoringFilename] = useState(null);
    const [lastBackupDate, setLastBackupDate] = useState(null);
    const [backupMessage, setBackupMessage] = useState(null); // { type: 'success'|'error', text }
    // Demo data loader
    const [showDemoConfirm, setShowDemoConfirm] = useState(false);
    const [demoLoading, setDemoLoading] = useState(false);

    const loadBackups = useCallback(async () => {
        setBackupsLoading(true);
        try {
            const list = await databaseService.listBackups();
            setBackups(list);
        } catch (err) {
            console.error('Failed to load backups:', err);
        } finally {
            setBackupsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadBackups();
        setLastBackupDate(getLastBackupDate());
    }, [loadBackups]);

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        setPendingImportFile(file);
        setShowImportConfirm(true);
        // Reset the input so the same file can be re-selected
        event.target.value = '';
    };

    const handleConfirmImport = async () => {
        setShowImportConfirm(false);
        if (!pendingImportFile) return;
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            await databaseService.importDatabase(pendingImportFile);
            setSuccess('Database imported successfully');
            if (onDatabaseChange) onDatabaseChange();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
            setPendingImportFile(null);
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

    const handleCreateBackup = async () => {
        setLoading(true);
        setBackupMessage(null);
        setError(null);
        setSuccess(null);
        try {
            const result = await runManualBackup();
            setBackupMessage({ type: 'success', text: `Backup created: ${result.filename}` });
            setLastBackupDate(new Date().toISOString());
            await loadBackups();
        } catch (err) {
            setBackupMessage({ type: 'error', text: 'Failed to create backup: ' + err.message });
        } finally {
            setLoading(false);
        }
    };

    const handleRestoreClick = (filename) => {
        setRestoringFilename(filename);
        setShowRestoreConfirm(true);
    };

    const handleConfirmRestore = async () => {
        setShowRestoreConfirm(false);
        if (!restoringFilename) return;
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            await databaseService.restoreBackup(restoringFilename);
            setSuccess(`Database restored from ${restoringFilename}. Please reload the app to see changes.`);
            if (onDatabaseChange) onDatabaseChange();
        } catch (err) {
            setError('Failed to restore: ' + err.message);
        } finally {
            setLoading(false);
            setRestoringFilename(null);
        }
    };

    const handleReset = async () => {
        setLoading(true);
        setSuccess(null);

        try {
            await databaseService.resetDatabase();
            setSuccess('Database has been reset to an empty state.');
            if (onDatabaseChange) onDatabaseChange();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
            setShowResetConfirm(false);
        }
    };

    const handleLoadDemo = async () => {
        setDemoLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const result = await databaseService.loadDemoData();
            const { counts, backup_created } = result;
            let msg = `Demo data loaded: ${counts.projects} projects, ${counts.users} users, ${counts.groups} groups, ${counts.journal_entries} journal entries.`;
            if (backup_created) msg += ` Your previous data was saved as: ${backup_created}`;
            setSuccess(msg);
            await loadBackups();
            if (onDatabaseChange) onDatabaseChange();
        } catch (err) {
            setError('Failed to load demo data: ' + err.message);
        } finally {
            setDemoLoading(false);
            setShowDemoConfirm(false);
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full">
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
                                            <li>All project data will be permanently deleted</li>
                                            <li>All users, groups, and journal entries will be removed</li>
                                            <li>The database will be left completely empty</li>
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

                    {/* Load Demo Data */}
                    <div className="bg-white dark:bg-night-800 rounded-lg border border-violet-200 dark:border-violet-800/40 p-6 shadow-sm hover:shadow-lg transition-colors flex flex-col h-full">
                        <div className="flex flex-col items-center text-center flex-1">
                            <div className="w-12 h-12 rounded-full bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center mb-4">
                                <svg className="w-6 h-6 text-violet-500 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Load Demo Data</h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-auto">Populate with sample bioimage projects and users</p>
                            <button
                                onClick={() => setShowDemoConfirm(true)}
                                disabled={loading || demoLoading}
                                className="w-full mt-4 py-3 px-4 text-sm font-medium rounded-xl backdrop-filter backdrop-blur-md bg-gradient-to-r from-violet-400 to-purple-500 hover:from-violet-500 hover:to-purple-600 text-white shadow-lg hover:shadow-xl border border-white/20 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                </svg>
                                {demoLoading ? 'Loading…' : 'Load Demo Data'}
                            </button>
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
                                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Hybrid Storage Model</h4>
                                    <div className="p-3 bg-gray-50 dark:bg-night-700 rounded-md text-sm text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-night-600 space-y-3">
                                        <div>
                                            <span className="font-medium text-bioluminescent-600 dark:text-bioluminescent-400">SQLite Database</span>
                                            <p className="text-xs mt-1 text-gray-600 dark:text-gray-400">Stores project metadata, users, groups, journal entries, and activity logs.</p>
                                        </div>
                                        <div>
                                            <span className="font-medium text-bioluminescent-600 dark:text-bioluminescent-400">Project Folders</span>
                                            <p className="text-xs mt-1 text-gray-600 dark:text-gray-400">Each project has its own folder containing reference images, resources, and output files.</p>
                                        </div>
                                        <div className="pt-2 border-t border-gray-200 dark:border-night-600">
                                            <p className="text-xs text-gray-500 dark:text-gray-500">Export/Import operations back up the database only. Project folders are managed separately via the filesystem.</p>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Usage Tips</h4>
                                    <ul className="list-disc list-inside space-y-1.5 text-gray-800 dark:text-gray-200 text-sm">
                                        <li>Export regularly to back up project metadata</li>
                                        <li>Project files are stored in your configured project folder</li>
                                        <li>Import restores metadata — project folders must exist</li>
                                        <li>Reset clears all metadata but doesn't delete project folders</li>
                                        <li>For full backup, copy both the database export and project folders</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

                {/* Automatic Backups Section */}
                <div className="mt-6 bg-white dark:bg-night-800 rounded-lg border border-bioluminescent-200 dark:border-bioluminescent-800/50 shadow-sm">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-bioluminescent-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-bioluminescent-500"></span>
                                </span>
                                Automatic Backups
                            </h3>
                            <button
                                onClick={handleCreateBackup}
                                disabled={loading}
                                className="px-4 py-2 text-sm font-medium rounded-xl text-white shadow-sm transition-all duration-200 disabled:opacity-50"
                                style={{ background: 'linear-gradient(45deg, #00BFFF, #0080FF)' }}
                            >
                                {loading ? 'Creating…' : '+ Create Backup Now'}
                            </button>
                        </div>

                        {backupMessage && (
                            <div className={`mb-3 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 ${
                                backupMessage.type === 'success'
                                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/50'
                                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/50'
                            }`}>
                                <span>{backupMessage.type === 'success' ? '✓' : '✗'}</span>
                                <span>{backupMessage.text}</span>
                                <button onClick={() => setBackupMessage(null)} className="ml-auto text-current opacity-60 hover:opacity-100">✕</button>
                            </div>
                        )}
                        {lastBackupDate && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                Last backup: {new Date(lastBackupDate).toLocaleString()}
                            </p>
                        )}

                        {backupsLoading ? (
                            <p className="text-sm text-gray-500">Loading backups…</p>
                        ) : backups.length === 0 ? (
                            <div className="p-4 bg-gray-50 dark:bg-night-700 rounded-lg text-sm text-gray-500 dark:text-gray-400 text-center">
                                No backups yet. Click <strong>Create Backup Now</strong> or enable Auto-Backup in Settings.
                            </div>
                        ) : (
                            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-night-600">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 dark:bg-night-700">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Filename</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Size</th>
                                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-night-600">
                                        {backups.map((b) => (
                                            <tr key={b.filename} className="hover:bg-gray-50 dark:hover:bg-night-700 transition-colors">
                                                <td className="px-4 py-2 font-mono text-xs text-gray-700 dark:text-gray-300">{b.filename}</td>
                                                <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{new Date(b.created_at).toLocaleString()}</td>
                                                <td className="px-4 py-2 text-right text-gray-500">{Math.round(b.size / 1024)} KB</td>
                                                <td className="px-4 py-2 text-right">
                                                    <button
                                                        onClick={() => handleRestoreClick(b.filename)}
                                                        disabled={loading}
                                                        className="px-3 py-1 text-xs font-medium rounded-lg text-white transition-all duration-200 disabled:opacity-50"
                                                        style={{ background: 'linear-gradient(45deg, #8B5CF6, #6366F1)' }}
                                                    >
                                                        Restore
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
                            Up to 5 backups are kept. Older backups are pruned automatically.
                        </p>
                    </div>
                </div>

      {/* Import confirmation modal */}
      <WizardFormModal
        isOpen={showImportConfirm}
        title="Import Database"
        inlineError={null}
        onClose={() => { setShowImportConfirm(false); setPendingImportFile(null); }}
        onSubmit={(e) => { e.preventDefault(); handleConfirmImport(); }}
        submitLabel="Import"
        loading={false}
      >
        <div className="text-sm text-gray-700 dark:text-gray-200 space-y-2">
          <p className="font-medium">Importing will overwrite your current database.</p>
          <p>File: <span className="font-mono">{pendingImportFile?.name}</span></p>
          <p className="text-xs text-gray-500">Make sure you have created a backup before continuing.</p>
        </div>
      </WizardFormModal>

      {/* Restore confirmation modal */}
      <WizardFormModal
        isOpen={showRestoreConfirm}
        title="Restore from Backup"
        inlineError={null}
        onClose={() => { setShowRestoreConfirm(false); setRestoringFilename(null); }}
        onSubmit={(e) => { e.preventDefault(); handleConfirmRestore(); }}
        submitLabel="Restore"
        loading={false}
      >
        <div className="text-sm text-gray-700 dark:text-gray-200 space-y-2">
          <p className="font-medium">This action will replace the current database with the selected backup.</p>
          <p>Backup: <span className="font-mono text-xs">{restoringFilename}</span></p>
          <p className="text-xs text-amber-600 dark:text-amber-400">Any changes made after this backup was created will be lost.</p>
        </div>
      </WizardFormModal>

      {/* Demo data confirmation modal */}
      <WizardFormModal
        isOpen={showDemoConfirm}
        title="Load Demo Data"
        inlineError={null}
        onClose={() => setShowDemoConfirm(false)}
        onSubmit={(e) => { e.preventDefault(); handleLoadDemo(); }}
        submitLabel={demoLoading ? 'Loading…' : 'Load Demo Data'}
        loading={demoLoading}
      >
        <div className="text-sm text-gray-700 dark:text-gray-200 space-y-3">
          <p className="font-medium">This will replace all current data with a set of demo bioimage projects, users, and groups.</p>
          <div className="p-3 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700/50 rounded-lg text-xs space-y-1">
            <p className="font-semibold text-violet-700 dark:text-violet-300">What will be loaded:</p>
            <ul className="list-disc list-inside text-violet-600 dark:text-violet-400 space-y-0.5">
              <li>3 imaging core groups</li>
              <li>6 researchers</li>
              <li>10 bioimage analysis projects</li>
              <li>~20 journal entries</li>
            </ul>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 rounded text-xs text-amber-700 dark:text-amber-300">
            <p className="font-semibold mb-0.5">💾 Automatic backup</p>
            <p>If your database already contains data, a safety backup will be created automatically before loading demo data.</p>
          </div>
        </div>
      </WizardFormModal>
        </div>
    );
}

export default DatabaseManager;