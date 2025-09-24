import React, { useState, useMemo, useRef, useEffect } from 'react';
import './StatusColors.css';
import './ProjectList.css';

function ProjectList({ projects, selectedProject, onProjectSelect, onCreateNewProject, showScroll = true }) {
  const [sortField, setSortField] = useState('last_updated');
  const [sortOrder, setSortOrder] = useState('desc');
  const [scrollState, setScrollState] = useState({ canScrollUp: false, canScrollDown: false });
  const scrollContainerRef = useRef(null);

  // Filter and sort projects
  const filteredAndSortedProjects = useMemo(() => {
    return (projects || []).sort((a, b) => {
      // Handle null values
      const aValue = a[sortField] ?? '';
      const bValue = b[sortField] ?? '';
      
      // Sort in the specified order
      return sortOrder === 'asc' ? 
        aValue < bValue ? -1 : aValue > bValue ? 1 : 0 
        : aValue > bValue ? -1 
        : aValue < bValue ? 1 : 0;
    });
  }, [projects, sortField, sortOrder]);

  // Check scroll position to show/hide scroll indicators
  const checkScrollPosition = () => {
    if (!scrollContainerRef.current) return;
    
    const element = scrollContainerRef.current;
    const canScrollUp = element.scrollTop > 10;
    const canScrollDown = element.scrollTop < element.scrollHeight - element.clientHeight - 10;
    
    setScrollState({ canScrollUp, canScrollDown });
  };

  // Effect to set up scroll listener and initial state
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    // Check initial scroll state
    checkScrollPosition();

    // Add scroll listener
    scrollContainer.addEventListener('scroll', checkScrollPosition);
    
    // Check scroll state when content changes
    const observer = new ResizeObserver(checkScrollPosition);
    observer.observe(scrollContainer);

    return () => {
      scrollContainer.removeEventListener('scroll', checkScrollPosition);
      observer.disconnect();
    };
  }, [filteredAndSortedProjects]);

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
      <div className="flex-1 relative stable-scroll-container">
        {/* Top scroll indicator */}
        {showScroll && scrollState.canScrollUp && (
          <div className="absolute top-0 left-0 right-0 z-10 h-8 bg-gradient-to-b from-white/90 via-white/60 to-transparent dark:from-gray-900/90 dark:via-gray-900/60 dark:to-transparent pointer-events-none">
            <div className="flex justify-center pt-2">
              <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-filter backdrop-blur-sm shadow-sm">
                <svg className="w-3 h-3 text-bioluminescent-500 dark:text-bioluminescent-400 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
                <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">More above</span>
              </div>
            </div>
          </div>
        )}

        {/* Bottom scroll indicator */}
        {showScroll && scrollState.canScrollDown && (
          <div className="absolute bottom-0 left-0 right-0 z-10 h-8 bg-gradient-to-t from-white/90 via-white/60 to-transparent dark:from-gray-900/90 dark:via-gray-900/60 dark:to-transparent pointer-events-none">
            <div className="flex justify-center pb-2 pt-6">
              <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-filter backdrop-blur-sm shadow-sm">
                <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">More below</span>
                <svg className="w-3 h-3 text-bioluminescent-500 dark:text-bioluminescent-400 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          style={{ 
            minHeight: showScroll ? 'calc(100vh - 14rem)' : 'auto', 
            maxHeight: showScroll ? 'calc(100vh - 14rem)' : 'none'
          }}
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
                        className={`text-sm font-medium ${
                          selectedProject?.id === project.id 
                            ? 'text-bioluminescent-700 dark:text-bioluminescent-300' 
                            : 'text-gray-900 dark:text-gray-100'
                        }`}
                        title={project.name || 'Untitled Project'}
                      >
                        <span className="break-words leading-tight">
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