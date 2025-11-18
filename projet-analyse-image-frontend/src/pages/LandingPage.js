import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Dashboard from '../components/Dashboard';
import Analytics from '../components/Analytics';
import ProjectList from '../components/ProjectList';
import ProjectDetails from '../components/ProjectDetails';
import ProjectCreationWizard from '../components/ProjectCreationWizard';
import ProjectTableView from '../components/ProjectTableView';
import UserGroupManager from '../components/UserGroupManager';
import DatabaseManager from '../components/DatabaseManager';
import { projectService } from '../services/api';

function LandingPage({ activeTab, onNavigateToTab }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isNewProject, setIsNewProject] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tableFilters, setTableFilters] = useState({});
  const [analytics, setAnalytics] = useState({
    totalProjects: 0,
    averageTimePerProject: 0,
    completionRate: 0,
    projectsByGroup: [],
    timeByGroup: [],
    completionRateByGroup: []
  });
  const [projectActivities, setProjectActivities] = useState([]);

  // Define handlers first, before they're used in useEffect
  const handleProjectSelect = useCallback(async (project, isNew = false, startEditing = false) => {
    if (!project) return;
    
    try {
      // Always get the latest project data from the server when selecting a project
      const freshProject = await projectService.getById(project.id);
      console.log(`Selected project: ${freshProject.name} (ID: ${freshProject.id})`);
      
      // Log journal entries for debugging
      if (freshProject.journal_entries) {
        console.log(`Project has ${freshProject.journal_entries.length} journal entries`);
      } else {
        console.log('Project has no journal entries');
      }
      
      setSelectedProject(freshProject);
      setIsNewProject(isNew);

      // Navigate to projects route if we're not already there
      if (activeTab !== 'projects') {
        navigate('/projects');
        onNavigateToTab('projects');
      }
    } catch (err) {
      console.error('Error loading project details:', err);
      // Fallback to using the project data we already have
      setSelectedProject(project);
      setIsNewProject(isNew);
      
      // Still navigate even if we had an error loading details
      if (activeTab !== 'projects') {
        navigate('/projects');
        onNavigateToTab('projects');
      }
    }
  }, [activeTab, onNavigateToTab, navigate]);

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      const data = await projectService.getAll();
      setProjects(data);
      calculateAnalytics(data);
      setLoading(false);
    } catch (err) {
      console.error('Error loading projects:', err);
      setError(err.message);
      setLoading(false);
    }
  }, []);

  const fetchProjectActivities = useCallback(async () => {
    try {
      console.log('Fetching project activities');
      const activities = await projectService.getAllActivities();
      console.log(`Fetched ${activities.length} activities`);
      setProjectActivities(activities);
    } catch (err) {
      console.error('Failed to fetch project activities:', err);
    }
  }, []);

  const handleProjectUpdate = useCallback(() => {
    loadProjects();
    fetchProjectActivities();
  }, [loadProjects, fetchProjectActivities]);

  // Wizard handlers
  const handleCreateNewProject = useCallback(() => {
    setShowWizard(true);
    setSelectedProject(null);
    setIsNewProject(false);
  }, []);

  const handleWizardComplete = useCallback((completedProject) => {
    setShowWizard(false);
    handleProjectUpdate();
    // Select the newly created project
    handleProjectSelect(completedProject, false);
  }, [handleProjectUpdate, handleProjectSelect]);

  const handleWizardCancel = useCallback(() => {
    setShowWizard(false);
    // If we were in wizard mode, reset to showing project list
    if (activeTab === 'projects') {
      setSelectedProject(null);
      setIsNewProject(false);
    }
  }, [activeTab]);

  const handleQuickAction = useCallback((action, filterParams = {}) => {
    switch(action) {
      case 'create':
        if (activeTab === 'projects') {
          // Already on projects, open wizard immediately
          setShowWizard(true);
          setSelectedProject(null);
          setIsNewProject(false);
        } else {
          // Navigate with intent for the new instance to pick up
          navigate('/projects', { state: { quickAction: 'create' } });
          onNavigateToTab('projects');
        }
        break;
      case 'search':
        setTableFilters({ searchTerm: filterParams.searchTerm });
        navigate('/table');
        onNavigateToTab('table');
        break;
      case 'filter':
        // Set filters synchronously before navigation
        setTableFilters(filterParams);
        // Force a synchronous state update
        setTableFilters(current => {
          navigate('/table');
          onNavigateToTab('table');
          return current;
        });
        break;
      case 'select':
        if (activeTab === 'projects') {
          const project = projects.find(p => p.id === filterParams.projectId);
          if (project) handleProjectSelect(project);
        } else {
          navigate('/projects', { state: { quickAction: 'select', projectId: filterParams.projectId } });
          onNavigateToTab('projects');
        }
        break;
      case 'view_all':
        setTableFilters({});
        navigate('/table');
        onNavigateToTab('table');
        break;
      default:
        console.log(`Unknown action: ${action}`);
    }
  }, [activeTab, onNavigateToTab, projects, handleProjectSelect, navigate]);

  // Now define useEffect hooks after all handlers are defined
  useEffect(() => {
    loadProjects();
    fetchProjectActivities();
  }, [loadProjects, fetchProjectActivities]);

  // Handle quickAction from router state (e.g., from Dashboard Quick Start)
  useEffect(() => {
    const state = location.state;
    if (!state) return;
    if (state.quickAction === 'create') {
      // Open wizard once projects are available/new instance mounted
      setShowWizard(true);
      setSelectedProject(null);
      setIsNewProject(false);
      // Clear state to avoid repeat on back/forward
      navigate(location.pathname, { replace: true, state: null });
    }
    if (state.quickAction === 'select') {
      const target = projects.find(p => p.id === state.projectId);
      if (!loading) {
        if (target) {
          handleProjectSelect(target);
        }
        navigate(location.pathname, { replace: true, state: null });
      }
    }
  }, [location.state, projects, loading, handleProjectSelect, navigate, location.pathname]);
  
  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadProjects();
      fetchProjectActivities();
    }
  }, [activeTab, loadProjects, fetchProjectActivities]);

  useEffect(() => {
    if (activeTab === 'projects' && !selectedProject && projects.length > 0 && !loading) {
      handleProjectSelect(projects[0]);
    }
  }, [activeTab, selectedProject, projects, loading, handleProjectSelect]);

  // Update table filters handler
  useEffect(() => {
    // Expose the setTableFilter function globally for the search functionality
    window.setTableFilter = (filters) => {
      setTableFilters(filters);
    };
    
    // Expose the refreshActivities function globally for ProjectDetails
    window.refreshActivities = () => {
      fetchProjectActivities();
    };
    
    return () => {
      delete window.setTableFilter;
      delete window.refreshActivities;
    };
  }, [fetchProjectActivities]);

  // Helper function to calculate analytics
  const calculateAnalytics = (projectData) => {
    // Calculate total active projects (not finished or on hold)
    const activeProjects = projectData.filter(p => 
      p.status !== 'Finished' && p.status !== 'On Hold'
    );
    
    // Calculate average time spent per project (only include projects with time > 0)
    let totalTimeSpent = 0;
    let projectsWithTimeSpent = 0;
    projectData.forEach(p => {
      if (p.time_spent_minutes && p.time_spent_minutes > 0) {
        totalTimeSpent += p.time_spent_minutes;
        projectsWithTimeSpent++;
      }
    });
    const avgHoursPerProject = projectsWithTimeSpent > 0 
      ? Math.round((totalTimeSpent / projectsWithTimeSpent) / 60 * 10) / 10 
      : 0;
    
    // Calculate completion rate
    const finishedProjects = projectData.filter(p => p.status === 'Completed').length;
    const completionRateValue = projectData.length > 0 
      ? Math.round((finishedProjects / projectData.length) * 100) 
      : 0;
    
    // Group projects by group
    const projectsByGroupMap = new Map();
    const timeByGroupMap = new Map();
    
    projectData.forEach(p => {
      const groupName = p.group_name || 'No Group';
      
      // Count projects by group
      if (!projectsByGroupMap.has(groupName)) {
        projectsByGroupMap.set(groupName, 0);
      }
      projectsByGroupMap.set(groupName, projectsByGroupMap.get(groupName) + 1);
      
      // Sum time spent by group
      if (!timeByGroupMap.has(groupName)) {
        timeByGroupMap.set(groupName, 0);
      }
      timeByGroupMap.set(groupName, timeByGroupMap.get(groupName) + (p.time_spent_minutes || 0));
    });
    
    // Convert maps to arrays for charts
    const projectsByGroup = Array.from(projectsByGroupMap, ([name, count]) => ({ name, count }));
    
    const timeByGroup = Array.from(timeByGroupMap, ([name, minutes]) => ({
      name,
      hours: Math.round(minutes / 60 * 10) / 10
    }));
    
    // Calculate completion rate by group
    const completionRateByGroup = Array.from(projectsByGroupMap.keys()).map(group => {
      const groupProjects = projectData.filter(p => (p.group_name || 'No Group') === group);
      const groupFinished = groupProjects.filter(p => p.status === 'Completed').length;
      const rate = groupProjects.length > 0 
        ? Math.round((groupFinished / groupProjects.length) * 100) 
        : 0;
      return { name: group, rate };
    });
    
    setAnalytics({
      totalProjects: activeProjects.length,
      averageTimePerProject: avgHoursPerProject,
      completionRate: completionRateValue,
      projectsByGroup,
      timeByGroup,
      completionRateByGroup
    });
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard':
        return (
          <div className="w-full h-full overflow-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="mb-6">
                <h2 className="text-3xl font-bold mb-2" style={{
                  background: 'linear-gradient(45deg, #00F7FF, #9B6BF3, #4DB4FF)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 10px rgba(0, 247, 255, 0.3)'
                }}>Dashboard</h2>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Overview of your bioimage analysis projects and activities
                </p>
              </div>
              <Dashboard
                analytics={analytics}
                activities={projectActivities}
                projects={projects}
                onQuickAction={handleQuickAction}
              />
            </div>
          </div>
        );
      case 'analytics':
        return (
          <div className="w-full h-full overflow-auto">
            <Analytics
              projects={projects}
              analytics={analytics}
              activities={projectActivities}
              onQuickAction={handleQuickAction}
            />
          </div>
        );
      case 'projects':
        // Show wizard if in wizard mode
        if (showWizard) {
          return (
            <ProjectCreationWizard
              onProjectCreated={handleWizardComplete}
              onCancel={handleWizardCancel}
            />
          );
        }
        
        return (
          <div className="projects-container w-full h-full overflow-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="mb-6">
                <h2 className="text-3xl font-bold mb-2" style={{
                  background: 'linear-gradient(45deg, #00F7FF, #9B6BF3, #4DB4FF)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 10px rgba(0, 247, 255, 0.3)'
                }}>Project Management</h2>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  View, edit, and manage your bioimage analysis projects
                </p>
              </div>
              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-5 lg:col-span-4">
                  <ProjectList
                    projects={projects}
                    selectedProject={selectedProject}
                    onProjectSelect={handleProjectSelect}
                    onCreateNewProject={handleCreateNewProject}
                    showScroll={true}
                  />
                </div>
                <div className="col-span-7 lg:col-span-8">
                  {selectedProject ? (
                    <ProjectDetails
                      project={selectedProject}
                      isNewProject={isNewProject}
                      onProjectUpdate={handleProjectUpdate}
                      onProjectSelect={handleProjectSelect}
                      setIsNewProject={setIsNewProject}
                      showScroll={true}
                    />
                  ) : (
                    <div className="bg-white dark:bg-night-800 rounded-lg p-8 shadow-sm card-glow h-full flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-night-700 flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No Project Selected</h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">Select a project from the list to view and edit its details</p>
                      <button
                        onClick={handleCreateNewProject}
                        className="btn"
                        style={{
                          background: 'linear-gradient(45deg, rgba(20, 75, 123, 0.1), rgba(73, 155, 160, 0.1))',
                          borderColor: 'rgba(20, 75, 123, 0.3)',
                          color: '#144B7B'
                        }}
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Create New Project
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      case 'table':
        return (
          <div className="w-full h-full overflow-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="mb-6">
                <h2 className="text-3xl font-bold mb-2" style={{
                  background: 'linear-gradient(45deg, #00F7FF, #9B6BF3, #4DB4FF)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 10px rgba(0, 247, 255, 0.3)'
                }}>Projects Table View</h2>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  View all projects in a table format with sorting and filtering options
                </p>
              </div>
              <div className="grid grid-cols-12 gap-6 py-6">
                <div className="col-span-12">
                  <ProjectTableView 
                    projects={projects}
                    onProjectSelect={handleProjectSelect}
                    filters={tableFilters}
                    selectedProject={selectedProject}
                    onRefresh={handleProjectUpdate}
                    loading={loading}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case 'users':
        return (
          <div className="w-full h-full overflow-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="mb-6">
                <h2 className="text-3xl font-bold mb-2" style={{
                  background: 'linear-gradient(45deg, #00F7FF, #9B6BF3, #4DB4FF)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 10px rgba(0, 247, 255, 0.3)'
                }}>Users & Groups Management</h2>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Manage users and groups for your bioimage analysis projects
                </p>
              </div>
              <UserGroupManager 
                onUserGroupChange={loadProjects} 
              />
            </div>
          </div>
        );
      case 'database':
        return (
          <div className="w-full h-full overflow-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="mb-6">
                <h2 className="text-3xl font-bold mb-2" style={{
                  background: 'linear-gradient(45deg, #00F7FF, #9B6BF3, #4DB4FF)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 10px rgba(0, 247, 255, 0.3)'
                }}>Database Management</h2>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  Manage your BIOME database and data integrity
                </p>
              </div>
              <DatabaseManager 
                onDatabaseChange={loadProjects}
              />
            </div>
          </div>
        );
      default:
        return (
          <div className="text-center py-8">
            <p>Select a tab to get started</p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full bg-slate-50">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full bg-slate-50 dark:bg-night-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-400 p-4 mb-4 rounded-lg shadow-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500 dark:text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1.414-5.293a1 1 011.414 0L10 13.414l.707-.707a1 1 111.414 1.414L11.414 14l.707.707a1 1 11-1.414 1.414L10 15.414l-.707.707a1 1 11-1.414-1.414L8.586 14l-.707-.707a1 1 111.414-1.414L10 12.586l.707-.707z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 dark:text-red-300">
                  Error loading data: {error}
                </p>
                <button
                  className="mt-2 px-4 py-2 text-sm rounded-md border border-red-500 text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 focus:outline-none focus:ring-2 focus:ring-red-400"
                  onClick={loadProjects}
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-auto">
      {renderContent()}
    </div>
  );
}

export default LandingPage;