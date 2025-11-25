import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import './StatusColors.css';
import { Tooltip } from './Tooltip';
import Environment from '../utils/environmentDetection';
import { openFolderInExplorer } from '../services/filesystemApi';

const COL_CLASSES = {
  name: 'flex-1 min-w-[200px]',
  status: 'w-32 flex-none',
  user: 'w-32 flex-none',
  group: 'w-32 flex-none',
  software: 'w-28 flex-none',
  time: 'w-20 flex-none',
  start: 'w-28 flex-none',
  updated: 'w-36 flex-none',
  output: 'w-20 flex-none flex justify-center',
  actions: 'w-24 flex-none flex justify-center'
};

const Row = ({ index, style, projects, visibleCols, selectedProject, handleSelectProject, dense, getStatusClass, mapStatusName, formatTimeSpent, formatDate, renderOutputTypeIcon }) => {
  const project = projects && projects[index];
  const cellPad = dense ? 'px-3 py-2' : 'px-4 py-3';
  
  if (!project) return null;

  const safeVisibleCols = visibleCols || { name: true };

  return (
    <div 
      style={style} 
      className={`flex items-center border-b border-border dark:border-border-dark hover:bg-gray-50 dark:hover:bg-night-700 transition-colors ${
        selectedProject?.id === project.id ? 'bg-sky-50 dark:bg-night-700/50' : ''
      }`}
      onClick={() => handleSelectProject(project)}
      role="button"
    >
      {safeVisibleCols.name && (
        <div className={`${COL_CLASSES.name} ${cellPad}`}>
          <div className={`text-sm font-medium truncate ${selectedProject?.id === project.id ? 'text-selected' : 'text-text dark:text-text-dark'}`}>
            {project.name}
          </div>
        </div>
      )}
      {safeVisibleCols.status && (
        <div className={`${COL_CLASSES.status} ${cellPad}`}>
          <span className={`status-badge ${getStatusClass(project.status)} !py-1 !px-2 !text-xs !leading-tight`}>
            {mapStatusName(project.status)}
          </span>
        </div>
      )}
      {safeVisibleCols.user && (
        <div className={`${COL_CLASSES.user} ${cellPad}`}>
          <div className="text-xs truncate text-text-muted dark:text-text-muted">{project.user_name || "-"}</div>
        </div>
      )}
      {safeVisibleCols.group && (
        <div className={`${COL_CLASSES.group} ${cellPad}`}>
          <div className="text-xs truncate text-text-muted dark:text-text-muted">{project.group_name || "-"}</div>
        </div>
      )}
      {safeVisibleCols.software && (
        <div className={`${COL_CLASSES.software} ${cellPad}`}>
          <div className="text-xs truncate text-text-muted dark:text-text-muted">{project.software || "-"}</div>
        </div>
      )}
      {safeVisibleCols.time && (
        <div className={`${COL_CLASSES.time} ${cellPad}`}>
          <div className="text-xs text-text-muted dark:text-text-muted">{formatTimeSpent(project.time_spent_minutes)}</div>
        </div>
      )}
      {safeVisibleCols.start && (
        <div className={`${COL_CLASSES.start} ${cellPad}`}>
          <div className="text-xs text-text-muted dark:text-text-muted">{project.start_date ? formatDate(project.start_date).split(' ')[0] : "-"}</div>
        </div>
      )}
      {safeVisibleCols.updated && (
        <div className={`${COL_CLASSES.updated} ${cellPad}`}>
          <div className="text-xs text-text-muted dark:text-text-muted">{formatDate(project.last_updated || project.creation_date)}</div>
        </div>
      )}
      {safeVisibleCols.output && (
        <div className={`${COL_CLASSES.output} ${cellPad} flex items-center justify-center`}>
          {project.output_type ? (
            <Tooltip>
              <Tooltip.Trigger asChild>
                <span className={`inline-flex items-center justify-center h-6 px-2 rounded-md ${selectedProject?.id === project.id ? 'bg-bioluminescent-500/10 text-bioluminescent-300 ring-1 ring-bioluminescent-400/30' : 'bg-slate-500/10 text-slate-400 dark:text-slate-300 ring-1 ring-slate-300/20 dark:ring-night-600'}`}>
                  {renderOutputTypeIcon(project.output_type, selectedProject?.id === project.id)}
                </span>
              </Tooltip.Trigger>
              <Tooltip.Panel className="bg-surface text-text text-xs px-2 py-1 rounded shadow-lg">{project.output_type}</Tooltip.Panel>
            </Tooltip>
          ) : <span className="text-xs text-text-muted">-</span>}
        </div>
      )}
      {safeVisibleCols.actions && (
        <div className={`${COL_CLASSES.actions} ${cellPad} flex items-center justify-center gap-1.5`}>
          {Environment.isTauri() && project.project_path && project.folder_created && (
            <Tooltip>
              <Tooltip.Trigger asChild>
                <button onClick={(e) => { e.stopPropagation(); openFolderInExplorer(project.project_path); }} className="btn btn-icon btn-sm text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                </button>
              </Tooltip.Trigger>
              <Tooltip.Panel className="bg-surface text-text text-xs px-2 py-1 rounded shadow-lg">Open</Tooltip.Panel>
            </Tooltip>
          )}
          <Tooltip>
            <Tooltip.Trigger asChild>
              <button onClick={(e) => { e.stopPropagation(); handleSelectProject(project, true); }} className={`btn btn-icon btn-sm ${selectedProject?.id === project.id ? 'text-selected hover:text-selected' : 'text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100'}`}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" /><circle cx="12" cy="12" r="3" /></svg>
              </button>
            </Tooltip.Trigger>
            <Tooltip.Panel className="bg-surface text-text text-xs px-2 py-1 rounded shadow-lg">View</Tooltip.Panel>
          </Tooltip>
        </div>
      )}
    </div>
  );
};

function ProjectTableView({
  projects,
  onProjectSelect,
  filters = {},
  selectedProject,
  onRefresh,
  currentUserName, // kept for potential future use
  loading = false
}) {
  const navigate = useNavigate();
  const [sortField, setSortField] = useState('last_updated');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState(filters.searchTerm || '');
  const [dense, setDense] = useState(() => {
    try { return localStorage.getItem('biome_table_dense') === '1'; } catch { return false; }
  });
  const [showColMenu, setShowColMenu] = useState(false);
  const [visibleCols, setVisibleCols] = useState(() => {
    try {
      const raw = localStorage.getItem('biome_table_cols_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        // Ensure parsed is a valid object and not null
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch {}
    return {
      name: true,
      status: true,
      user: true,
      group: true,
      software: true,
      time: true,
      start: true,
      updated: true,
      output: true,
      actions: true
    };
  });
  const persistCols = (cols) => {
    setVisibleCols(cols);
    try { localStorage.setItem('biome_table_cols_v1', JSON.stringify(cols)); } catch {}
  };
  const colMenuRef = useRef(null);
  const colBtnRef = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (!showColMenu) return;
      const menu = colMenuRef.current; const btn = colBtnRef.current;
      if (menu && !menu.contains(e.target) && btn && !btn.contains(e.target)) {
        setShowColMenu(false);
      }
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setShowColMenu(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [showColMenu]);

  const exportCSV = () => {
    const colsOrder = [
      { key: 'name', label: 'Name' },
      { key: 'status', label: 'Status' },
      { key: 'user', label: 'User' },
      { key: 'group', label: 'Group' },
      { key: 'software', label: 'Software' },
      { key: 'time', label: 'Time' },
      { key: 'start', label: 'Start Date' },
      { key: 'updated', label: 'Updated' },
      { key: 'output', label: 'Output' }
    ].filter(c => visibleCols[c.key]);

    const header = colsOrder.map(c => `"${c.label}"`).join(',');
    const rows = filteredProjects.map(p => {
      const values = colsOrder.map(c => {
        switch (c.key) {
          case 'name': return p.name || '';
          case 'status': return mapStatusName(p.status || '');
          case 'user': return p.user_name || '';
          case 'group': return p.group_name || '';
          case 'software': return p.software || '';
          case 'time': return formatTimeSpent(p.time_spent_minutes);
          case 'start': return p.start_date ? formatDate(p.start_date).split(' ')[0] : '';
          case 'updated': return formatDate(p.last_updated || p.creation_date);
          case 'output': return p.output_type || '';
          default: return '';
        }
      }).map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(',');
      return values;
    });
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);
    a.href = url;
    a.download = `projects_${ts}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (window.toast) window.toast('Exported current view to CSV', { type: 'success', duration: 1500 });
  };
  
  // Filters
  const [statusFilter, setStatusFilter] = useState(filters.status || '');
  const [softwareFilter, setSoftwareFilter] = useState(filters.software || '');
  const [groupFilter, setGroupFilter] = useState(filters.group || '');
  const [userFilter, setUserFilter] = useState(filters.user_name || '');
  const [timeWindow, setTimeWindow] = useState(filters.timeWindow || ''); // '', last7, thisMonth, last30
  const [savedViews, setSavedViews] = useState(() => {
    try {
      const raw = localStorage.getItem('biomeProjectViews');
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });
  const [activeView, setActiveView] = useState(null);
  const [outputTypeFilter, setOutputTypeFilter] = useState(filters.output_type || '');
  const PREDEFINED_OUTPUT_TYPES = [
    'Counseling',
    'Video Tutorial',
    'Script',
    'Workflow/Protocol',
    'Training'
  ];

  const headerPad = dense ? 'px-3 py-2' : 'px-4 py-3';
  const cellPad = dense ? 'px-3 py-2' : 'px-4 py-3';
  const textSm = dense ? 'text-xs' : 'text-sm';

  // Monochrome pictogram per Output/Result Type
  const renderOutputTypeIcon = (type, isSelected = false) => {
    // Softer, theme-consistent coloring; rely on currentColor
    const common = `w-3.5 h-3.5 ${isSelected ? 'text-bioluminescent-300' : 'text-slate-400 dark:text-slate-300'}`;
    const strokeColor = 'currentColor';
    switch ((type || '').toLowerCase()) {
      case 'video tutorial':
        return (
          <svg className={common} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2">
            <path d="M14.752 11.168l-4.596-2.65A1 1 0 008 9.35v5.3a1 1 0 001.156.832l4.596-2.65a1 1 0 000-1.664z" />
            <rect x="3" y="4" width="18" height="16" rx="2" ry="2" />
          </svg>
        );
      case 'script':
        return (
          <svg className={common} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2">
            <path d="M8 16l-4-4 4-4" />
            <path d="M16 8l4 4-4 4" />
          </svg>
        );
      case 'workflow/protocol':
        // Minimal list icon for clear recognition at small sizes
        return (
          <svg className={common} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2">
            <path d="M5 7h14M5 12h14M5 17h10" />
          </svg>
        );
      case 'training':
        return (
          <svg className={common} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2">
            <path d="M22 10l-10-5-10 5 10 5 10-5z" />
            <path d="M6 12v5a6 6 0 0012 0v-5" />
          </svg>
        );
      case 'counseling':
      default:
        return (
          <svg className={common} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2">
            <path d="M21 15a4 4 0 01-4 4H7l-4 4V7a4 4 0 014-4h10a4 4 0 014 4v8z" />
          </svg>
        );
    }
  };
  // Update local state when external filters prop changes
  useEffect(() => {
    setSearchTerm(filters.searchTerm || '');
    setStatusFilter(filters.status || '');
    setSoftwareFilter(filters.software || '');
    setGroupFilter(filters.group || '');
    setUserFilter(filters.user_name || '');
    setTimeWindow(filters.timeWindow || '');
    setOutputTypeFilter(filters.output_type || '');
  }, [filters]);

  // Derived facet distinct options
  const distinctStatuses = useMemo(() => Array.from(new Set(projects.map(p => p.status).filter(Boolean))).sort(), [projects]);
  const distinctSoftware = useMemo(() => Array.from(new Set(projects.map(p => p.software).filter(Boolean))).sort(), [projects]);
  const distinctGroups = useMemo(() => Array.from(new Set(projects.map(p => p.group_name).filter(Boolean))).sort(), [projects]);
  const distinctUsers = useMemo(() => Array.from(new Set(projects.map(p => p.user_name).filter(Boolean))).sort(), [projects]);

  // Saved views helpers
  const persistViews = (views) => {
    setSavedViews(views);
    try { localStorage.setItem('biomeProjectViews', JSON.stringify(views)); } catch {}
  };

  const buildCurrentViewPayload = () => ({
    id: Date.now(),
    name: 'Untitled',
    sortField,
    sortOrder,
    filters: {
      searchTerm,
      status: statusFilter,
      software: softwareFilter,
      group: groupFilter,
      user_name: userFilter,
      timeWindow,
      output_type: outputTypeFilter
    }
  });

  const saveCurrentView = (name) => {
    const payload = buildCurrentViewPayload();
    payload.name = name || payload.name;
    persistViews([...savedViews, payload]);
    setActiveView(payload.id);
    if (window.toast) window.toast(`Saved view: ${payload.name}`, { type: 'success', duration: 1600 });
  };

  const applySavedView = (viewId) => {
    const view = savedViews.find(v => v.id === viewId);
    if (!view) return;
    const { filters: vf, sortField: sf, sortOrder: so } = view;
    setSortField(sf);
    setSortOrder(so);
    setSearchTerm(vf.searchTerm || '');
    setStatusFilter(vf.status || '');
    setSoftwareFilter(vf.software || '');
    setGroupFilter(vf.group || '');
    setUserFilter(vf.user_name || '');
    setTimeWindow(vf.timeWindow || '');
    setOutputTypeFilter(vf.output_type || '');
    setActiveView(view.id);
  };

  const deleteView = (viewId) => {
    persistViews(savedViews.filter(v => v.id !== viewId));
    if (activeView === viewId) setActiveView(null);
    if (window.toast) window.toast('Deleted saved view', { type: 'info', duration: 1400 });
  };

  // Clear all filters
  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('');
    setSoftwareFilter('');
    setGroupFilter('');
    setOutputTypeFilter('');
    setUserFilter('');
    setTimeWindow('');
    setActiveView(null);
    if (window.toast) window.toast('Filters cleared', { type: 'success', duration: 1400 });
    if (window.setTableFilter) window.setTableFilter({});
  }, []);

  // Refresh data (delegates to parent) then clear filters
  const handleRefresh = useCallback(() => {
    resetFilters();
    if (onRefresh && typeof onRefresh === 'function') {
      onRefresh();
      if (window.toast) window.toast('Projects refreshed', { type: 'success', duration: 1400 });
    }
  }, [onRefresh, resetFilters]);

  // Active filters check
  const hasActiveFilters = useMemo(() => (
    !!(searchTerm || statusFilter || softwareFilter || groupFilter || userFilter || timeWindow || outputTypeFilter || filters.searchResults)
  ), [searchTerm, statusFilter, softwareFilter, groupFilter, userFilter, timeWindow, outputTypeFilter, filters.searchResults]);

  // Preset: Active Projects
  const showActiveProjects = () => {
    setStatusFilter('Active');
    setTimeWindow('');
    setActiveView(null);
    if (window.toast) window.toast('Showing Active projects', { type: 'info', duration: 1800 });
  };

  // Simplified: rely on CSS hover states for a cleaner, consistent look (remove JS-driven hover styling)
  
  // Define the project and showing its details
  const handleSelectProject = (project, navigateToTab = true) => {
    // Select the project first
    onProjectSelect(project);
    
    // Then navigate to projects tab using React Router
    if (navigateToTab) {
      navigate('/projects');
      
      // Also call the global navigation handler to keep state in sync
      if (window.onNavigateToTab) {
        window.onNavigateToTab('projects');
      }
    }
  };
  
  // Map legacy status names to new ones
  const mapStatusName = (status) => {
    const statusMap = {
      'Intake': 'Preparing',
      'In Progress': 'Active',
      'In-Progress': 'Active',
      'Waiting': 'Review',
      'Pending': 'Preparing',
      'Planning': 'Preparing',
      'Finished': 'Completed'
    };
    return statusMap[status] || status || 'Preparing';
  };

  const getStatusClass = (status) => {
    const mappedStatus = mapStatusName(status);
    if (!mappedStatus) return 'status-badge status-Preparing';
    const formattedStatus = mappedStatus.split(' ').join('-');
    return `status-badge status-${formattedStatus}`;
  };
  
  // Filter projects based on all criteria including search results
  const filteredProjects = useMemo(() => {
    let filtered = [...projects];
    // console.log('Filtering projects. Total:', projects.length);
    
    // If we have search results from the dashboard, use only those
    if (filters.searchResults) {
      filtered = filters.searchResults;
    } else {
      // Apply regular filters
      if (searchTerm) {
        filtered = filtered.filter(project => {
          const searchFields = [
            project.name,
            project.description,
            project.user_name,
            project.group_name,
            project.software,
            ...(project.journal_entries || []).map(entry => entry.entry_text)
          ];
          return searchFields
            .filter(Boolean)
            .some(field => field.toLowerCase().includes(searchTerm.toLowerCase()));
        });
      }
    }
    
    // Always apply status/software/group filters
    if (statusFilter) {
      filtered = filtered.filter(project => project.status === statusFilter);
    }
    
    if (softwareFilter) {
      filtered = filtered.filter(project => project.software === softwareFilter);
    }
    
    if (groupFilter) {
      filtered = filtered.filter(project => project.group_name === groupFilter);
    }
    if (userFilter) {
      filtered = filtered.filter(project => project.user_name === userFilter);
    }
    if (timeWindow) {
      const now = new Date();
      filtered = filtered.filter(p => {
        const ref = p.last_updated || p.creation_date || p.start_date;
        if (!ref) return false;
        const d = new Date(ref);
        if (isNaN(d.getTime())) return false;
        if (timeWindow === 'last7') {
          return (now - d) <= 7 * 24 * 60 * 60 * 1000;
        } else if (timeWindow === 'thisMonth') {
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        } else if (timeWindow === 'last30') {
          return (now - d) <= 30 * 24 * 60 * 60 * 1000;
        }
        return true;
      });
    }
    if (outputTypeFilter) {
      filtered = filtered.filter(project => (project.output_type || '') === outputTypeFilter);
    }
    
    // Sort the filtered results
    const result = filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case 'time_spent_minutes':
          aValue = a[sortField] || 0;
          bValue = b[sortField] || 0;
          break;
        case 'last_updated':
        case 'start_date':
        case 'creation_date':
          aValue = a[sortField] ? new Date(a[sortField]) : new Date(0);
          bValue = b[sortField] ? new Date(b[sortField]) : new Date(0);
          break;
        case 'status':
          // Sort by mapped status name for consistency
          aValue = mapStatusName(a.status || '').toLowerCase();
          bValue = mapStatusName(b.status || '').toLowerCase();
          break;
        case 'name':
          aValue = (a.name || '').toLowerCase();
          bValue = (b.name || '').toLowerCase();
          break;
        case 'user_name':
          aValue = (a.user_name || '').toLowerCase();
          bValue = (b.user_name || '').toLowerCase();
          break;
        case 'group_name':
          aValue = (a.group_name || '').toLowerCase();
          bValue = (b.group_name || '').toLowerCase();
          break;
        case 'software':
          aValue = (a.software || '').toLowerCase();
          bValue = (b.software || '').toLowerCase();
          break;
        default:
          // Handle any other field generically
          aValue = (a[sortField] || '').toString().toLowerCase();
          bValue = (b[sortField] || '').toString().toLowerCase();
          break;
      }
      
      // Handle numeric values
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' 
          ? aValue - bValue
          : bValue - aValue;
      }
      
      // Handle date values
      if (aValue instanceof Date && bValue instanceof Date) {
        return sortOrder === 'asc' 
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }
      
      // Handle string values (case-insensitive)
      if (sortOrder === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });
    // console.log('Filtered count:', result.length);
    return result;
  }, [projects, sortField, sortOrder, searchTerm, statusFilter, softwareFilter, groupFilter, userFilter, timeWindow, outputTypeFilter, filters.searchResults]);

  // Format time spent minutes to hours and minutes
  const formatTimeSpent = (minutes) => {
    if (!minutes) return '0h';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };
  
  // Format date to be more readable
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Add missing sort functions
  const handleSort = (field) => {
    setSortField(field);
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const renderSortArrow = (field) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const visibleCount = useMemo(() => Object.values(visibleCols || {}).filter(Boolean).length, [visibleCols]);

  return (
    <div className="h-full bg-white dark:bg-night-800 rounded-lg shadow-sm transition-all duration-300 hover:shadow-lg flex flex-col">
      <div className="p-4 flex flex-col gap-3 flex-none">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-medium text-text dark:text-text-dark flex items-center gap-2">
          <svg className="w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Projects Table
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <input
              type="text"
              placeholder="Search"
              aria-label="Search projects"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-1 border border-slate-300 dark:border-night-600 dark:bg-night-800 dark:text-text-dark text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-sky-300"
            />
            {/* Output filter */}
            <select
              value={outputTypeFilter}
              onChange={(e) => setOutputTypeFilter(e.target.value)}
              className="px-3 py-1 border border-slate-300 dark:border-night-600 dark:bg-night-800 dark:text-text-dark text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-sky-300"
              title="Filter by Output/Result Type"
            >
              <option value="">Output: All</option>
              {PREDEFINED_OUTPUT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            {/* Saved views */}
            <select
              value={activeView || ''}
              onChange={(e)=> e.target.value ? applySavedView(Number(e.target.value)) : setActiveView(null)}
              className="px-2 py-1 border text-xs rounded focus:outline-none focus:ring-2 focus:ring-emerald-300"
              title="Saved views"
            >
              <option value="">Saved Views</option>
              {savedViews.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
            <button
              onClick={()=>{
                const name = prompt('Name for this view?');
                if (name) saveCurrentView(name);
              }}
              className="px-2 py-1 rounded-md text-xs font-medium border border-emerald-500 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              title="Save current filters as view"
            >Saved: Save View</button>
            {activeView && (
              <button
                onClick={()=> deleteView(activeView)}
                className="px-2 py-1 rounded-md text-xs font-medium border border-red-500 text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 focus:outline-none focus:ring-2 focus:ring-red-400"
                title="Delete active saved view"
              >Saved: Delete</button>
            )}
            {/* Preset */}
            <button
              onClick={showActiveProjects}
              className="px-3 py-1 rounded-md text-xs font-medium border border-sky-500 text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-900/20 hover:bg-sky-100 dark:hover:bg-sky-900/30 focus:outline-none focus:ring-2 focus:ring-sky-400"
              title="Preset: Active projects"
            >Preset: Active</button>
            {/* Utilities */}
            <button 
              onClick={resetFilters} 
              className={`px-2 py-1 rounded-md text-xs font-medium border ${hasActiveFilters ? 'border-red-500 text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30' : 'border-slate-500 text-slate-400 bg-transparent dark:bg-transparent cursor-not-allowed opacity-50'}`}
              disabled={!hasActiveFilters}
              title={hasActiveFilters ? 'Clear all filters' : 'No active filters'}
            >Filters: Clear</button>
            <button 
              onClick={handleRefresh} 
              className={`px-2 py-1 rounded-md text-xs font-medium border ${onRefresh ? 'border-amber-500 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30' : 'border-slate-500 text-slate-400 bg-transparent dark:bg-transparent cursor-not-allowed opacity-50'}`}
              disabled={!onRefresh}
              title={onRefresh ? 'Reload data & clear filters' : 'Refresh not available'}
            >Data: Refresh</button>
            <button
              onClick={() => {
                const next = !dense; setDense(next);
                try { localStorage.setItem('biome_table_dense', next ? '1' : '0'); } catch {}
                if (window.toast) window.toast(next ? 'Dense mode on' : 'Dense mode off', { type: 'info', duration: 1200 });
              }}
              className="px-2 py-1 rounded-md text-xs font-medium border border-slate-500 text-slate-700 dark:text-slate-300 bg-transparent dark:bg-transparent hover:bg-slate-100 dark:hover:bg-night-700/50 focus:outline-none focus:ring-2 focus:ring-slate-400"
              title="Toggle density"
            >{dense ? 'Density: Dense' : 'Density: Comfortable'}</button>
            <div className="relative">
              <button
                ref={colBtnRef}
                onClick={() => setShowColMenu(v => !v)}
                className="px-2 py-1 rounded-md text-xs font-medium border border-slate-500 text-slate-700 dark:text-slate-300 bg-transparent dark:bg-transparent hover:bg-slate-100 dark:hover:bg-night-700/50 focus:outline-none focus:ring-2 focus:ring-slate-400"
                aria-haspopup="true"
                aria-expanded={showColMenu}
                title="Show or hide table columns"
              >Columns: {visibleCount} shown</button>
              {showColMenu && (
                <div ref={colMenuRef} className="absolute right-0 mt-2 w-56 z-20 rounded-md border border-slate-300 dark:border-night-600 bg-white dark:bg-night-800 shadow-lg p-2 text-xs" role="menu">
                  {[
                    { key: 'name', label: 'Name', locked: true },
                    { key: 'status', label: 'Status' },
                    { key: 'user', label: 'User' },
                    { key: 'group', label: 'Group' },
                    { key: 'software', label: 'Software' },
                    { key: 'time', label: 'Time' },
                    { key: 'start', label: 'Start Date' },
                    { key: 'updated', label: 'Updated' },
                    { key: 'output', label: 'Output' },
                    { key: 'actions', label: 'Actions', locked: true },
                  ].map(item => (
                    <label key={item.key} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-50 dark:hover:bg-night-700/50 cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={item.locked}
                        checked={!!visibleCols[item.key]}
                        onChange={(e) => {
                          const next = { ...visibleCols, [item.key]: e.target.checked };
                          // Ensure at least Name and Actions remain visible
                          if (item.locked) return;
                          persistCols(next);
                        }}
                        className="accent-sky-500"
                      />
                      <span className={`${item.locked ? 'text-slate-400' : ''}`}>{item.label}{item.locked ? ' (required)' : ''}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={exportCSV}
              className="px-2 py-1 rounded-md text-xs font-medium border border-teal-500 text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-900/20 hover:bg-teal-100 dark:hover:bg-teal-900/30 focus:outline-none focus:ring-2 focus:ring-teal-400"
              title="Export current view as CSV"
            >Export: CSV</button>
          </div>
        </div>
        {/* Facets row */}
        <div className="flex flex-wrap gap-2 items-center">
          <select value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)} className="px-2 py-1 border text-xs rounded">
            <option value="">Status: All</option>
            {distinctStatuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={softwareFilter} onChange={(e)=>setSoftwareFilter(e.target.value)} className="px-2 py-1 border text-xs rounded">
            <option value="">Software: All</option>
            {distinctSoftware.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={groupFilter} onChange={(e)=>setGroupFilter(e.target.value)} className="px-2 py-1 border text-xs rounded">
            <option value="">Group: All</option>
            {distinctGroups.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <select value={userFilter} onChange={(e)=>setUserFilter(e.target.value)} className="px-2 py-1 border text-xs rounded">
            <option value="">User: All</option>
            {distinctUsers.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <select value={timeWindow} onChange={(e)=>setTimeWindow(e.target.value)} className="px-2 py-1 border text-xs rounded" title="Filter by time window">
            <option value="">Time: All</option>
            <option value="last7">Time: Last 7 days</option>
            <option value="thisMonth">Time: This month</option>
            <option value="last30">Time: Last 30 days</option>
          </select>
        </div>
      </div>
      
      {/* Table Header */}
      <div className="flex-none border-b border-gray-200 dark:border-night-600 bg-gray-100 dark:bg-night-700">
        <div className="flex items-center">
          {visibleCols.name && (
            <div 
              className={`${COL_CLASSES.name} ${headerPad} text-left ${textSm} font-medium text-gray-600 dark:text-bioluminescent-300 uppercase tracking-wider cursor-pointer hover:text-gray-800 dark:hover:text-bioluminescent-200`}
              onClick={() => handleSort('name')}
            >
              Name {renderSortArrow('name')}
            </div>
          )}
          {visibleCols.status && (
            <div 
              className={`${COL_CLASSES.status} ${headerPad} text-left ${textSm} font-medium text-gray-600 dark:text-bioluminescent-300 uppercase tracking-wider cursor-pointer hover:text-gray-800 dark:hover:text-bioluminescent-200`}
              onClick={() => handleSort('status')}
            >
              Status {renderSortArrow('status')}
            </div>
          )}
          {visibleCols.user && (
            <div 
              className={`${COL_CLASSES.user} ${headerPad} text-left ${textSm} font-medium text-gray-600 dark:text-bioluminescent-300 uppercase tracking-wider cursor-pointer hover:text-gray-800 dark:hover:text-bioluminescent-200`}
              onClick={() => handleSort('user_name')}
            >
              User {renderSortArrow('user_name')}
            </div>
          )}
          {visibleCols.group && (
            <div 
              className={`${COL_CLASSES.group} ${headerPad} text-left ${textSm} font-medium text-gray-600 dark:text-bioluminescent-300 uppercase tracking-wider cursor-pointer hover:text-gray-800 dark:hover:text-bioluminescent-200`}
              onClick={() => handleSort('group_name')}
            >
              Group {renderSortArrow('group_name')}
            </div>
          )}
          {visibleCols.software && (
            <div 
              className={`${COL_CLASSES.software} ${headerPad} text-left ${textSm} font-medium text-gray-600 dark:text-bioluminescent-300 uppercase tracking-wider cursor-pointer hover:text-gray-800 dark:hover:text-bioluminescent-200`}
              onClick={() => handleSort('software')}
            >
              Software {renderSortArrow('software')}
            </div>
          )}
          {visibleCols.time && (
            <div 
              className={`${COL_CLASSES.time} ${headerPad} text-left ${textSm} font-medium text-gray-600 dark:text-bioluminescent-300 uppercase tracking-wider cursor-pointer hover:text-gray-800 dark:hover:text-bioluminescent-200`}
              onClick={() => handleSort('time_spent_minutes')}
            >
              Time {renderSortArrow('time_spent_minutes')}
            </div>
          )}
          {visibleCols.start && (
            <div 
              className={`${COL_CLASSES.start} ${headerPad} text-left ${textSm} font-medium text-gray-600 dark:text-bioluminescent-300 uppercase tracking-wider cursor-pointer hover:text-gray-800 dark:hover:text-bioluminescent-200`}
              onClick={() => handleSort('start_date')}
            >
              Start Date {renderSortArrow('start_date')}
            </div>
          )}
          {visibleCols.updated && (
            <div 
              className={`${COL_CLASSES.updated} ${headerPad} text-left ${textSm} font-medium text-gray-600 dark:text-bioluminescent-300 uppercase tracking-wider cursor-pointer hover:text-gray-800 dark:hover:text-bioluminescent-200`}
              onClick={() => handleSort('last_updated')}
            >
              Updated {renderSortArrow('last_updated')}
            </div>
          )}
          {visibleCols.output && (
            <div 
              className={`${COL_CLASSES.output} ${headerPad} text-center ${textSm} font-medium text-gray-600 dark:text-bioluminescent-300 uppercase tracking-wider cursor-pointer hover:text-gray-800 dark:hover:text-bioluminescent-200`}
              onClick={() => handleSort('output_type')}
              title="Output/Result Type"
            >
              Output {renderSortArrow('output_type')}
            </div>
          )}
          {visibleCols.actions && (
            <div className={`${COL_CLASSES.actions} ${headerPad} text-center ${textSm} font-medium text-gray-600 dark:text-bioluminescent-300 uppercase tracking-wider`}>
              Actions
            </div>
          )}
        </div>
      </div>

      {/* Virtualized List */}
      <div className="flex-1 min-h-0 relative">
        {loading ? (
          <div className="p-4 text-center text-text-muted">Loading projects...</div>
        ) : filteredProjects.length > 0 ? (
          <List
            style={{ width: '100%', height: '100%' }}
            rowCount={filteredProjects.length}
            rowHeight={dense ? 40 : 56}
            rowComponent={Row}
            rowProps={{
              projects: filteredProjects,
              visibleCols: visibleCols || {},
              selectedProject,
              handleSelectProject,
              dense,
              getStatusClass,
              mapStatusName,
              formatTimeSpent,
              formatDate,
              renderOutputTypeIcon
            }}
          />
        ) : (
          <div className="flex flex-col items-center py-12 text-text-muted">
            <svg className="w-12 h-12 text-border mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-base font-medium">No projects found</p>
            <p className="text-sm mt-1">Try changing your search or filter criteria</p>
            <button 
              onClick={resetFilters}
              className="mt-4 btn btn-primary"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectTableView;