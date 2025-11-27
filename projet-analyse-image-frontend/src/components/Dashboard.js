import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tooltip } from './Tooltip';
import ScrollableContainer from './ScrollableContainer';
import GroupAnalytics from './GroupAnalytics';
import QuickActions from './QuickActions';
import ImportProjectButton from './ImportProjectButton';
import { useTheme } from '../contexts/ThemeContext';
import { appService } from '../services/api';

const getActivityIcon = (activityType) => {
  switch (activityType) {
    case 'create':
      return (
        <div className="flex-shrink-0 mt-0.5 rounded-full p-1" style={{
          background: 'linear-gradient(45deg, rgba(34, 197, 94, 0.2), rgba(132, 204, 22, 0.2))',
          color: 'rgba(34, 197, 94, 0.8)',
          border: '1px solid rgba(34, 197, 94, 0.3)'
        }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
      );
    case 'update':
      return (
        <div className="flex-shrink-0 mt-0.5 rounded-full p-1" style={{
          background: 'linear-gradient(45deg, rgba(0, 247, 255, 0.2), rgba(77, 180, 255, 0.2))',
          color: 'rgba(0, 247, 255, 0.8)',
          border: '1px solid rgba(0, 247, 255, 0.3)'
        }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
      );
    case 'journal_entry':
      return (
        <div className="flex-shrink-0 mt-0.5 rounded-full p-1" style={{
          background: 'linear-gradient(45deg, rgba(155, 107, 243, 0.2), rgba(92, 119, 222, 0.2))',
          color: 'rgba(155, 107, 243, 0.8)',
          border: '1px solid rgba(155, 107, 243, 0.3)'
        }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
      );
    case 'update_users':
      return (
        <div className="flex-shrink-0 mt-0.5 rounded-full p-1" style={{
          background: 'linear-gradient(45deg, rgba(251, 191, 36, 0.2), rgba(249, 115, 22, 0.2))',
          color: 'rgba(251, 191, 36, 0.8)',
          border: '1px solid rgba(251, 191, 36, 0.3)'
        }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
      );
    default:
      return (
        <div className="flex-shrink-0 mt-0.5 rounded-full p-1" style={{
          background: 'linear-gradient(45deg, rgba(107, 114, 128, 0.2), rgba(156, 163, 175, 0.2))',
          color: 'rgba(107, 114, 128, 0.8)',
          border: '1px solid rgba(107, 114, 128, 0.3)'
        }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
  }
};

// Format activity data for display
const formatActivity = (activity) => {
  let changedFields = [];
  if (activity.changed_fields) {
    try {
      // Handle cases where changed_fields might not be valid JSON
      let changedFieldsObj;
      if (typeof activity.changed_fields === 'string') {
        // Try to parse as JSON first
        try {
          changedFieldsObj = JSON.parse(activity.changed_fields);
        } catch (jsonError) {
          // If JSON parsing fails, treat as simple text or comma-separated values
          // Handle comma-separated values or simple strings
          const fields = activity.changed_fields.split(',').map(f => f.trim());
          changedFields = fields.map(field => `${field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}: (updated)`);
          return {
            ...activity,
            changedFields,
            formattedDate: new Date(activity.activity_date).toLocaleString()
          };
        }
      } else if (typeof activity.changed_fields === 'object') {
        changedFieldsObj = activity.changed_fields;
      } else {
        // Handle other data types
        changedFields = [String(activity.changed_fields)];
        return {
          ...activity,
          changedFields,
          formattedDate: new Date(activity.activity_date).toLocaleString()
        };
      }

      changedFields = Object.keys(changedFieldsObj).map(field => {
        // Check if values exist before trying to access properties
        const from = changedFieldsObj[field]?.from;
        const to = changedFieldsObj[field]?.to;
        
        // Format time_spent_minutes specially
        if (field === 'time_spent_minutes') {
          const fromHrs = from ? `${Math.floor(from / 60)}h ${from % 60}m` : '0h';
          const toHrs = to ? `${Math.floor(to / 60)}h ${to % 60}m` : '0h';
          return `Time: ${fromHrs} → ${toHrs}`;
        }
        
        // Format other fields
        const formattedField = field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        const fromValue = from !== null && from !== undefined ? String(from) : '(none)';
        const toValue = to !== null && to !== undefined ? String(to) : '(none)';
        
        return `${formattedField}: ${fromValue} → ${toValue}`;
      });
    } catch (error) {
      // Silently handle any remaining parsing errors
      changedFields = ['Field changes unavailable'];
    }
  }

  return {
    ...activity,
    changedFields,
    formattedDate: new Date(activity.activity_date).toLocaleString()
  };
};

// Add simple XLSX generation function (replacing CSV)
const generateXLSX = async (activities) => {
  try {
    // Dynamically import xlsx library
    const XLSX = await import('xlsx');
    
    // Prepare workbook and worksheets
    const wb = XLSX.utils.book_new();
    
    // Create activity log sheet with more detailed information
    const headers = ['Date', 'Project', 'User', 'Type', 'Details', 'Changed Fields'];
    const rows = activities.map(activity => {
      // Format changed fields for better readability in Excel
      const changedFieldsText = activity.changedFields 
        ? activity.changedFields.join('; ') 
        : '';
        
      return [
        new Date(activity.activity_date).toLocaleString(),
        activity.project_name || '',
        activity.user_name || '',
        activity.activity_type || '',
        activity.details || '',
        changedFieldsText
      ];
    });
    
    // Create worksheet and add to workbook
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, 'Activity Log');
    
    // Add a summary sheet
    const summaryData = [
      ['BIOME Activity Log', ''],
      ['Generated on', new Date().toLocaleString()],
      ['Total activities', activities.length],
      ['Period covered', activities.length > 0 
        ? `${new Date(activities[activities.length-1].activity_date).toLocaleDateString()} to ${new Date(activities[0].activity_date).toLocaleDateString()}`
        : 'No data'
      ],
    ];
    
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
    
    return {
      wb,
      buffer: XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    };
  } catch (error) {
    console.error('Error generating XLSX:', error);
    throw error;
  }
};

const ActivityFeed = ({ activities = [] }) => {
  const [displayCount, setDisplayCount] = useState(5);

  useEffect(() => {
    console.log('Activity feed received activities:', activities.length);
    if (activities.length > 0) {
      console.log('Recent activities:', activities.slice(0, 3).map(a => ({
        id: a.id,
        type: a.activity_type,
        project: a.project_name,
        details: a.details,
        changed_fields: a.changed_fields,
        date: a.activity_date
      })));
    }
  }, [activities]);

  const formattedActivities = useMemo(() => {
    return activities
      .slice(0, displayCount)
      .map(activity => formatActivity(activity));
  }, [activities, displayCount]);

  const remainingCount = activities.length - displayCount;
  const hasMore = remainingCount > 0;

  const handleShowMore = () => {
    setDisplayCount(prev => Math.min(prev + 10, activities.length));
  };

  const handleExportActivities = async () => {
    try {
      console.log('Exporting activities...'); // Debug log
      
      // Generate XLSX workbook and buffer instead of CSV
      const { buffer } = await generateXLSX(activities);
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const defaultFilename = `BIOME_Activity_Log_${timestamp}.xlsx`;
      
      if (window.__TAURI__) {
        // Tauri path
        const { save } = await import('@tauri-apps/plugin-dialog');
        const { writeBinaryFile } = await import('@tauri-apps/plugin-fs');
        
        const filePath = await save({
          title: 'Export Activity Log',
          defaultPath: defaultFilename,
          filters: [{
            name: 'Excel Files',
            extensions: ['xlsx']
          }]
        });

        if (filePath) {
          await writeBinaryFile(filePath, buffer);
        }
      } else {
        // Fallback to traditional download
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = defaultFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Failed to export activities:', err);
    }
  };

  return (
    <div className="bg-white dark:bg-night-800 rounded-lg border border-gray-200 dark:border-night-600 shadow-sm flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 dark:border-night-600 flex justify-between items-center">
        <Tooltip>
          <Tooltip.Trigger asChild>
            <h3 className="text-base font-medium text-slate-800 dark:text-gray-200">Activity Feed</h3>
          </Tooltip.Trigger>
          <Tooltip.Panel className="bg-gray-800/90 text-white text-xs px-2 py-1 rounded shadow-lg backdrop-filter backdrop-blur-sm">
            Recent project activities
          </Tooltip.Panel>
        </Tooltip>
        <Tooltip>
          <Tooltip.Trigger asChild>
            <button
              onClick={handleExportActivities}
              className="btn btn-sm"
              style={{
                background: 'linear-gradient(45deg, #22c55e, #84cc16)',
                color: 'white',
                border: 'none',
                textShadow: '0 1px 2px rgba(0,0,0,0.2)'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Export Log
            </button>
          </Tooltip.Trigger>
          <Tooltip.Panel className="bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-lg">
            Export full activity log as Excel file
          </Tooltip.Panel>
        </Tooltip>
        </div>
      <ScrollableContainer className="flex-grow p-4">
        <div className="space-y-3">
          {formattedActivities.length > 0 ? formattedActivities.map(activity => (
            <div key={activity.id} className="flex gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-night-700 transition-colors">
              {getActivityIcon(activity.activity_type)}
              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="flex justify-between items-start">
                  <div className="text-xs font-medium text-bioluminescent-600 dark:text-bioluminescent-400 break-words overflow-wrap-anywhere">{activity.project_name}</div>
                  <div className="text-[10px] text-slate-400 dark:text-gray-500 whitespace-nowrap ml-2">
                    {activity.formattedDate}
                  </div>
                </div>
                <p className="text-xs text-slate-700 dark:text-gray-300 mt-0.5 break-words overflow-wrap-anywhere whitespace-normal line-clamp-2">{activity.details}</p>
                {activity.changedFields.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {activity.changedFields.slice(0, 2).map((change, idx) => (
                      <span key={idx} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                        {change}
                      </span>
                    ))}
                    {activity.changedFields.length > 2 && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500">
                        +{activity.changedFields.length - 2} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )) : (
            <div className="flex flex-col items-center justify-center h-full py-8 text-slate-500 dark:text-gray-400">
              <svg className="w-8 h-8 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs">No recent activity</p>
            </div>
          )}
        </div>
      </ScrollableContainer>
      {/* Show more / All shown indicator */}
      {activities.length > 5 && (
        <div className="px-4 pb-3 pt-1 border-t border-gray-100 dark:border-night-600">
          {hasMore ? (
            <button
              onClick={handleShowMore}
              className="w-full text-center text-xs text-bioluminescent-600 dark:text-bioluminescent-400 hover:text-bioluminescent-700 dark:hover:text-bioluminescent-300 font-medium py-1 hover:bg-bioluminescent-50 dark:hover:bg-bioluminescent-900/20 rounded transition-colors"
            >
              Show 10 more ({remainingCount} remaining) ↓
            </button>
          ) : (
            <p className="w-full text-center text-xs text-gray-400 dark:text-gray-500 py-1">
              All {activities.length} activities shown
            </p>
          )}
        </div>
      )}
    </div>
  );
};

const Dashboard = ({ analytics = {}, activities = [], projects = [], currentUserId, onQuickAction }) => {
  useTheme(); // Keeping useTheme import since it might be used in the future
  const navigate = useNavigate();
  
  // Add state for the About panel
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [appMeta, setAppMeta] = useState(null);

  // Calculate derived statistics
  const totalProjects = useMemo(() => {
    return projects.filter(p => p.status !== 'Completed' && p.status !== 'On Hold').length;
  }, [projects]);

  const averageTimePerProject = useMemo(() => {
    if (projects.length === 0) return 0;
    const totalMinutes = projects.reduce((sum, project) => sum + (project.time_spent_minutes || 0), 0);
    return Math.round(totalMinutes / 60 / projects.length * 10) / 10; // Round to 1 decimal place
  }, [projects]);

  const completionRate = useMemo(() => {
    if (projects.length === 0) return 0;
    const completed = projects.filter(p => p.status === 'Completed').length;
    return Math.round((completed / projects.length) * 100);
  }, [projects]);

  // Handle quick search
  const handleQuickSearch = (searchTerm) => {
    if (!searchTerm.trim()) return;

    const searchResults = projects.filter(project => {
      const searchFields = [
        project.name,
        project.description,
        project.user_name,
        project.group_name,
        project.software,
        // Search through journal entries if they exist
        ...(project.journal_entries || []).map(entry => entry.entry_text)
      ];

      return searchFields
        .filter(Boolean) // Remove null/undefined values
        .some(field => field.toLowerCase().includes(searchTerm.toLowerCase()));
    });

    // Only navigate to table view if we have results
    if (searchResults.length > 0) {
      // Set the filter first
      if (window.setTableFilter) {
        window.setTableFilter({ 
          searchResults,
          searchTerm 
        });
      }
      
      // Then navigate to table view using React Router
      navigate('/table');
      
      // Also call the global navigation handler if it exists
      if (window.onNavigateToTab) {
        window.onNavigateToTab('table');
      }
    } else {
      // Show no results message temporarily
      setSearchQuery('No results found');
      setTimeout(() => {
        setSearchQuery('');
        setIsSearching(false);
      }, 2000); // Show message for 2 seconds
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearching(true);
      handleQuickSearch(searchQuery.trim());
      if (searchQuery !== 'No results found') {
        setTimeout(() => setIsSearching(false), 1000); // Reset after transition to table view
      }
    }
  };

  // Handle quick action (filter)
  const handleQuickAction = (action, params) => {
    if (action === 'filter') {
      // Set the filter first
      if (window.setTableFilter) {
        window.setTableFilter(params);
      }
      
      // Then navigate to table view using both React Router and state management
      navigate('/table');
      if (window.onNavigateToTab) {
        window.onNavigateToTab('table');
      }
    }
  };

  const handleProjectImported = (newProject) => {
    // Refresh projects list if possible
    if (onQuickAction) {
      onQuickAction('select', { projectId: newProject.id });
    }
  };

  // Fetch app metadata (version/description/changelog)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const meta = await appService.getMeta();
        if (mounted) setAppMeta(meta);
      } catch (e) {
        console.warn('Failed to load app meta:', e.message);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8 pb-6">
        {/* Grid-based layout with widget-like elements */}
        <div className="dashboard-grid">
          {/* Quick Start (top full-width row) */}
          <div className="dashboard-card quickstart-card" style={{ gridArea: 'quickstart' }}>
            <div className="h-full bg-white dark:bg-night-800 rounded-lg border border-gray-200 dark:border-night-600 shadow-sm p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-800 dark:text-gray-200">Quick Start</h3>
                <div className="flex gap-2">
                  <Tooltip>
                    <Tooltip.Trigger asChild>
                      <ImportProjectButton 
                        onProjectImported={handleProjectImported}
                        className="btn btn-sm hover-soft mr-2"
                        style={{
                          background: 'linear-gradient(45deg, #6366f1, #8b5cf6)',
                          color: 'white',
                          border: 'none',
                          boxShadow: '0 2px 4px rgba(99, 102, 241, 0.3)'
                        }}
                      >
                        <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Import
                      </ImportProjectButton>
                    </Tooltip.Trigger>
                    <Tooltip.Panel className="bg-gray-800/90 text-white text-xs px-2 py-1 rounded shadow-lg backdrop-filter backdrop-blur-sm">
                      Import existing project folder
                    </Tooltip.Panel>
                  </Tooltip>
                  
                  <button
                    className="btn btn-sm hover-soft"
                    onClick={() => onQuickAction && onQuickAction('create')}
                    style={{
                      background: 'linear-gradient(45deg, #00F7FF, #4DB4FF)',
                      color: 'white',
                      border: 'none'
                    }}
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    New Project
                  </button>
                </div>
              </div>
              {/* Recent projects list */}
              <div className="space-y-2">
                {projects
                  .slice()
                  .sort((a,b) => (b.last_updated || '').localeCompare(a.last_updated || ''))
                  .slice(0,3)
                  .map(p => (
                    <div
                      key={p.id}
                      className="w-full text-left px-3 py-2 rounded-md bg-white dark:bg-night-700 border border-gray-200 dark:border-night-600 hover-soft hover:bg-gray-50 dark:hover:bg-night-700 transition-colors flex items-center justify-between group"
                      role="button"
                      tabIndex={0}
                      onClick={() => onQuickAction && onQuickAction('select', { projectId: p.id })}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onQuickAction && onQuickAction('select', { projectId: p.id }); } }}
                      title={p.name}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 group-hover:bg-bioluminescent-50 dark:group-hover:bg-bioluminescent-900/20 group-hover:text-bioluminescent-600 dark:group-hover:text-bioluminescent-400 transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <span className="truncate text-sm text-slate-800 dark:text-gray-200 font-medium">{p.name}</span>
                      </div>
                      <span className="text-xs text-slate-400 dark:text-gray-500 ml-2 shrink-0">{new Date(p.last_updated || p.creation_date).toLocaleDateString()}</span>
                    </div>
                  ))}
                {projects.length === 0 && (
                  <div className="text-xs text-slate-500 dark:text-gray-400 text-center py-4">No projects yet. Create your first project.</div>
                )}
                {projects.length > 3 && (
                  <button 
                    onClick={() => onQuickAction && onQuickAction('view_all')}
                    className="w-full text-center text-xs text-bioluminescent-600 dark:text-bioluminescent-400 hover:text-bioluminescent-700 dark:hover:text-bioluminescent-300 font-medium py-1"
                  >
                    View all {projects.length} projects →
                  </button>
                )}
              </div>
            </div>
          </div>
          {/* Stats Row (columns 1-6, row 1) */}
          <div className="dashboard-card stats-card" style={{ gridArea: 'stats1' }}>
            <Tooltip>
              <Tooltip.Trigger asChild>
                <div className="h-full bg-white dark:bg-night-800 rounded-lg border border-gray-200 dark:border-night-600 shadow-sm p-4 flex flex-col relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <svg className="w-16 h-16 text-bioluminescent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-bioluminescent-50 dark:bg-bioluminescent-900/30 text-bioluminescent-600 dark:text-bioluminescent-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-medium text-slate-800 dark:text-gray-200">In Progress</h3>
                  </div>
                  <div className="text-2xl font-bold text-bioluminescent-600 dark:text-bioluminescent-400 mt-auto mb-1">{totalProjects}</div>
                  <p className="text-xs text-slate-600 dark:text-gray-400">Ongoing projects (excl. completed and on hold)</p>
                </div>
              </Tooltip.Trigger>
              <Tooltip.Panel className="bg-gray-800/90 text-white text-xs px-2 py-1 rounded shadow-lg backdrop-filter backdrop-blur-sm">
                Number of projects currently in progress
              </Tooltip.Panel>
            </Tooltip>
          </div>

          <div className="dashboard-card stats-card" style={{ gridArea: 'stats2' }}>
            <Tooltip>
              <Tooltip.Trigger asChild>
                <div className="h-full bg-white dark:bg-night-800 rounded-lg border border-gray-200 dark:border-night-600 shadow-sm p-4 flex flex-col relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <svg className="w-16 h-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-medium text-slate-800 dark:text-gray-200">Time Statistics</h3>
                  </div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-auto mb-1">
                    {averageTimePerProject}h
                  </div>
                  <p className="text-xs text-slate-600 dark:text-gray-400">Average time spent per project</p>
                </div>
              </Tooltip.Trigger>
              <Tooltip.Panel className="bg-gray-800/90 text-white text-xs px-2 py-1 rounded shadow-lg backdrop-filter backdrop-blur-sm">
                Average time spent on projects
              </Tooltip.Panel>
            </Tooltip>
          </div>

          <div className="dashboard-card stats-card" style={{ gridArea: 'stats3' }}>
            <Tooltip>
              <Tooltip.Trigger asChild>
                <div className="h-full bg-white dark:bg-night-800 rounded-lg border border-gray-200 dark:border-night-600 shadow-sm p-4 flex flex-col relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <svg className="w-16 h-16 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-medium text-slate-800 dark:text-gray-200">Completion Rate</h3>
                  </div>
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-auto mb-1">
                    {completionRate}%
                  </div>
                  <p className="text-xs text-slate-600 dark:text-gray-400">Projects completed successfully</p>
                </div>
              </Tooltip.Trigger>
              <Tooltip.Panel className="bg-gray-800/90 text-white text-xs px-2 py-1 rounded shadow-lg backdrop-filter backdrop-blur-sm">
                Percentage of successfully completed projects
              </Tooltip.Panel>
            </Tooltip>
          </div>

          {/* Main Content Area (columns 1-4, rows 2-7) */}
          <div className="dashboard-card analytics-card">
            <div className="h-full bg-white dark:bg-night-800 rounded-lg border border-gray-200 dark:border-night-600 shadow-sm">
              <div className="p-3 border-b border-gray-200 dark:border-night-600">
                <Tooltip>
                  <Tooltip.Trigger asChild>
                    <h3 className="text-base font-medium text-slate-800 dark:text-gray-200">Group Analytics</h3>
                  </Tooltip.Trigger>
                  <Tooltip.Panel className="bg-gray-800/90 text-white text-xs px-2 py-1 rounded shadow-lg backdrop-filter backdrop-blur-sm">
                    Analytics breakdown by group
                  </Tooltip.Panel>
                </Tooltip>
              </div>
              <ScrollableContainer className="p-3" style={{height: "calc(100% - 49px)"}}>
                <GroupAnalytics analytics={analytics} />
              </ScrollableContainer>
            </div>
          </div>

          <div className="dashboard-card activity-card">
            <ActivityFeed activities={activities} />
          </div>

          {/* Right Column (columns 5-6, rows 2-7) */}
          <div className="dashboard-card search-card">
            <div className="h-full bg-white dark:bg-night-800 rounded-lg border border-gray-200 dark:border-night-600 shadow-sm p-4 flex flex-col justify-center">
              <Tooltip>
                <Tooltip.Trigger asChild>
                  <h3 className="text-sm font-medium text-slate-800 dark:text-gray-200 mb-3">Quick Search</h3>
                </Tooltip.Trigger>
                <Tooltip.Panel className="bg-gray-800/90 text-white text-xs px-2 py-1 rounded shadow-lg backdrop-filter backdrop-blur-sm">
                  Find projects quickly
                </Tooltip.Panel>
              </Tooltip>
              <div className="relative">
                <form onSubmit={handleSearch} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search projects..."
                    className="form-input flex-1 bg-white dark:bg-night-800 border-gray-200 dark:border-night-600 text-text dark:text-text-dark"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button 
                    type="submit"
                    className="btn btn-sm"
                    disabled={!searchQuery.trim() || isSearching}
                    style={{
                      background: searchQuery.trim() ? 'linear-gradient(45deg, #00F7FF, #4DB4FF)' : '',
                      color: searchQuery.trim() ? 'white' : '',
                      border: searchQuery.trim() ? 'none' : '',
                      textShadow: searchQuery.trim() ? '0 1px 2px rgba(0,0,0,0.2)' : '',
                      opacity: searchQuery.trim() ? 1 : 0.6
                    }}
                  >
                    {isSearching ? (
                      <>
                        <span className="opacity-0">Search</span>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Search
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="dashboard-card filters-card">
            <div className="h-full bg-white dark:bg-night-800 rounded-lg border border-gray-200 dark:border-night-600 shadow-sm p-4 flex flex-col overflow-hidden">
              <Tooltip>
                <Tooltip.Trigger asChild>
                  <h3 className="text-sm font-medium text-slate-800 dark:text-gray-200 mb-2">Quick Filters</h3>
                </Tooltip.Trigger>
                <Tooltip.Panel className="bg-gray-800/90 text-white text-xs px-2 py-1 rounded shadow-lg backdrop-filter backdrop-blur-sm">
                  Filter projects quickly by category
                </Tooltip.Panel>
              </Tooltip>
              <ScrollableContainer className="flex-grow">
                <QuickActions 
                  projects={projects}
                  currentUserId={currentUserId}
                  onQuickAction={handleQuickAction}
                  hideViewAll={true}
                />
              </ScrollableContainer>
            </div>
          </div>

          <div className="dashboard-card about-card">
            <div className="h-full bg-gradient-to-br from-night-800 via-night-800 to-bioluminescent-900/20 dark:from-night-800 dark:via-night-800 dark:to-bioluminescent-900/30 rounded-lg border border-bioluminescent-500/20 shadow-lg p-4 flex flex-col relative overflow-hidden">
              {/* Decorative glow */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-bioluminescent-500/10 rounded-full blur-2xl" />
              
              {/* Header */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-bioluminescent-400 to-bioluminescent-600 flex items-center justify-center shadow-lg shadow-bioluminescent-500/30">
                  <span className="text-white font-bold text-sm">B</span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">BIOME</h3>
                  <p className="text-[10px] text-bioluminescent-300/80">Bio Imaging Organization & Management</p>
                </div>
              </div>
              
              {/* Version badge */}
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-bioluminescent-500/20 text-bioluminescent-300 border border-bioluminescent-500/30">
                  v{appMeta?.version || '2.0.0'}
                </span>
                <span className="text-[10px] text-gray-400">
                  {appMeta?.releaseDate || new Date().toISOString().slice(0,10)}
                </span>
              </div>
              
              {/* Tech stack */}
              <div className="flex gap-1.5 mb-3">
                <span className="px-1.5 py-0.5 rounded text-[9px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Tauri</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20">React</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] bg-green-500/10 text-green-400 border border-green-500/20">SQLite</span>
              </div>
              
              {/* Copyright */}
              <p className="text-[10px] text-gray-500 mt-auto mb-2">© 2025 CIF UNIL</p>
              
              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setIsAboutOpen(true)}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium bg-bioluminescent-500/20 text-bioluminescent-300 hover:bg-bioluminescent-500/30 border border-bioluminescent-500/30 transition-all"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Details
                </button>
                <a 
                  href="https://cif.unil.ch"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium bg-gray-500/20 text-gray-300 hover:bg-gray-500/30 border border-gray-500/30 transition-all"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c-1.657 0-3-4.03-3-9s1.343-9 3-9m0 18c1.657 0 3-4.03 3-9s-1.343-9-3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  Website
                </a>
              </div>
            </div>
          </div>

          {/* About Modal */}
          {isAboutOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 relative">
                <button
                  onClick={() => setIsAboutOpen(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                <h2 className="text-xl font-medium text-slate-800 mb-4">About BIOME</h2>
                
                <div className="space-y-4 text-sm text-slate-600">
                  <div className="space-y-2">
                    <p className="leading-relaxed">BIOME (Bio Imaging Organization and Management Environment) is a comprehensive project management tool designed specifically for bioimage analysis workflows. It helps researchers and imaging facilities track, organize, and manage their microscopy data analysis projects efficiently.</p>
                    
                    <p className="leading-relaxed">Key features include:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Project tracking and organization</li>
                      <li>Time management and progress monitoring</li>
                      <li>Group-based collaboration</li>
                      <li>Analytics and reporting</li>
                      <li>File system integration</li>
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-slate-200">
                    <p className="font-medium mb-2">Developer</p>
                    <p>Yannick KREMPP</p>
                    <p>Bioimaging analysis and IT</p>
                    <p>CIF | Cellular Imaging Facility</p>
                  </div>

                  <div className="pt-4 border-t border-slate-200">
                    <p className="font-medium mb-2">Contact</p>
                    <p>Mail: <a href="mailto:yannick.krempp@unil.ch" className="text-blue-600 hover:text-blue-800">yannick.krempp@unil.ch</a></p>
                    <p>Web: <a href="https://cif.unil.ch" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">cif.unil.ch</a></p>
                    <p>Social: 
                      <a href="https://www.linkedin.com/in/yannick-krempp" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 ml-1">LinkedIn</a> |
                      <a href="https://www.youtube.com/@CIFUNIL" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 ml-1">Youtube</a>
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-200">
                    <p className="font-medium mb-2">Location</p>
                    <p>DNF » rue du Bugnon 9 | Bureau 212 » CH-1005 Lausanne</p>
                    <p className="mt-2">Agora » Rue du Bugnon 25A | Office 03 248 » 1005 Lausanne</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Dashboard;