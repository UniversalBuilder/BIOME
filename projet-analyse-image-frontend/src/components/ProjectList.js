import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import './StatusColors.css';
import './ProjectList.css';
import { Tooltip } from './Tooltip';

function ProjectList({ projects, selectedProject, onProjectSelect, onCreateNewProject, showScroll = true }) {
  const [sortField, setSortField] = useState('last_updated');
  const [sortOrder, setSortOrder] = useState('desc');
  const [scrollState, setScrollState] = useState({ canScrollUp: false, canScrollDown: false });
  const scrollContainerRef = useRef(null);
  const resizeRafRef = useRef(null);

  // Filter and sort projects
  const filteredAndSortedProjects = useMemo(() => {
    // Copy to avoid mutating the incoming prop array during sort
    return ([...(projects || [])]).sort((a, b) => {
      // Handle null values
      const aValue = a[sortField] ?? '';
      const bValue = b[sortField] ?? '';
      
      // Sort in the specified order
      return sortOrder === 'asc' ? 
        (aValue < bValue ? -1 : aValue > bValue ? 1 : 0)
        : (aValue > bValue ? -1 : aValue < bValue ? 1 : 0);
    });
  }, [projects, sortField, sortOrder]);

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

        {/* Sort Options */}
        <div className="space-y-2">
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
          <div className="space-y-3">
            {filteredAndSortedProjects.length > 0 ? (
              filteredAndSortedProjects.map((project, index) => (
                <div
                  key={project.id || `temp_${index}`}
                  onClick={() => onProjectSelect(project)}
                  className={`
                    p-5 rounded-xl transition-all duration-300 cursor-pointer backdrop-filter backdrop-blur-lg shadow-sm project-hover
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
                      <div className="flex flex-col gap-2">
                        <h4 
                          className={`text-sm font-medium text-gray-900 dark:text-gray-100`}
                          title={project.name || 'Untitled Project'}
                        >
                          <span className={`break-words leading-tight ${selectedProject?.id === project.id ? 'text-selected' : ''}`}>
                            {project.name || 'Untitled Project'}
                          </span>
                        </h4>
                        <span 
                          className={`${getStatusColor(project.status)} inline-flex w-fit`}
                        >
                          {mapStatusName(project.status)}
                        </span>
                      </div>
                      
                      <div className="flex gap-4">
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