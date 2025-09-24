import React from 'react';

const GroupAnalytics = ({ analytics = {} }) => {
  const {
    projectsByGroup = [],
    timeByGroup = [],
    completionRateByGroup = []
  } = analytics;

  return (
    <div className="space-y-4">
      {/* Projects by Group */}
      <div>
        <h4 className="font-medium text-xs text-slate-700 dark:text-gray-300 mb-2">Projects Distribution</h4>
        <div className="space-y-2">
          {projectsByGroup.map(group => (
            <div key={group.name} className="flex items-center gap-2">
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-medium text-slate-600 dark:text-gray-400">{group.name}</span>
                  <span className="text-xs font-medium text-slate-700 dark:text-gray-300">{group.count}</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-night-600 rounded-full shadow-inner">
                  <div
                    className="h-full rounded-full shadow-sm"
                    style={{ 
                      width: `${(group.count / Math.max(...projectsByGroup.map(g => g.count), 1)) * 100}%`,
                      background: 'linear-gradient(45deg, #06B6D4, #0891B2)',
                      boxShadow: '0 2px 6px rgba(6, 182, 212, 0.3)'
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
          {projectsByGroup.length === 0 && (
            <div className="text-center py-2 bg-slate-50 dark:bg-night-700 rounded-md">
              <p className="text-xs text-slate-500 dark:text-gray-400 italic">No group data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Time by Group */}
      <div>
        <h4 className="font-medium text-xs text-slate-700 dark:text-gray-300 mb-2">Time Distribution (hours)</h4>
        <div className="space-y-2">
          {timeByGroup.map(group => (
            <div key={group.name} className="flex items-center gap-2">
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-medium text-slate-600 dark:text-gray-400">{group.name}</span>
                  <span className="text-xs font-medium text-slate-700 dark:text-gray-300">{group.hours}h</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-night-600 rounded-full shadow-inner">
                  <div
                    className="h-full rounded-full shadow-sm"
                    style={{ 
                      width: `${(group.hours / Math.max(...timeByGroup.map(g => g.hours), 1)) * 100}%`,
                      background: 'linear-gradient(45deg, #fbbf24, #f97316)',
                      boxShadow: '0 2px 6px rgba(251, 191, 36, 0.3)'
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
          {timeByGroup.length === 0 && (
            <div className="text-center py-2 bg-slate-50 dark:bg-night-700 rounded-md">
              <p className="text-xs text-slate-500 dark:text-gray-400 italic">No time data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Completion Rate by Group */}
      <div>
        <h4 className="font-medium text-xs text-slate-700 dark:text-gray-300 mb-2">Completion Rate (%)</h4>
        <div className="space-y-2">
          {completionRateByGroup.map(group => (
            <div key={group.name} className="flex items-center gap-2">
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-medium text-slate-600 dark:text-gray-400">{group.name}</span>
                  <span className="text-xs font-medium text-slate-700 dark:text-gray-300">{group.rate}%</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-night-600 rounded-full shadow-inner">
                  <div
                    className="h-full rounded-full shadow-sm"
                    style={{ 
                      width: `${group.rate}%`,
                      background: 'linear-gradient(45deg, #22c55e, #84cc16)',
                      boxShadow: '0 2px 6px rgba(34, 197, 94, 0.3)'
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
          {completionRateByGroup.length === 0 && (
            <div className="text-center py-2 bg-slate-50 dark:bg-night-700 rounded-md">
              <p className="text-xs text-slate-500 dark:text-gray-400 italic">No completion rate data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupAnalytics;