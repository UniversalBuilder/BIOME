import React, { useState, useEffect } from 'react';
import Environment from '../utils/environmentDetection';

const DebugConsole = ({ isOpen, onClose }) => {
  const [debugInfo, setDebugInfo] = useState(null);
  const [backendStatus, setBackendStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
  };

  const checkDebugInfo = React.useCallback(async () => {
    setLoading(true);
    try {
      addLog('Gathering environment information...', 'info');
      
      // Use our reliable environment detection instead of Tauri invoke
      const env = Environment.detect(true);
      const info = {
        environment: env.isTauri ? 'DESKTOP' : 'WEB',
        platform: typeof navigator !== 'undefined' ? navigator.platform : 'Unknown',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
        protocol: typeof window !== 'undefined' ? window.location.protocol : 'Unknown',
        nodeEnv: process.env.NODE_ENV,
        screenSize: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'Unknown',
        detectionMethods: []
      };
      
      // Add detection methods
      if (env.hasTauriGlobal) info.detectionMethods.push('Tauri Global');
      if (env.isTauriProtocol) info.detectionMethods.push('Tauri Protocol');
      if (env.hasTauriIPC) info.detectionMethods.push('Tauri IPC');
      if (env.hasTauriMetadata) info.detectionMethods.push('Tauri Metadata');
      
      setDebugInfo(info);
      addLog('Environment info gathered successfully', 'success');
      console.log('Environment info:', info);
    } catch (error) {
      addLog(`Failed to gather environment info: ${error.message}`, 'error');
      console.error('Environment info error:', error);
    }
    setLoading(false);
  }, []);

  const checkBackendStatus = React.useCallback(async () => {
    setLoading(true);
    try {
      addLog('Testing backend connection...', 'info');
      
      // Test direct HTTP connection instead of using possibly undefined Tauri invoke
      const response = await fetch('http://localhost:3001/api/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        const status = {
          status: 'running',
          port: 3001,
          endpoint: 'http://localhost:3001',
          timestamp: new Date().toISOString(),
          response: data
        };
        setBackendStatus(status);
        addLog('Backend is running and responding', 'success');
        console.log('Backend status:', status);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      const status = {
        status: 'not_responding',
        port: 3001,
        endpoint: 'http://localhost:3001',
        timestamp: new Date().toISOString(),
        error: error.message
      };
      setBackendStatus(status);
      addLog(`Backend connection failed: ${error.message}`, 'error');
      console.error('Backend status error:', error);
    }
    setLoading(false);
  }, []);

  const testDirectConnection = async () => {
    addLog('Testing direct HTTP connection...', 'info');
    try {
      const response = await fetch('http://localhost:3001/api/test');
      if (response.ok) {
        const data = await response.text();
        addLog(`Direct connection successful: ${data}`, 'success');
      } else {
        addLog(`Direct connection failed: HTTP ${response.status}`, 'error');
      }
    } catch (error) {
      addLog(`Direct connection error: ${error.message}`, 'error');
    }
  };

  const copyLogsToClipboard = () => {
    const logText = logs.map(log => `[${log.timestamp}] ${log.type.toUpperCase()}: ${log.message}`).join('\n');
    navigator.clipboard.writeText(logText);
    addLog('Logs copied to clipboard', 'success');
  };

  useEffect(() => {
    if (isOpen) {
      checkDebugInfo();
      checkBackendStatus();
    }
  }, [isOpen, checkDebugInfo, checkBackendStatus]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-night-800 rounded-lg shadow-xl w-4/5 h-4/5 flex flex-col border border-gray-200 dark:border-night-600">
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200 dark:border-night-600">
          <h2 className="text-base font-medium text-gray-900 dark:text-gray-100">System Diagnostics</h2>
          <div className="flex gap-1">
            <button
              onClick={copyLogsToClipboard}
              className="px-2 py-1 bg-gray-100 dark:bg-night-700 text-gray-700 dark:text-gray-300 text-xs rounded hover:bg-gray-200 dark:hover:bg-night-600 transition-colors border border-gray-300 dark:border-night-500"
            >
              Copy Logs
            </button>
            <button
              onClick={onClose}
              className="px-2 py-1 bg-gray-100 dark:bg-night-700 text-gray-700 dark:text-gray-300 text-xs rounded hover:bg-gray-200 dark:hover:bg-night-600 transition-colors border border-gray-300 dark:border-night-500"
            >
              Close
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Status and Info */}
          <div className="w-1/2 p-3 border-r border-gray-200 dark:border-night-600 overflow-y-auto">
            <div className="space-y-3">
              {/* Quick Actions */}
              <div className="bg-gray-50 dark:bg-night-700 p-3 rounded border border-gray-200 dark:border-night-600">
                <h3 className="text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Diagnostics</h3>
                <div className="space-y-1">
                  <button
                    onClick={checkDebugInfo}
                    disabled={loading}
                    className="w-full px-2 py-1 bg-gray-100 dark:bg-night-600 text-gray-700 dark:text-gray-300 text-xs rounded hover:bg-gray-200 dark:hover:bg-night-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-gray-300 dark:border-night-500"
                  >
                    {loading ? 'Loading...' : 'Refresh Environment Info'}
                  </button>
                  <button
                    onClick={checkBackendStatus}
                    disabled={loading}
                    className="w-full px-2 py-1 bg-gray-100 dark:bg-night-600 text-gray-700 dark:text-gray-300 text-xs rounded hover:bg-gray-200 dark:hover:bg-night-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-gray-300 dark:border-night-500"
                  >
                    Check Backend
                  </button>
                  <button
                    onClick={testDirectConnection}
                    className="w-full px-2 py-1 bg-gray-100 dark:bg-night-600 text-gray-700 dark:text-gray-300 text-xs rounded hover:bg-gray-200 dark:hover:bg-night-500 transition-colors border border-gray-300 dark:border-night-500"
                  >
                    Test Connection
                  </button>
                </div>
              </div>

              {/* Backend Status */}
              {backendStatus && (
                <div className="bg-gray-50 dark:bg-night-700 p-3 rounded border border-gray-200 dark:border-night-600">
                  <h3 className="text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Backend Status</h3>
                  <div className="space-y-1 text-xs">
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      backendStatus.status === 'running' ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400' :
                      backendStatus.status === 'not_responding' ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400' :
                      'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400'
                    }`}>
                      {backendStatus.status === 'running' ? '✓ Connected' : 
                       backendStatus.status === 'not_responding' ? '⚠ Not Responding' : '✗ Disconnected'}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">Port: {backendStatus.port}</div>
                    {backendStatus.error && (
                      <div className="text-red-600 dark:text-red-400 text-xs">Error: {backendStatus.error}</div>
                    )}
                    <div className="text-gray-500 dark:text-gray-500 text-xs">
                      Last check: {new Date(backendStatus.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              )}

              {/* Environment Info */}
              {debugInfo && (
                <div className="bg-gray-50 dark:bg-night-700 p-3 rounded border border-gray-200 dark:border-night-600">
                  <h3 className="text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Environment</h3>
                  <div className="space-y-1 text-xs">
                    <div className="text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Mode:</span> {debugInfo.environment}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Platform:</span> {debugInfo.platform}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Node:</span> {debugInfo.nodeEnv}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Screen:</span> {debugInfo.screenSize}
                    </div>
                    {debugInfo.detectionMethods.length > 0 && (
                      <div className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Detection:</span> {debugInfo.detectionMethods.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Logs */}
          <div className="w-1/2 p-3 overflow-y-auto">
            <h3 className="text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">System Logs</h3>
            <div className="bg-gray-900 dark:bg-night-900 text-gray-100 dark:text-gray-200 p-3 rounded font-mono text-xs h-full overflow-y-auto border border-gray-300 dark:border-night-600">
              {logs.length === 0 ? (
                <div className="text-gray-400 dark:text-gray-500">No logs yet. Run diagnostics to populate logs.</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className={`mb-1 ${
                    log.type === 'error' ? 'text-red-400' :
                    log.type === 'success' ? 'text-green-400' :
                    log.type === 'warning' ? 'text-yellow-400' :
                    'text-gray-300 dark:text-gray-400'
                  }`}>
                    <span className="text-gray-500 dark:text-gray-600">[{log.timestamp}]</span> {log.message}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugConsole;
