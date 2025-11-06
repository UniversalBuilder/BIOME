import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './StatusColors.css';
import { Tooltip } from './Tooltip';

function ProjectTableView({ projects, onProjectSelect, filters = {}, selectedProject, onRefresh }) {
  const navigate = useNavigate();
  const [sortField, setSortField] = useState('last_updated');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState(filters.searchTerm || '');
  
  // Filters
  const [statusFilter, setStatusFilter] = useState(filters.status || '');
  const [softwareFilter, setSoftwareFilter] = useState(filters.software || '');
  const [groupFilter, setGroupFilter] = useState(filters.group || '');
  const [outputTypeFilter, setOutputTypeFilter] = useState(filters.output_type || '');
  const PREDEFINED_OUTPUT_TYPES = [
    'Counseling',
    'Video Tutorial',
    'Script',
    'Workflow/Protocol',
    'Training'
  ];

  // Monochrome pictogram per Output/Result Type
  const renderOutputTypeIcon = (type, isSelected = false) => {
    const common = `w-3.5 h-3.5 ${isSelected ? 'text-selected' : 'text-text-muted dark:text-text-muted'}`;
    const strokeColor = isSelected ? '#00F7FF' : 'currentColor';
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
        return (
          <svg className={common} viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2">
            <circle cx="6" cy="6" r="2" />
            <circle cx="18" cy="6" r="2" />
            <circle cx="12" cy="18" r="2" />
            <path d="M8 6h8M12 8v6" />
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

  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('');
    setSoftwareFilter('');
    setGroupFilter('');
    setOutputTypeFilter('');
    // Clear the global filters as well
    if (window.setTableFilter) {
      window.setTableFilter({});
    }
  }, []);

  // Handle refresh - call the onRefresh prop if it exists and reset filters
  const handleRefresh = useCallback(() => {
    // Clear all filters first
    resetFilters();
    
    // Then refresh the projects data
    if (onRefresh && typeof onRefresh === 'function') {
      onRefresh();
    }
  }, [onRefresh, resetFilters]);

  // Check if any filters are currently active
  const hasActiveFilters = useMemo(() => {
    return !!(searchTerm || statusFilter || softwareFilter || groupFilter || outputTypeFilter || filters.searchResults);
  }, [searchTerm, statusFilter, softwareFilter, groupFilter, outputTypeFilter, filters.searchResults]);

  // Update local state when filters prop changes
  useEffect(() => {
    setSearchTerm(filters.searchTerm || '');
    setStatusFilter(filters.status || '');
    setSoftwareFilter(filters.software || '');
    setGroupFilter(filters.group || '');
    setOutputTypeFilter(filters.output_type || '');
  }, [filters]);

  // Add hover effects to table rows programmatically
  useEffect(() => {
    const addHoverEffects = () => {
      const tableRows = document.querySelectorAll('tbody tr');
      tableRows.forEach((row, index) => {
        // Only target rows that have the hover classes (to avoid affecting other tables)
        if (row.className.includes('hover:bg-gray-50')) {
          // Remove any existing hover listeners
          row.removeEventListener('mouseenter', handleRowHover);
          row.removeEventListener('mouseleave', handleRowLeave);
          
          // Add new hover listeners
          row.addEventListener('mouseenter', handleRowHover);
          row.addEventListener('mouseleave', handleRowLeave);
        }
      });
    };

    const handleRowHover = (e) => {
      const isDarkMode = document.body.classList.contains('dark');
      
      // Target all cells in the row, not just the row itself
      const row = e.target.tagName === 'TR' ? e.target : e.target.closest('tr');
      const cells = row.querySelectorAll('td');
      
      cells.forEach(cell => {
        if (isDarkMode) {
          cell.style.setProperty('background-color', '#1E2A44', 'important'); // night-700 - more subtle
        } else {
          cell.style.setProperty('background-color', '#f8fafc', 'important'); // slate-50 - more subtle
        }
        cell.style.setProperty('transition', 'background-color 0.2s ease', 'important');
      });
    };

    const handleRowLeave = (e) => {
      // Clear background from all cells in the row
      const row = e.target.tagName === 'TR' ? e.target : e.target.closest('tr');
      const cells = row.querySelectorAll('td');
      
      cells.forEach(cell => {
        cell.style.removeProperty('background-color');
      });
    };

    // Apply hover effects after component renders
    const timer = setTimeout(addHoverEffects, 100);

    return () => {
      clearTimeout(timer);
      // Clean up event listeners
      const tableRows = document.querySelectorAll('tbody tr');
      tableRows.forEach(row => {
        if (row.className.includes('hover:bg-gray-50')) {
          row.removeEventListener('mouseenter', handleRowHover);
          row.removeEventListener('mouseleave', handleRowLeave);
        }
      });
    };
  }, [projects]); // Re-apply when projects data changes
  
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
    if (outputTypeFilter) {
      filtered = filtered.filter(project => (project.output_type || '') === outputTypeFilter);
    }
    
    // Sort the filtered results
    return filtered.sort((a, b) => {
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
  }, [projects, sortField, sortOrder, searchTerm, statusFilter, softwareFilter, groupFilter, outputTypeFilter, filters.searchResults]);

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

  return (
    <div className="h-full bg-white dark:bg-night-800 rounded-lg shadow-sm transition-all duration-300 hover:shadow-lg">
      <div className="p-4 flex justify-between items-center">
        <h3 className="text-base font-medium text-text dark:text-text-dark flex items-center gap-2">
          <svg className="w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Projects Table
        </h3>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-1 border border-slate-300 dark:border-night-600 dark:bg-night-800 dark:text-text-dark text-sm rounded-md"
          />
          <select
            value={outputTypeFilter}
            onChange={(e) => setOutputTypeFilter(e.target.value)}
            className="px-3 py-1 border border-slate-300 dark:border-night-600 dark:bg-night-800 dark:text-text-dark text-sm rounded-md"
            title="Filter by Output/Result Type"
          >
            <option value="">All output types</option>
            {PREDEFINED_OUTPUT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <button 
            onClick={resetFilters} 
            className={`btn btn-icon btn-sm transition-all duration-200 ${
              hasActiveFilters 
                ? 'text-red-600 hover:text-red-800' 
                : 'text-gray-400 dark:text-gray-600 opacity-50 cursor-not-allowed'
            }`}
            disabled={!hasActiveFilters}
            title={hasActiveFilters ? "Clear filters" : "No active filters"}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          <button 
            onClick={handleRefresh} 
            className={`btn btn-icon btn-sm transition-all duration-200 ${
              onRefresh 
                ? 'text-yellow-600 hover:text-yellow-800' 
                : 'text-gray-400 dark:text-gray-600 opacity-50 cursor-not-allowed'
            }`}
            disabled={!onRefresh}
            title={onRefresh ? "Refresh data and clear filters" : "Refresh not available"}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
      <div>
        <table className="w-full">
          <thead className="sticky top-0 z-10 bg-gray-100 dark:bg-night-700 border-b border-gray-200 dark:border-night-600">
            <tr>
              <th 
                className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-bioluminescent-300 uppercase tracking-wider cursor-pointer hover:text-gray-800 dark:hover:text-bioluminescent-200"
                onClick={() => handleSort('name')}
              >
                Name {renderSortArrow('name')}
              </th>
              <th 
                className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-bioluminescent-300 uppercase tracking-wider cursor-pointer hover:text-gray-800 dark:hover:text-bioluminescent-200"
                onClick={() => handleSort('status')}
              >
                Status {renderSortArrow('status')}
              </th>
              <th 
                className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-bioluminescent-300 uppercase tracking-wider cursor-pointer hover:text-gray-800 dark:hover:text-bioluminescent-200"
                onClick={() => handleSort('user_name')}
              >
                User {renderSortArrow('user_name')}
              </th>
              <th 
                className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-bioluminescent-300 uppercase tracking-wider cursor-pointer hover:text-gray-800 dark:hover:text-bioluminescent-200"
                onClick={() => handleSort('group_name')}
              >
                Group {renderSortArrow('group_name')}
              </th>
              <th 
                className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-bioluminescent-300 uppercase tracking-wider cursor-pointer hover:text-gray-800 dark:hover:text-bioluminescent-200"
                onClick={() => handleSort('software')}
              >
                Software {renderSortArrow('software')}
              </th>
              <th 
                className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-bioluminescent-300 uppercase tracking-wider cursor-pointer hover:text-gray-800 dark:hover:text-bioluminescent-200"
                onClick={() => handleSort('time_spent_minutes')}
              >
                Time {renderSortArrow('time_spent_minutes')}
              </th>
              <th 
                className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-bioluminescent-300 uppercase tracking-wider cursor-pointer hover:text-gray-800 dark:hover:text-bioluminescent-200"
                onClick={() => handleSort('start_date')}
              >
                Start Date {renderSortArrow('start_date')}
              </th>
              <th 
                className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-bioluminescent-300 uppercase tracking-wider cursor-pointer hover:text-gray-800 dark:hover:text-bioluminescent-200"
                onClick={() => handleSort('last_updated')}
              >
                Updated {renderSortArrow('last_updated')}
              </th>
              <th 
                className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-bioluminescent-300 uppercase tracking-wider cursor-pointer hover:text-gray-800 dark:hover:text-bioluminescent-200"
                onClick={() => handleSort('output_type')}
                title="Output/Result Type"
              >
                Output {renderSortArrow('output_type')}
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-bioluminescent-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border dark:divide-border-dark">
            {filteredProjects.length > 0 ? (
              filteredProjects.map((project, index) => (
                <tr 
                  key={project.id} 
                  className={`hover:bg-gray-50 dark:hover:bg-night-700 transition-colors animate-fade-in ${
                    selectedProject?.id === project.id ? 'row-selected' : ''
                  }`}
                  onClick={() => handleSelectProject(project)}
                  style={{ 
                    animationDelay: `${index * 30}ms`
                  }}
                  role="button"
                  aria-label={`View details for project ${project.name}`}
                >
                  <td className="px-4 py-3">
                    <div className={`text-sm font-medium break-words ${
                      selectedProject?.id === project.id 
                        ? 'text-selected' 
                        : 'text-text dark:text-text-dark'
                    }`}>
                      {project.name}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span 
                      className={`status-badge ${getStatusClass(project.status)} !py-1 !px-2 !text-xs !leading-tight`}
                    >
                      {mapStatusName(project.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className={`text-xs break-words ${
                      selectedProject?.id === project.id 
                        ? 'text-selected-muted' 
                        : 'text-text-muted dark:text-text-muted'
                    }`}>{project.user_name || "-"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className={`text-xs break-words ${
                      selectedProject?.id === project.id 
                        ? 'text-selected-muted' 
                        : 'text-text-muted dark:text-text-muted'
                    }`}>{project.group_name || "-"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className={`text-xs break-words ${
                      selectedProject?.id === project.id 
                        ? 'text-selected-muted' 
                        : 'text-text-muted dark:text-text-muted'
                    }`}>{project.software || "-"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className={`text-xs ${
                      selectedProject?.id === project.id 
                        ? 'text-selected-muted' 
                        : 'text-text-muted dark:text-text-muted'
                    }`}>{formatTimeSpent(project.time_spent_minutes)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className={`text-xs ${
                      selectedProject?.id === project.id 
                        ? 'text-selected-muted' 
                        : 'text-text-muted dark:text-text-muted'
                    }`}>{project.start_date ? formatDate(project.start_date).split(' ')[0] : "-"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className={`text-xs ${
                      selectedProject?.id === project.id 
                        ? 'text-selected-muted' 
                        : 'text-text-muted dark:text-text-muted'
                    }`}>{formatDate(project.last_updated || project.creation_date)}</div>
                  </td>
                  <td className="px-4 py-3">
                    {project.output_type ? (
                      <Tooltip>
                        <Tooltip.Trigger asChild>
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full 
                              ${selectedProject?.id === project.id
                                ? 'text-selected bg-bioluminescent-50/20 dark:bg-bioluminescent-900/30'
                                : 'border bg-gray-50 dark:bg-night-700/40 text-text-muted dark:text-text-muted border-gray-200 dark:border-night-600'}`}
                            style={selectedProject?.id === project.id ? { border: '1px solid #00F7FF' } : undefined}
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
                    ) : (
                      <span className="text-xs text-text-muted">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-sm whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent row click
                        handleSelectProject(project, true);
                      }}
                      className={`btn btn-text btn-sm ${
                        selectedProject?.id === project.id 
                          ? 'text-selected hover:text-selected' 
                          : 'text-text-muted dark:text-text-muted hover:text-text dark:hover:text-text-dark'
                      }`}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="10" className="px-4 py-4 text-center text-text-muted">
                  <div className="flex flex-col items-center py-6">
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
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ProjectTableView;