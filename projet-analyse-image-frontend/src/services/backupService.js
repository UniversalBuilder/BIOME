/**
 * backupService.js
 * Handles automatic database backup scheduling.
 * Reads settings from localStorage (autoBackup, backupFrequency) and
 * triggers a server-side backup when the configured interval has elapsed.
 */
import { databaseService } from './api';

const LS_LAST_BACKUP = 'biome_last_backup_date';
const LS_AUTO_BACKUP = 'biome_auto_backup';
const LS_BACKUP_FREQ = 'biome_backup_frequency';

/**
 * Returns the backup interval in milliseconds for a given frequency string.
 */
const getIntervalMs = (frequency) => {
    switch (frequency) {
        case 'hourly': return 60 * 60 * 1000;
        case 'daily': return 24 * 60 * 60 * 1000;
        case 'weekly': return 7 * 24 * 60 * 60 * 1000;
        default: return 24 * 60 * 60 * 1000; // default: daily
    }
};

/**
 * Check whether a backup is due and, if so, create one.
 * Called once on app start.
 *
 * @param {function} [onBackupCreated] - optional callback(filename) after successful backup
 */
export const checkAndRunAutoBackup = async (onBackupCreated) => {
    try {
        const autoBackup = localStorage.getItem(LS_AUTO_BACKUP);
        if (autoBackup !== 'true') return;

        const frequency = localStorage.getItem(LS_BACKUP_FREQ) || 'daily';
        const intervalMs = getIntervalMs(frequency);

        const lastBackupRaw = localStorage.getItem(LS_LAST_BACKUP);
        const lastBackup = lastBackupRaw ? new Date(lastBackupRaw).getTime() : 0;
        const now = Date.now();

        if (now - lastBackup < intervalMs) return; // Not due yet

        const result = await databaseService.createBackup();
        localStorage.setItem(LS_LAST_BACKUP, new Date().toISOString());

        console.log('[BackupService] Auto-backup created:', result.filename);
        if (typeof onBackupCreated === 'function') {
            onBackupCreated(result.filename);
        }
    } catch (err) {
        console.error('[BackupService] Auto-backup failed:', err);
    }
};

/**
 * Manually trigger a backup and update the last-backup timestamp.
 *
 * @returns {object} result from server { success, filename, created_at }
 */
export const runManualBackup = async () => {
    const result = await databaseService.createBackup();
    localStorage.setItem(LS_LAST_BACKUP, new Date().toISOString());
    return result;
};

/**
 * Returns the ISO string of the last recorded backup, or null.
 */
export const getLastBackupDate = () => {
    return localStorage.getItem(LS_LAST_BACKUP) || null;
};

/**
 * Persist auto-backup settings to localStorage.
 *
 * @param {boolean} enabled
 * @param {string} frequency  'hourly' | 'daily' | 'weekly'
 */
export const saveBackupSettings = (enabled, frequency) => {
    localStorage.setItem(LS_AUTO_BACKUP, String(enabled));
    localStorage.setItem(LS_BACKUP_FREQ, frequency);
};
