import React, { useState, useEffect } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Settings from './pages/Settings';
import Layout from './components/Layout';
import { ensureBackendRunning } from './services/backendLauncher';
import { initializeProduction } from './services/productionInitializer';
import { checkBackendHealth } from './services/api';
import { initAppLifecycle } from './services/appLifecycle';
// Import the improved environment detection
import Environment from './utils/environmentDetection';
import EnvironmentInfo from './components/EnvironmentInfo';
import diagnostics from './utils/diagnostics';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

function App() {
  // These states are used in effects and child components
  // eslint-disable-next-line no-unused-vars
  const [activeTab, setActiveTab] = useState('dashboard');
  // eslint-disable-next-line no-unused-vars
  const [backendStatus, setBackendStatus] = useState('initializing');

  // Initialize backend server and theme
  useEffect(() => {
    // Always set the active tab to dashboard on application start
    setActiveTab('dashboard');
    // Update localStorage to maintain consistency
    localStorage.setItem('biome_active_tab', 'dashboard');
    
    // Initialize app lifecycle handlers
    initAppLifecycle();
    
    // Log application startup with diagnostics
    diagnostics.info('App', 'BIOME application initialized');
    
    // Check if we're running in Tauri environment with improved detection
    const isTauriEnvironment = Environment.isTauri(true); // Enable debug logging
    
    // Initialize production environment if in Tauri
    if (isTauriEnvironment) {
      diagnostics.info('Backend', 'Initializing production environment...');
      setBackendStatus('connecting');
      
      // Use production initializer for production builds
      if (process.env.NODE_ENV === 'production') {
        initializeProduction()
          .then(() => {
            diagnostics.info('Backend', 'Production environment initialized successfully');
            setBackendStatus('connected');
            
            // Start periodic health checks
            startHealthChecks();
          })
          .catch(error => {
            diagnostics.error('Backend', 'Failed to initialize production environment', { error: error.toString(), stack: error.stack });
            setBackendStatus('error');
          });
      } else {
        // Development mode - use existing backend launcher
        ensureBackendRunning()
          .then(() => {
            diagnostics.info('Backend', 'Backend server started successfully');
            setBackendStatus('connected');
            
            // Start periodic health checks
            startHealthChecks();
          })
          .catch(error => {
            diagnostics.error('Backend', 'Failed to start backend server', { error: error.toString(), stack: error.stack });
            setBackendStatus('error');
          });
      }
    } else {
      diagnostics.info('Backend', 'Not running in Tauri, skipping backend initialization');
      setBackendStatus('external');
    }

    // Health check function
    function startHealthChecks() {
      const interval = setInterval(async () => {
        try {
          const health = await checkBackendHealth();
          if (!health.ok) {
            diagnostics.warn('Backend', 'Backend server health check failed', health);
            setBackendStatus('error');
          } else {
            setBackendStatus('connected');
          }
        } catch (error) {
          diagnostics.error('Backend', 'Error checking backend health', { error: error.toString(), stack: error.stack });
          setBackendStatus('error');
        }
      }, 30000); // Check every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    localStorage.setItem('biome_active_tab', tab);
  };

  // Expose the navigation function globally for components that need it
  useEffect(() => {
    window.onNavigateToTab = handleTabChange;
    
    // Clean up when component unmounts
    return () => {
      delete window.onNavigateToTab;
    };
  }, []);

  return (
    <Router>
      <div className="App min-h-screen bg-slate-50 dark:bg-night-900 font-sans antialiased">
        {/* Add environment info component (only shows in dev) */}
        <EnvironmentInfo />
        
        <Layout>
          <Routes>
            <Route path="/" element={
              <LandingPage 
                activeTab="dashboard"
                onNavigateToTab={handleTabChange} 
              />
            } />
            <Route path="/projects" element={
              <LandingPage 
                activeTab="projects" 
                onNavigateToTab={handleTabChange} 
              />
            } />
            <Route path="/table" element={
              <LandingPage 
                activeTab="table" 
                onNavigateToTab={handleTabChange} 
              />
            } />
            <Route path="/analytics" element={
              <LandingPage 
                activeTab="analytics" 
                onNavigateToTab={handleTabChange} 
              />
            } />
            <Route path="/users-and-groups" element={
              <LandingPage 
                activeTab="users" 
                onNavigateToTab={handleTabChange} 
              />
            } />
            <Route path="/database" element={
              <LandingPage 
                activeTab="database" 
                onNavigateToTab={handleTabChange} 
              />
            } />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
        
        {/* Hidden element to prevent CSS purging of status classes */}
        <div className="hidden">
          <span className="status-Preparing"></span>
          <span className="status-Active"></span>
          <span className="status-Completed"></span>
          <span className="status-On-Hold"></span>
          <span className="status-Review"></span>
          <span className="status-Cancelled"></span>
          {/* Legacy status classes for backward compatibility */}
          <span className="status-Intake"></span>
          <span className="status-In-Progress"></span>
          <span className="status-Waiting"></span>
          <span className="status-Pending"></span>
          <span className="status-Planning"></span>
          <span className="status-Archived"></span>
          <span className="status-badge"></span>
        </div>
      </div>
    </Router>
  );
}

export default App;
