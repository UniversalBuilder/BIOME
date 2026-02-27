import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ScrollTopButton from './ScrollTopButton';
import DebugConsole from './DebugConsole';
import Environment from '../utils/environmentDetection';

const PAGE_TITLES = {
  '/': { title: 'Dashboard', subtitle: 'Overview of your bioimage analysis projects and activities' },
  '/projects': { title: 'Project Management', subtitle: 'View, edit, and manage your bioimage analysis projects' },
  '/table': { title: 'Projects Table View', subtitle: 'View all projects in a table format with sorting and filtering options' },
  '/users-and-groups': { title: 'Users & Groups Management', subtitle: 'Manage users and groups for your bioimage analysis projects' },
  '/database': { title: 'Database Management', subtitle: 'Manage your BIOME database and data integrity' },
  '/analytics': { title: 'Analytics', subtitle: 'Analyze and visualize your bioimage project data' },
  '/settings': { title: 'Application Settings', subtitle: 'Configure your BIOME application preferences' },
  '/help': { title: 'Help & Documentation', subtitle: 'Guides and references for using BIOME' },
};

function Layout({ children }) {
  const [showDebugConsole, setShowDebugConsole] = useState(false);
  const location = useLocation();
  const pageInfo = PAGE_TITLES[location.pathname]
    ?? (location.pathname.startsWith('/help') ? PAGE_TITLES['/help'] : null);
  
  // Check if we're running in Tauri environment
  useEffect(() => {
    const checkTauriEnvironment = async () => {
      const result = Environment.isTauri();
      console.log('Layout detected Tauri environment:', result);
      // We don't need to store this in state since we can use Environment.isTauri() directly
    };
    
    checkTauriEnvironment();
    
    // Check again after a delay to ensure Tauri API is initialized
    const timer = setTimeout(checkTauriEnvironment, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Add custom event listener for debug console
  useEffect(() => {
    const handleOpenDebugConsole = () => {
      setShowDebugConsole(true);
    };

    window.addEventListener('openDebugConsole', handleOpenDebugConsole);
    return () => window.removeEventListener('openDebugConsole', handleOpenDebugConsole);
  }, []);

  // Add keyboard shortcut for debug console
  useEffect(() => {
    const handleKeyPress = (event) => {
      // Ctrl+Shift+D to open debug console
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        setShowDebugConsole(true);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);
  
  return (
    <div className="app-container bg-isabelline dark:bg-night-900 h-screen flex flex-col">
      <header className="app-header bg-white dark:bg-night-800 border-b border-gray-200 dark:border-night-600 flex-none z-10">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* App title with original cyan gradient colors */}
            <div className="flex flex-col">
              <h1 className="text-3xl font-bold" style={{
                background: 'linear-gradient(45deg, #00F7FF, #9B6BF3, #4DB4FF)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 10px rgba(0, 247, 255, 0.3)'
              }}>BIOME</h1>
              <span className="text-xs text-gray-500 dark:text-gray-400">Bio Imaging Organization and Management Environment</span>
            </div>

            {/* Navigation - reorganized for logical workflow */}
            <div className="flex items-center">
              <nav className="hidden md:flex space-x-4">
                <NavLink to="/">Dashboard</NavLink>
                <NavLink to="/users-and-groups">Users & Groups</NavLink>
                <NavLink to="/projects">Projects</NavLink>
                <NavLink to="/table">Table View</NavLink>
                <NavLink to="/database">Database</NavLink>
                <NavLink to="/analytics">Analytics</NavLink>
                <NavLink to="/settings">
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </span>
                </NavLink>
              </nav>
            </div>
          </div>
          {/* Page title strip */}
          {pageInfo && (
            <div className="pb-2 flex items-baseline gap-2">
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{pageInfo.title}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{pageInfo.subtitle}</span>
            </div>
          )}
        </div>
      </header>

      <main className="content-container bg-isabelline dark:bg-night-900 flex-1 min-h-0 relative overflow-hidden">
        <div className="animate-fade-in h-full w-full">
          {children}
        </div>
      </main>

      <ScrollTopButton />
      
      {/* Debug Console */}
      <DebugConsole 
        isOpen={showDebugConsole} 
        onClose={() => setShowDebugConsole(false)} 
      />
    </div>
  );
}

function NavLink({ to, children }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link
      to={to}
      className={`tab relative inline-flex items-center px-3 py-2 rounded-md transition-colors hover:bg-background-light dark:hover:bg-night-700 font-medium text-gray-700 dark:text-gray-200 ${
        isActive 
          ? 'font-semibold' 
          : ''
      }`}
      style={isActive ? {
        background: 'linear-gradient(45deg, #00F7FF, #4DB4FF)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      } : {}}
    >
      {children}
      {isActive && (
        <span 
          className="absolute bottom-0 left-0 w-full h-0.5" 
          style={{
            background: 'linear-gradient(45deg, #00F7FF, #4DB4FF)'
          }}
        ></span>
      )}
    </Link>
  );
}

export default Layout;