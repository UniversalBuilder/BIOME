import React, { useMemo, useState, useEffect } from 'react';

function QuickActions({ projects, onQuickAction }) {
  const [savedViews, setSavedViews] = useState([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem('biomeProjectViews');
      if (raw) setSavedViews(JSON.parse(raw));
    } catch {}
  }, []);
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
      <div className="bg-white dark:bg-night-800 rounded-lg shadow-sm border border-gray-200 dark:border-night-600 overflow-hidden">
        <div className="p-3 border-b border-gray-200 dark:border-night-600 flex justify-between items-center bg-gray-50 dark:bg-night-700/50">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-bioluminescent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h4 className="text-xs font-medium text-gray-800 dark:text-white">Status</h4>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-200 dark:bg-night-600 text-gray-600 dark:text-gray-300">{statusFilters.length}</span>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-night-600 max-h-48 overflow-y-auto">
          {statusFilters.map(([status, count]) => (
            <button
              key={status}
              onClick={() => handleFilterClick({ status })}
              className="w-full px-4 py-2.5 text-xs text-left hover:bg-bioluminescent-50 dark:hover:bg-bioluminescent-900/10 transition-colors flex items-center justify-between group"
            >
              <span className="text-gray-700 dark:text-gray-200 font-medium group-hover:text-bioluminescent-700 dark:group-hover:text-bioluminescent-300 transition-colors">{status}</span>
              <span className="text-bioluminescent-600 dark:text-bioluminescent-400 font-semibold bg-bioluminescent-50 dark:bg-bioluminescent-900/20 px-1.5 py-0.5 rounded text-[10px]">{count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Software Filters Section */}
      <div className="bg-white dark:bg-night-800 rounded-lg shadow-sm border border-gray-200 dark:border-night-600 overflow-hidden">
        <div className="p-3 border-b border-gray-200 dark:border-night-600 flex justify-between items-center bg-gray-50 dark:bg-night-700/50">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <h4 className="text-xs font-medium text-gray-800 dark:text-white">Software</h4>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-200 dark:bg-night-600 text-gray-600 dark:text-gray-300">{softwareFilters.length}</span>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-night-600 max-h-48 overflow-y-auto">
          {softwareFilters.map(([software, count]) => (
            <button
              key={software}
              onClick={() => handleFilterClick({ software })}
              className="w-full px-4 py-2.5 text-xs text-left hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors flex items-center justify-between group"
            >
              <span className="text-gray-700 dark:text-gray-200 font-medium group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">{software}</span>
              <span className="text-purple-600 dark:text-purple-400 font-semibold bg-purple-50 dark:bg-purple-900/20 px-1.5 py-0.5 rounded text-[10px]">{count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Saved Views Section */}
      <div className="bg-white dark:bg-night-800 rounded-lg shadow-sm border border-gray-200 dark:border-night-600 overflow-hidden">
        <div className="p-3 border-b border-gray-200 dark:border-night-600 flex justify-between items-center bg-gray-50 dark:bg-night-700/50">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <h4 className="text-xs font-medium text-gray-800 dark:text-white">Saved Views</h4>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-200 dark:bg-night-600 text-gray-600 dark:text-gray-300">{savedViews.length || 0}</span>
        </div>
        {savedViews.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-night-600 max-h-48 overflow-y-auto">
            {savedViews.map(v => (
              <button
                key={v.id}
                onClick={() => handleFilterClick({ ...(v.filters || {}) })}
                className="w-full px-4 py-2.5 text-xs text-left hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors flex items-center justify-between group"
                title="Apply saved view in Table"
              >
                <span className="text-gray-700 dark:text-gray-200 font-medium truncate group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">{v.name}</span>
                <svg className="w-3 h-3 text-gray-400 group-hover:text-amber-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        ) : (
          <div className="p-4 text-xs text-gray-500 dark:text-gray-400 text-center italic">No saved views yet</div>
        )}
      </div>
    </div>
  );
}

export default QuickActions;