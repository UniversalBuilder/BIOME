import React, { useMemo } from 'react';

function QuickActions({ projects, onQuickAction }) {
  // Calculate projects by status
  const statusFilters = useMemo(() => {
    const statusCounts = {};
    projects.forEach(project => {
      const status = project.status || 'Unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    return Object.entries(statusCounts).sort((a, b) => b[1] - a[1]); // Sort by count descending
  }, [projects]);

  // Calculate projects by software
  const softwareFilters = useMemo(() => {
    const softwareCounts = {};
    projects.forEach(project => {
      const software = project.software || 'Not specified';
      softwareCounts[software] = (softwareCounts[software] || 0) + 1;
    });
    return Object.entries(softwareCounts).sort((a, b) => b[1] - a[1]); // Sort by count descending
  }, [projects]);

  const handleFilterClick = (filterParams) => {
    if (onQuickAction) {
      onQuickAction('filter', filterParams);
    }
  };

  return (
    <div className="space-y-8">
      {/* Status Filters Section */}
      <div className="bg-white dark:bg-night-800 rounded-lg shadow-sm border border-gray-200 dark:border-night-600">
        <div className="p-4 border-b border-gray-200 dark:border-night-600 flex justify-between items-center">
          <h4 className="text-xs font-medium text-gray-800 dark:text-white">Status</h4>
          <span className="text-xs text-gray-600 dark:text-gray-300">{statusFilters.length} types</span>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-night-600">
          {statusFilters.map(([status, count]) => (
            <button
              key={status}
              onClick={() => handleFilterClick({ status })}
              className="w-full px-4 py-3 text-xs text-left hover:bg-gray-50 dark:hover:bg-night-700 transition-colors flex items-center justify-between group"
            >
              <span className="text-gray-800 dark:text-white font-medium">{status}</span>
              <span className="text-blue-600 dark:text-cyan-300 font-semibold">{count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Software Filters Section */}
      <div className="bg-white dark:bg-night-800 rounded-lg shadow-sm border border-gray-200 dark:border-night-600">
        <div className="p-4 border-b border-gray-200 dark:border-night-600 flex justify-between items-center">
          <h4 className="text-xs font-medium text-gray-800 dark:text-white">Software</h4>
          <span className="text-xs text-gray-600 dark:text-gray-300">{softwareFilters.length} types</span>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-night-600">
          {softwareFilters.map(([software, count]) => (
            <button
              key={software}
              onClick={() => handleFilterClick({ software })}
              className="w-full px-4 py-3 text-xs text-left hover:bg-gray-50 dark:hover:bg-night-700 transition-colors flex items-center justify-between group"
            >
              <span className="text-gray-800 dark:text-white font-medium">{software}</span>
              <span className="text-blue-600 dark:text-cyan-300 font-semibold">{count}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default QuickActions;