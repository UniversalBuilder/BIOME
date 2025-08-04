// Diagnostic logging utility for Tauri environment

import Environment from './environmentDetection';

// Constants for different log levels
export const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  CRITICAL: 4
};

class DiagnosticLogger {
  constructor() {
    this.logLevel = LOG_LEVELS.INFO; // Default log level
    this.logs = []; // Store logs in memory for retrieval
    this.maxLogs = 1000; // Prevent memory leaks
    this.isTauri = null; // Will be determined on first log
    this.sessionStartTime = new Date();
    this.sessionId = this.generateSessionId();
    
    // Initialize with startup information
    this.initLogger();
  }
  
  /**
   * Generate a unique session ID
   */
  generateSessionId() {
    return `biome-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
  }
  
  /**
   * Initialize logger with system information
   */
  initLogger() {
    // Get environment information with full debug output
    const env = Environment.detect(true);
    this.isTauri = env.isTauri;
    
    // Log startup information
    this.info('DiagnosticLogger', 'Initializing diagnostic logging system');
    this.info('Environment', `Running in ${this.isTauri ? 'DESKTOP' : 'WEB'} mode`);
    this.debug('Session', `Session ID: ${this.sessionId}`);
    this.debug('Environment', `Node environment: ${process.env.NODE_ENV}`);
    
    // Log environment detection details
    const detectionMethods = [];
    if (env.hasTauriGlobal) detectionMethods.push('window.__TAURI__');
    if (env.isTauriProtocol) detectionMethods.push('tauri: protocol');
    if (env.hasTauriIPC) detectionMethods.push('window.__TAURI_IPC__');
    if (env.hasTauriMetadata) detectionMethods.push('window.__TAURI_METADATA__');
    if (env.hasDesktopFeatures) detectionMethods.push('desktop features');
    if (env.hasTauriWindowFeatures) detectionMethods.push('Tauri window features');
    
    if (detectionMethods.length > 0) {
      this.debug('Environment', `Detected via: ${detectionMethods.join(', ')}`);
    }
    
    if (env.forceTauri) {
      this.warn('Environment', 'Desktop mode forced via URL parameter');
    } else if (env.forceWeb) {
      this.warn('Environment', 'Web mode forced via URL parameter');
    } else if (env.storedForceTauri) {
      this.warn('Environment', 'Desktop mode forced via localStorage setting');
    } else if (env.storedForceWeb) {
      this.warn('Environment', 'Web mode forced via localStorage setting');
    }
    
    // Log browser information
    if (typeof navigator !== 'undefined') {
      this.debug('Browser', `User agent: ${navigator.userAgent}`);
      this.debug('Browser', `Language: ${navigator.language}`);
      this.debug('Screen', `Dimensions: ${window.innerWidth}x${window.innerHeight}, Pixel ratio: ${window.devicePixelRatio}`);
    }
    
    // Set up unhandled error logging
    this.setupErrorHandling();
  }
  
  /**
   * Set up global error handling
   */
  setupErrorHandling() {
    if (typeof window !== 'undefined') {
      // Capture unhandled exceptions
      window.addEventListener('error', (event) => {
        this.error('UnhandledException', event.message, {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack
        });
      });
      
      // Capture unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        this.error('UnhandledRejection', event.reason?.message || 'Unknown promise rejection', {
          reason: event.reason?.toString(),
          stack: event.reason?.stack
        });
      });
    }
  }
  
  /**
   * Set the current log level
   * @param {number} level - The log level from LOG_LEVELS
   */
  setLogLevel(level) {
    this.logLevel = level;
    this.info('DiagnosticLogger', `Log level set to ${Object.keys(LOG_LEVELS).find(key => LOG_LEVELS[key] === level)}`);
  }
  
  /**
   * Create a log entry
   * @param {number} level - The log level
   * @param {string} source - The source of the log
   * @param {string} message - The log message
   * @param {object} data - Additional data to log
   */
  log(level, source, message, data = {}) {
    // Skip if below current log level
    if (level < this.logLevel) return;
    
    // Create log entry
    const entry = {
      timestamp: new Date(),
      level,
      levelName: Object.keys(LOG_LEVELS).find(key => LOG_LEVELS[key] === level) || 'UNKNOWN',
      source,
      message,
      data,
      environment: this.isTauri ? 'DESKTOP' : 'WEB',
      sessionId: this.sessionId
    };
    
    // Add to in-memory logs
    this.logs.push(entry);
    
    // Prevent memory leaks by limiting log size
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    
    // Format for console
    let levelStyle, sourceStyle, messageStyle;
    switch (level) {
      case LOG_LEVELS.DEBUG:
        levelStyle = 'color: #6c757d; font-weight: bold';
        sourceStyle = 'color: #6c757d';
        messageStyle = 'color: #6c757d';
        console.debug(`%c[${entry.levelName}] %c${source}: %c${message}`, levelStyle, sourceStyle, messageStyle, data);
        break;
      case LOG_LEVELS.INFO:
        levelStyle = 'color: #0288d1; font-weight: bold';
        sourceStyle = 'color: #0288d1';
        messageStyle = 'color: inherit';
        console.info(`%c[${entry.levelName}] %c${source}: %c${message}`, levelStyle, sourceStyle, messageStyle, data);
        break;
      case LOG_LEVELS.WARN:
        levelStyle = 'color: #ff9800; font-weight: bold';
        sourceStyle = 'color: #ff9800';
        messageStyle = 'color: inherit';
        console.warn(`%c[${entry.levelName}] %c${source}: %c${message}`, levelStyle, sourceStyle, messageStyle, data);
        break;
      case LOG_LEVELS.ERROR:
      case LOG_LEVELS.CRITICAL:
        levelStyle = 'color: #d32f2f; font-weight: bold';
        sourceStyle = 'color: #d32f2f';
        messageStyle = 'color: inherit';
        console.error(`%c[${entry.levelName}] %c${source}: %c${message}`, levelStyle, sourceStyle, messageStyle, data);
        break;
      default:
        // Default to info styling for unknown log levels
        levelStyle = 'color: #0288d1; font-weight: bold';
        sourceStyle = 'color: #0288d1';
        messageStyle = 'color: inherit';
        console.log(`%c[${entry.levelName}] %c${source}: %c${message}`, levelStyle, sourceStyle, messageStyle, data);
        break;
    }
    
    // Implement additional log destinations (file, remote, etc.) here
    
    return entry;
  }
  
  /**
   * Log debug message
   * @param {string} source - The source of the log
   * @param {string} message - The log message
   * @param {object} data - Additional data to log
   */
  debug(source, message, data = {}) {
    return this.log(LOG_LEVELS.DEBUG, source, message, data);
  }
  
  /**
   * Log info message
   * @param {string} source - The source of the log
   * @param {string} message - The log message
   * @param {object} data - Additional data to log
   */
  info(source, message, data = {}) {
    return this.log(LOG_LEVELS.INFO, source, message, data);
  }
  
  /**
   * Log warning message
   * @param {string} source - The source of the log
   * @param {string} message - The log message
   * @param {object} data - Additional data to log
   */
  warn(source, message, data = {}) {
    return this.log(LOG_LEVELS.WARN, source, message, data);
  }
  
  /**
   * Log error message
   * @param {string} source - The source of the log
   * @param {string} message - The log message
   * @param {object} data - Additional data to log
   */
  error(source, message, data = {}) {
    return this.log(LOG_LEVELS.ERROR, source, message, data);
  }
  
  /**
   * Log critical message
   * @param {string} source - The source of the log
   * @param {string} message - The log message
   * @param {object} data - Additional data to log
   */
  critical(source, message, data = {}) {
    return this.log(LOG_LEVELS.CRITICAL, source, message, data);
  }
  
  /**
   * Get all logs
   * @returns {Array} All logs
   */
  getAllLogs() {
    return [...this.logs];
  }
  
  /**
   * Get logs filtered by level
   * @param {number} level - The minimum log level to include
   * @returns {Array} Filtered logs
   */
  getLogsByLevel(level) {
    return this.logs.filter(log => log.level >= level);
  }
  
  /**
   * Get logs filtered by source
   * @param {string} source - The source to filter by
   * @returns {Array} Filtered logs
   */
  getLogsBySource(source) {
    return this.logs.filter(log => log.source === source);
  }
  
  /**
   * Export logs to JSON
   * @returns {string} JSON string of logs
   */
  exportLogs() {
    return JSON.stringify({
      sessionId: this.sessionId,
      sessionStart: this.sessionStartTime,
      sessionEnd: new Date(),
      environment: this.isTauri ? 'DESKTOP' : 'WEB',
      nodeEnv: process.env.NODE_ENV,
      logs: this.logs
    }, null, 2);
  }
  
  /**
   * Clear all logs
   */
  clearLogs() {
    this.logs = [];
    this.info('DiagnosticLogger', 'Logs cleared');
  }
}

// Create singleton instance
const diagnostics = new DiagnosticLogger();

// Expose to global for console debugging
if (typeof window !== 'undefined') {
  window.BIOME = window.BIOME || {};
  window.BIOME.diagnostics = diagnostics;
}

export default diagnostics;
