import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import './StatusColors.css';
import './ProjectList.css';
import { Tooltip } from './Tooltip';
import ImportProjectButton from './ImportProjectButton';

function ProjectList({ projects, selectedProject, onProjectSelect, onCreateNewProject, showScroll = true, loading = false }) {
  const [sortField, setSortField] = useState('last_updated');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [savedViews, setSavedViews] = useState([]);
  const [density, setDensity] = useState('comfortable');
  const [scrollState, setScrollState] = useState({ canScrollUp: false, canScrollDown: false });

  // Load saved views on mount
  useEffect(() => {
    const saved = localStorage.getItem('biome_saved_views');
    if (saved) {
      try {
        setSavedViews(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved views', e);
      }
    }
  }, []);

  const saveCurrentView = () => {
    const name = window.prompt('Enter a name for this view:');
    if (!name) return;
    
    const newView = {
      id: Date.now(),
      name,
      config: {
        sortField,
        sortOrder,
        searchQuery,
        statusFilter
      }
    };
    
    const newViews = [...savedViews, newView];
    setSavedViews(newViews);
    localStorage.setItem('biome_saved_views', JSON.stringify(newViews));
  };

  const applyView = (view) => {
    setSortField(view.config.sortField);
    setSortOrder(view.config.sortOrder);
    setSearchQuery(view.config.searchQuery);
    setStatusFilter(view.config.statusFilter);
  };

  const deleteView = (id, e) => {
    e.stopPropagation();
    if (window.confirm('Delete this saved view?')) {
      const newViews = savedViews.filter(v => v.id !== id);
      setSavedViews(newViews);
      localStorage.setItem('biome_saved_views', JSON.stringify(newViews));
    }
  };
  const scrollContainerRef = useRef(null);
  const resizeRafRef = useRef(null);

  // Filter and sort projects
  const filteredAndSortedProjects = useMemo(() => {
    // Start with a copy of the projects array
    let result = [...(projects || [])];

    // 1. Filter by Search Query
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(p => 
        (p.name || '').toLowerCase().includes(lowerQuery) ||
        (p.description || '').toLowerCase().includes(lowerQuery) ||
        (p.user_name || '').toLowerCase().includes(lowerQuery) ||
        (p.group_name || '').toLowerCase().includes(lowerQuery)
      );
    }

    // 2. Filter by Status
    if (statusFilter !== 'All') {
      result = result.filter(p => mapStatusName(p.status) === statusFilter);
    }

    // 3. Sort
    return result.sort((a, b) => {
      // Handle null values
      const aValue = a[sortField] ?? '';
      const bValue = b[sortField] ?? '';
      
      // Sort in the specified order
      return sortOrder === 'asc' ? 
        (aValue < bValue ? -1 : aValue > bValue ? 1 : 0)
        : (aValue > bValue ? -1 : aValue < bValue ? 1 : 0);
    });
  }, [projects, sortField, sortOrder, searchQuery, statusFilter]);

  // Check scroll position to show/hide scroll indicators
  const checkScrollPosition = useCallback(() => {
    const element = scrollContainerRef.current;
    if (!element) return;

    // Use a tiny epsilon to avoid off‑by‑one and rounding issues on resize
    const EPS = 1;
    const canScrollUp = element.scrollTop > EPS;
    const canScrollDown = element.scrollTop + element.clientHeight < element.scrollHeight - EPS;

    setScrollState((prev) => {
      if (prev.canScrollUp !== canScrollUp || prev.canScrollDown !== canScrollDown) {
        return { canScrollUp, canScrollDown };
      }
      return prev;
    });
  }, []);

  // Monochrome pictogram per Output/Result Type (keeps current icon style)
  const renderOutputTypeIcon = (type, isSelected = false) => {
    const common = `w-3.5 h-3.5 ${isSelected ? 'text-selected' : 'text-text-muted dark:text-text-muted'}`;
    const strokeColor = isSelected ? '#00F7FF' : 'currentColor';
    switch ((type || '').toLowerCase()) {
      case 'video tutorial':
        // Play icon
        return (
          <svg className={common} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2">
            <path d="M14.752 11.168l-4.596-2.65A1 1 0 008 9.35v5.3a1 1 0 001.156.832l4.596-2.65a1 1 0 000-1.664z" />
            <rect x="3" y="4" width="18" height="16" rx="2" ry="2" />
          </svg>
        );
      case 'script':
        // Code brackets
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
        // Graduation cap
        return (
          <svg className={common} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2">
            <path d="M22 10l-10-5-10 5 10 5 10-5z" />
            <path d="M6 12v5a6 6 0 0012 0v-5" />
          </svg>
        );
      case 'counseling':
      default:
        // Chat bubble
        return (
          <svg className={common} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2">
            <path d="M21 15a4 4 0 01-4 4H7l-4 4V7a4 4 0 014-4h10a4 4 0 014 4v8z" />
          </svg>
        );
    }
  };

  // Effect to set up scroll listener and initial state (run once)
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    // Initial measurement (next frame to ensure layout is settled)
    resizeRafRef.current = requestAnimationFrame(checkScrollPosition);

    // Scroll listener
    scrollContainer.addEventListener('scroll', checkScrollPosition);

    // Observe size changes of the scroll container AND its content
    const ro = new ResizeObserver(() => {
      // Defer to next frame for stable numbers during active resize
      if (resizeRafRef.current) cancelAnimationFrame(resizeRafRef.current);
      resizeRafRef.current = requestAnimationFrame(checkScrollPosition);
    });
    ro.observe(scrollContainer);
    if (scrollContainer.firstElementChild) {
      ro.observe(scrollContainer.firstElementChild);
    }

    // Window resize fallback (covers environment/layout changes)
    const onWinResize = () => {
      if (resizeRafRef.current) cancelAnimationFrame(resizeRafRef.current);
      resizeRafRef.current = requestAnimationFrame(checkScrollPosition);
    };
    window.addEventListener('resize', onWinResize);

    return () => {
      scrollContainer.removeEventListener('scroll', checkScrollPosition);
      ro.disconnect();
      window.removeEventListener('resize', onWinResize);
      if (resizeRafRef.current) cancelAnimationFrame(resizeRafRef.current);
    };
  }, [checkScrollPosition]);

  // Re-measure when the list contents change (without re-attaching listeners)
  useEffect(() => {
    if (resizeRafRef.current) cancelAnimationFrame(resizeRafRef.current);
    resizeRafRef.current = requestAnimationFrame(checkScrollPosition);
  }, [filteredAndSortedProjects, checkScrollPosition]);

  const handleCreateProject = () => {
    // Use the wizard if the prop is provided, otherwise fall back to old method
    if (onCreateNewProject) {
      onCreateNewProject();
    } else {
      // Fallback to old temporary project method
      const tempProject = {
        name: '',
        description: '',
        status: 'Preparing',
        user_id: null,
        start_date: new Date().toISOString().split('T')[0],
        isTemp: true // Flag to indicate this is a temporary project
      };
      
      onProjectSelect(tempProject, true);
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

  const getStatusColor = (status) => {
    const mappedStatus = mapStatusName(status);
    if (!mappedStatus) return 'status-badge status-Preparing';
    const formattedStatus = mappedStatus.split(' ').join('-');
    return `status-badge status-${formattedStatus}`;
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const renderSortButton = (field, label) => {
    const isActive = sortField === field;
    
    return (
      <button
        onClick={() => handleSort(field)}
        className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl transition-all duration-200 backdrop-filter backdrop-blur-sm ${
          isActive
            ? 'bg-gradient-to-r from-bioluminescent-100/80 to-bioluminescent-50/80 dark:from-bioluminescent-900/40 dark:to-bioluminescent-800/40 text-bioluminescent-700 dark:text-bioluminescent-300 shadow-sm' 
            : 'bg-white/60 dark:bg-surface-dark/60 text-gray-600 dark:text-gray-400 hover:bg-white/80 dark:hover:bg-surface-dark/80 hover:text-gray-800 dark:hover:text-gray-300'
        }`}
        title={`Sort by ${label} ${isActive ? (sortOrder === 'asc' ? '(ascending)' : '(descending)') : ''}`}
      >
        {/* Sort icon */}
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
        
        {/* Label */}
        <span className="font-medium">{label}</span>
        
        {/* Active sort indicator */}
        {isActive && (
          <span className="text-xs font-bold">
            {sortOrder === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="bg-white dark:bg-night-800 rounded-xl shadow-lg backdrop-filter backdrop-blur-xl h-full flex flex-col">
      <div className="p-4 space-y-4">
        {/* Header and New Project Button */}
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Projects
          </h3>
          <div className="flex gap-2">
            <Tooltip>
              <Tooltip.Trigger asChild>
                <ImportProjectButton 
                  onProjectImported={(p) => {
                    if (onProjectSelect) onProjectSelect(p);
                  }}
                  className="btn btn-secondary hover-soft flex items-center justify-center w-9 h-9 p-0 rounded-xl"
                >
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </ImportProjectButton>
              </Tooltip.Trigger>
              <Tooltip.Panel className="bg-gray-800/90 text-white text-xs px-2 py-1 rounded shadow-lg backdrop-filter backdrop-blur-sm">
                Import Project
              </Tooltip.Panel>
            </Tooltip>
            <button
              onClick={handleCreateProject}
              className="btn-gradient-cyan transition-all duration-200 px-3 py-2 rounded-xl text-sm font-medium flex items-center whitespace-nowrap"
              style={{
                backdropFilter: 'blur(10px)'
              }}
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Project
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-3">
          {/* Search Bar */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400 group-focus-within:text-bioluminescent-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl leading-5 bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-bioluminescent-400/50 focus:border-bioluminescent-400 transition-all sm:text-sm backdrop-blur-sm"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Status Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {['All', 'Preparing', 'Active', 'Review', 'Completed'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`
                  px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 border
                  ${statusFilter === status
                    ? 'bg-bioluminescent-50 dark:bg-bioluminescent-900/30 text-bioluminescent-700 dark:text-bioluminescent-300 border-bioluminescent-200 dark:border-bioluminescent-700/50 shadow-sm'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }
                `}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Saved Views */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700/50">
             <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Views:</span>
             {savedViews.map(view => (
               <div 
                key={view.id} 
                onClick={() => applyView(view)}
                className="group flex items-center gap-1.5 px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
               >
                 <span className="text-gray-700 dark:text-gray-300">{view.name}</span>
                 <button 
                  onClick={(e) => deleteView(view.id, e)} 
                  className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete view"
                 >
                   <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                   </svg>
                 </button>
               </div>
             ))}
             <button 
              onClick={saveCurrentView} 
              className="text-xs text-bioluminescent-600 dark:text-bioluminescent-400 hover:text-bioluminescent-700 dark:hover:text-bioluminescent-300 font-medium flex items-center gap-1 px-2 py-1 rounded hover:bg-bioluminescent-50 dark:hover:bg-bioluminescent-900/20 transition-colors"
             >
               <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
               </svg>
               Save View
             </button>
          </div>
        </div>

        {/* Sort Options and Density Toggle */}
        <div className="flex justify-between items-end">
          <div className="space-y-2 flex-grow">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
              </svg>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Sort by:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {renderSortButton('name', 'Name')}
              {renderSortButton('status', 'Status')}
              {renderSortButton('user_name', 'User')}
              {renderSortButton('group_name', 'Group')}
              {renderSortButton('last_updated', 'Updated')}
            </div>
          </div>

          {/* Density Toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700 ml-4 flex-shrink-0">
            <button
              onClick={() => setDensity('comfortable')}
              className={`p-1.5 rounded-md transition-all ${density === 'comfortable' ? 'bg-white dark:bg-gray-700 shadow-sm text-bioluminescent-600 dark:text-bioluminescent-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
              title="Comfortable view"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => setDensity('compact')}
              className={`p-1.5 rounded-md transition-all ${density === 'compact' ? 'bg-white dark:bg-gray-700 shadow-sm text-bioluminescent-600 dark:text-bioluminescent-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
              title="Compact view"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Projects List with Custom Scroll */}
      <div className="flex-1 min-h-0 relative stable-scroll-container">
        {/* Top scroll indicator */}
        {showScroll && scrollState.canScrollUp && (
          <div className="absolute top-0 left-0 right-0 z-10 h-8 bg-gradient-to-b from-white/90 via-white/60 to-transparent dark:from-gray-900/90 dark:via-gray-900/60 dark:to-transparent pointer-events-none">
            <div className="flex justify-center pt-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bioluminescent-100/90 dark:bg-bioluminescent-900/40 text-bioluminescent-700 dark:text-bioluminescent-200 ring-1 ring-bioluminescent-300/60 shadow-md backdrop-filter backdrop-blur-sm">
                <svg className="w-3.5 h-3.5 text-bioluminescent-600 dark:text-bioluminescent-300 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
                <span className="text-xs font-semibold">More above</span>
              </div>
            </div>
          </div>
        )}

        {/* Bottom scroll indicator */}
        {showScroll && scrollState.canScrollDown && (
          <div className="absolute bottom-0 left-0 right-0 z-10 h-8 bg-gradient-to-t from-white/90 via-white/60 to-transparent dark:from-gray-900/90 dark:via-gray-900/60 dark:to-transparent pointer-events-none">
            <div className="flex justify-center pb-2 pt-6">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bioluminescent-100/90 dark:bg-bioluminescent-900/40 text-bioluminescent-700 dark:text-bioluminescent-200 ring-1 ring-bioluminescent-300/60 shadow-md backdrop-filter backdrop-blur-sm">
                <span className="text-xs font-semibold">More below</span>
                <svg className="w-3.5 h-3.5 text-bioluminescent-600 dark:text-bioluminescent-300 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable content with stable hidden scrollbar */}
        <div 
          ref={scrollContainerRef}
          className={`h-full p-4 project-list-container ${showScroll ? 'scrollbar-hidden' : ''}`}
        >
          <div className={`space-y-${density === 'compact' ? '2' : '3'}`}>
            {loading ? (
              // Skeleton Loading State
              Array.from({ length: 5 }).map((_, index) => (
                <div 
                  key={`skeleton-${index}`}
                  className={`${density === 'compact' ? 'p-3' : 'p-5'} rounded-xl bg-white/70 dark:bg-gray-800/60 backdrop-filter backdrop-blur-lg shadow-sm animate-pulse border border-white/20`}
                >
                  <div className="space-y-2">
                    <div className="flex flex-col gap-2">
                      {/* Title skeleton */}
                      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-md w-3/4"></div>
                      {/* Status badge skeleton */}
                      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-20"></div>
                    </div>
                    
                    <div className="flex gap-4 pt-2">
                      {/* User info skeleton */}
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                      {/* Group info skeleton */}
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : filteredAndSortedProjects.length > 0 ? (
              filteredAndSortedProjects.map((project, index) => (
                <div
                  key={project.id || `temp_${index}`}
                  onClick={() => onProjectSelect(project)}
                  className={`
                    ${density === 'compact' ? 'p-3' : 'p-5'} rounded-xl transition-all duration-300 cursor-pointer backdrop-filter backdrop-blur-lg shadow-sm project-hover
                    ${selectedProject?.id === project.id 
                      ? 'project-selected bg-gradient-to-br from-bioluminescent-50/90 to-white/70 dark:from-bioluminescent-900/40 dark:to-gray-800/60 shadow-lg' 
                      : 'bg-white/70 dark:bg-gray-800/60'
                    }
                  `}
                  style={{ 
                    animationDelay: `${index * 30}ms`
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-grow">
                      <div className={`flex ${density === 'compact' ? 'flex-row items-center justify-between gap-4' : 'flex-col gap-2'}`}>
                        <h4 
                          className={`text-sm font-medium text-gray-900 dark:text-gray-100`}
                          title={project.name || 'Untitled Project'}
                        >
                          <span className={`break-words leading-tight ${selectedProject?.id === project.id ? 'text-selected' : ''}`}>
                            {project.name || 'Untitled Project'}
                          </span>
                        </h4>
                        <span 
                          className={`${getStatusColor(project.status)} inline-flex w-fit ${density === 'compact' ? 'scale-90 origin-right' : ''}`}
                        >
                          {mapStatusName(project.status)}
                        </span>
                      </div>
                      
                      <div className={`flex gap-4 ${density === 'compact' ? 'pt-1' : ''}`}>
                        <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                          <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {project.user_name || '—'}
                        </div>
                        <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                          <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          {project.group_name || '—'}
                        </div>
                        {project.output_type && (
                          <div className="flex items-center text-xs">
                            <Tooltip>
                              <Tooltip.Trigger asChild>
                                <span
                                  className={`inline-flex items-center justify-center h-6 px-2 rounded-md 
                                    ${selectedProject?.id === project.id
                                      ? 'text-selected bg-bioluminescent-50/20 dark:bg-bioluminescent-900/30 ring-1 ring-bioluminescent-400/40'
                                      : 'bg-gray-50 dark:bg-night-700/40 text-text-muted dark:text-text-muted ring-1 ring-gray-200/70 dark:ring-night-600/70'}`}
                                  role="img"
                                  aria-label={`Output type: ${project.output_type}`}
                                >
                                  {renderOutputTypeIcon(project.output_type, selectedProject?.id === project.id)}
                                </span>
                              </Tooltip.Trigger>
                              <Tooltip.Panel className="bg-surface text-text text-xs px-2 py-1 rounded shadow-lg">
                                {project.output_type}
                              </Tooltip.Panel>
                            </Tooltip>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <div className="w-12 h-12 rounded-full bg-gray-50/60 dark:bg-surface-dark/60 backdrop-filter backdrop-blur-sm flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <p className="text-sm">No projects yet.</p>
                <p className="text-xs mt-1">Click "New Project" to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectList;