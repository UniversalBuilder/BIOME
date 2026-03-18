/**
 * analyticsExportService.js
 * 
 * Centralized service for preparing analytics data for export (PDF and Excel).
 * Extracts all calculations from Analytics component to enable reusable data preparation.
 */

const chartColors = {
  pandoraColors: [
    '#1F77B4', '#FF7F0E', '#2CA02C', '#D62728', '#9467BD',
    '#8C564B', '#E377C2', '#7F7F7F', '#BCBD22', '#17BECF'
  ],
  pandoraBorders: [
    '#1F77B4', '#FF7F0E', '#2CA02C', '#D62728', '#9467BD',
    '#8C564B', '#E377C2', '#7F7F7F', '#BCBD22', '#17BECF'
  ],
  statusColors: {
    'Preparing': '#9CA3AF',    // Gray
    'Active': '#3B82F6',       // Blue
    'Review': '#F59E0B',       // Amber
    'Completed': '#10B981',    // Green
    'On Hold': '#EF4444',      // Red
    'Unknown': '#6B7280'       // Gray
  },
  statusBorders: {
    'Preparing': '#6B7280',
    'Active': '#1E40AF',
    'Review': '#B45309',
    'Completed': '#047857',
    'On Hold': '#991B1B',
    'Unknown': '#374151'
  },
  gridColor: '#E5E7EB',
  textColor: '#374151'
};

/**
 * Build a month-keyed bucket object spanning from start to end date (inclusive).
 * Keys are formatted as "YYYY-MM".
 */
const buildMonthRange = (start, end) => {
  const buckets = {};
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cursor <= last) {
    const key = `${cursor.getFullYear()}-${(cursor.getMonth() + 1).toString().padStart(2, '0')}`;
    buckets[key] = 0;
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return buckets;
};

/**
 * Determine the time-series date range from explicit filter dates or data bounds.
 */
const getTsRange = (filteredProjects, startDate, endDate) => {
  if (startDate && endDate) {
    return { rangeStart: new Date(startDate), rangeEnd: new Date(endDate) };
  }
  let minDate = null, maxDate = null;
  filteredProjects.forEach(p => {
    const d = p.creation_date ? new Date(p.creation_date) : null;
    if (d) {
      if (!minDate || d < minDate) minDate = d;
      if (!maxDate || d > maxDate) maxDate = d;
    }
  });
  const fallbackStart = new Date(); fallbackStart.setMonth(fallbackStart.getMonth() - 11);
  return { rangeStart: minDate || fallbackStart, rangeEnd: maxDate || new Date() };
};

/**
 * Parse multi-selection fields that can be comma-separated strings or JSON arrays
 */
export const parseMultiSelectionField = (fieldValue, predefinedOptions = []) => {
  if (!fieldValue) return [];
  
  let selections;
  if (typeof fieldValue === 'string') {
    // Handle comma-separated strings or JSON arrays
    if (fieldValue.trim().startsWith('[')) {
      try {
        selections = JSON.parse(fieldValue);
      } catch {
        selections = fieldValue.split(',').map(s => s.trim()).filter(s => s);
      }
    } else {
      selections = fieldValue.split(',').map(s => s.trim()).filter(s => s);
    }
  } else if (Array.isArray(fieldValue)) {
    selections = fieldValue;
  } else {
    return [];
  }

  // Ensure all selections match predefined options
  if (predefinedOptions.length > 0) {
    const optionValues = predefinedOptions.map(o => o?.value || o);
    return selections.filter(sel => optionValues.includes(sel));
  }
  
  return selections;
};

/**
 * Prepare summary metrics from filtered projects
 */
export const prepareSummaryMetrics = (filteredProjects) => {
  const totalProjects = filteredProjects.length;
  const activeProjects = filteredProjects.filter(p =>
    p.status === 'Active' || p.status === 'In Progress' || p.status === 'In-Progress'
  ).length;
  
  const averageTimeHours = totalProjects > 0 
    ? Math.round((filteredProjects.reduce((sum, p) => sum + (p.time_spent_minutes || 0), 0) / totalProjects / 60) * 10) / 10
    : 0;
    
  const completedProjects = filteredProjects.filter(p =>
    p.status === 'Completed' || p.status === 'Finished'
  ).length;
  const completionRate = totalProjects > 0 
    ? Math.round((completedProjects / totalProjects) * 100)
    : 0;

  // Calculate project duration statistics
  const projectDurations = [];
  filteredProjects.forEach(project => {
    if (project.creation_date) {
      const creationDate = new Date(project.creation_date);
      const endDate = project.last_updated ? new Date(project.last_updated) : new Date();
      
      if (endDate > creationDate) {
        const durationDays = Math.round((endDate - creationDate) / (1000 * 60 * 60 * 24));
        projectDurations.push(durationDays);
      }
    }
  });

  const averageProjectDuration = projectDurations.length > 0 
    ? Math.round(projectDurations.reduce((sum, days) => sum + days, 0) / projectDurations.length)
    : 0;

  return {
    totalProjects,
    activeProjects,
    completedProjects,
    completionRate,
    averageTimeHours,
    averageProjectDuration
  };
};

/**
 * Prepare data for Status Distribution chart
 */
export const prepareStatusDistribution = (filteredProjects) => {
  const statusCounts = {};
  
  filteredProjects.forEach(project => {
    let status = project.status || 'Unknown';
    const statusMap = {
      'Intake': 'Preparing',
      'In Progress': 'Active',
      'In-Progress': 'Active',
      'Waiting': 'Review',
      'Pending': 'Preparing',
      'Planning': 'Preparing',
      'Finished': 'Completed'
    };
    status = statusMap[status] || status;
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  return statusCounts;
};

/**
 * Prepare data for Output Type Distribution chart
 */
export const prepareOutputTypeDistribution = (filteredProjects) => {
  const outputTypeCounts = {};
  
  filteredProjects.forEach(project => {
    const type = project.output_type || 'Unspecified';
    outputTypeCounts[type] = (outputTypeCounts[type] || 0) + 1;
  });

  return outputTypeCounts;
};

/**
 * Prepare data for Software Distribution chart
 */
export const prepareSoftwareDistribution = (filteredProjects, topN = 8) => {
  const softwareCounts = {};
  
  filteredProjects.forEach(project => {
    let softwareList = ['Not specified'];
    const swRaw = project.software;
    
    if (swRaw && String(swRaw).trim() !== '' && String(swRaw).trim() !== '[]') {
      try {
        const arr = Array.isArray(swRaw) ? swRaw : JSON.parse(swRaw);
        if (arr.length > 0) softwareList = arr;
      } catch {
        softwareList = [swRaw];
      }
    }
    
    softwareList.forEach(software => {
      softwareCounts[software] = (softwareCounts[software] || 0) + 1;
    });
  });

  const sortedSoftware = Object.entries(softwareCounts)
    .sort((a, b) => b[1] - a[1]);
  
  return {
    all: softwareCounts,
    sorted: sortedSoftware,
    topWithOthers: topN
  };
};

/**
 * Prepare data for Project Creation Timeline chart
 */
export const prepareCreationTimeline = (filteredProjects, startDate, endDate) => {
  const { rangeStart, rangeEnd } = getTsRange(filteredProjects, startDate, endDate);
  const projectsByMonth = buildMonthRange(rangeStart, rangeEnd);

  filteredProjects.forEach(project => {
    const creationDate = project.creation_date ? new Date(project.creation_date) : null;
    if (creationDate) {
      const monthKey = `${creationDate.getFullYear()}-${(creationDate.getMonth() + 1).toString().padStart(2, '0')}`;
      if (projectsByMonth[monthKey] !== undefined) {
        projectsByMonth[monthKey]++;
      }
    }
  });

  const sortedMonths = Object.keys(projectsByMonth).sort();
  return {
    byMonth: projectsByMonth,
    sortedMonths: sortedMonths
  };
};

/**
 * Prepare data for Time Spent Distribution chart
 */
export const prepareTimeSpentDistribution = (filteredProjects) => {
  const timeSpentRanges = {
    '0-5h': 0,
    '5-10h': 0,
    '10-20h': 0,
    '20-30h': 0,
    '30-40h': 0,
    '40+h': 0
  };
  
  filteredProjects.forEach(project => {
    const hours = project.time_spent_minutes ? project.time_spent_minutes / 60 : 0;
    if (hours <= 5) timeSpentRanges['0-5h']++;
    else if (hours <= 10) timeSpentRanges['5-10h']++;
    else if (hours <= 20) timeSpentRanges['10-20h']++;
    else if (hours <= 30) timeSpentRanges['20-30h']++;
    else if (hours <= 40) timeSpentRanges['30-40h']++;
    else timeSpentRanges['40+h']++;
  });

  return timeSpentRanges;
};

/**
 * Prepare data for Duration Distribution chart
 */
export const prepareDurationDistribution = (filteredProjects) => {
  const durationRanges = {
    '0-7d': 0,
    '8-14d': 0,
    '15-30d': 0,
    '31-90d': 0,
    '91-180d': 0,
    '180+d': 0
  };
  
  const projectDurations = [];
  
  filteredProjects.forEach(project => {
    if (project.creation_date) {
      const creationDate = new Date(project.creation_date);
      const endDate = project.last_updated ? new Date(project.last_updated) : new Date();
      
      if (endDate > creationDate) {
        const durationDays = Math.round((endDate - creationDate) / (1000 * 60 * 60 * 24));
        projectDurations.push(durationDays);
        
        if (durationDays <= 7) durationRanges['0-7d']++;
        else if (durationDays <= 14) durationRanges['8-14d']++;
        else if (durationDays <= 30) durationRanges['15-30d']++;
        else if (durationDays <= 90) durationRanges['31-90d']++;
        else if (durationDays <= 180) durationRanges['91-180d']++;
        else durationRanges['180+d']++;
      }
    }
  });

  return durationRanges;
};

/**
 * Prepare data for Group Performance Analysis
 */
export const prepareGroupPerformance = (filteredProjects) => {
  const groupMetrics = {};
  
  filteredProjects.forEach(project => {
    const groupName = project.group_name || 'Unassigned';
    
    if (!groupMetrics[groupName]) {
      groupMetrics[groupName] = {
        totalProjects: 0,
        completedProjects: 0,
        totalDuration: 0,
        projectCount: 0,
        completionRate: 0,
        averageDuration: 0
      };
    }
    
    groupMetrics[groupName].totalProjects++;
    if (project.status === 'Completed' || project.status === 'Finished') {
      groupMetrics[groupName].completedProjects++;
    }
    
    if (project.creation_date && project.last_updated) {
      const creationDate = new Date(project.creation_date);
      const completionDate = new Date(project.last_updated);
      const durationDays = (completionDate - creationDate) / (1000 * 60 * 60 * 24);
      groupMetrics[groupName].totalDuration += durationDays;
      groupMetrics[groupName].projectCount++;
    }
  });
  
  // Calculate averages
  Object.keys(groupMetrics).forEach(group => {
    const metrics = groupMetrics[group];
    metrics.completionRate = metrics.totalProjects > 0 
      ? Math.round((metrics.completedProjects / metrics.totalProjects) * 100)
      : 0;
    metrics.averageDuration = metrics.projectCount > 0
      ? Math.round(metrics.totalDuration / metrics.projectCount)
      : 0;
  });

  return groupMetrics;
};

/**
 * Prepare data for Software Analysis (with versions and usage)
 */
export const prepareSoftwareAnalysis = (filteredProjects) => {
  const softwareAnalysis = {};
  
  filteredProjects.forEach(project => {
    let softwareList = [];
    const swRaw = project.software;
    
    if (swRaw && String(swRaw).trim() !== '' && String(swRaw).trim() !== '[]') {
      try {
        const arr = Array.isArray(swRaw) ? swRaw : JSON.parse(swRaw);
        if (arr.length > 0) softwareList = arr;
      } catch {
        softwareList = [swRaw];
      }
    }
    
    softwareList.forEach(software => {
      if (!softwareAnalysis[software]) {
        softwareAnalysis[software] = {
          name: software,
          count: 0,
          totalTime: 0,
          projectCount: 0
        };
      }
      softwareAnalysis[software].count++;
      softwareAnalysis[software].totalTime += project.time_spent_minutes || 0;
      softwareAnalysis[software].projectCount++;
    });
  });
  
  // Calculate averages
  Object.keys(softwareAnalysis).forEach(software => {
    const analysis = softwareAnalysis[software];
    analysis.averageTime = analysis.projectCount > 0
      ? Math.round(analysis.totalTime / analysis.projectCount / 60 * 10) / 10
      : 0;
  });

  return softwareAnalysis;
};

/**
 * Prepare data for Monthly Time Tracking chart
 */
export const prepareMonthlyTimeTracking = (filteredProjects, startDate, endDate) => {
  const { rangeStart, rangeEnd } = getTsRange(filteredProjects, startDate, endDate);
  const monthlyHours = buildMonthRange(rangeStart, rangeEnd);

  // Sum up hours per month (using creation date as proxy)
  filteredProjects.forEach(project => {
    if (project.creation_date) {
      const creationDate = new Date(project.creation_date);
      const monthKey = `${creationDate.getFullYear()}-${(creationDate.getMonth() + 1).toString().padStart(2, '0')}`;
      if (monthlyHours[monthKey] !== undefined) {
        monthlyHours[monthKey] += (project.time_spent_minutes || 0) / 60;
      }
    }
  });
  
  const sortedMonths = Object.keys(monthlyHours).sort();
  const cumulativeHours = [];
  let cumulative = 0;
  
  sortedMonths.forEach(month => {
    cumulative += monthlyHours[month];
    cumulativeHours.push(cumulative);
  });

  return {
    byMonth: monthlyHours,
    sortedMonths: sortedMonths,
    cumulative: cumulativeHours
  };
};

/**
 * Prepare data for Analysis Goals Distribution
 */
export const prepareAnalysisGoalsDistribution = (filteredProjects, metadataOptions = []) => {
  const goalsCount = {};
  
  filteredProjects.forEach(project => {
    const goals = parseMultiSelectionField(
      project.analysis_goal,
      metadataOptions
    );
    
    goals.forEach(goal => {
      goalsCount[goal] = (goalsCount[goal] || 0) + 1;
    });
  });

  return goalsCount;
};

/**
 * Prepare data for Project Velocity chart
 */
export const prepareProjectVelocity = (filteredProjects, startDate, endDate) => {
  const { rangeStart, rangeEnd } = getTsRange(filteredProjects, startDate, endDate);
  const completedByMonth = buildMonthRange(rangeStart, rangeEnd);

  // Count completed projects per month
  filteredProjects.forEach(project => {
    if (project.status === 'Completed' || project.status === 'Finished') {
      const dateStr = project.last_updated;
      if (dateStr) {
        const completionDate = new Date(dateStr);
        const monthKey = `${completionDate.getFullYear()}-${(completionDate.getMonth() + 1).toString().padStart(2, '0')}`;
        if (completedByMonth[monthKey] !== undefined) {
          completedByMonth[monthKey]++;
        }
      }
    }
  });
  
  const sortedMonths = Object.keys(completedByMonth).sort();
  
  return {
    byMonth: completedByMonth,
    sortedMonths: sortedMonths
  };
};

/**
 * Prepare detailed project data for Excel export
 */
export const prepareProjectDetails = (filteredProjects, timezone = 'UTC', formatDateOnly = (date) => new Date(date).toLocaleDateString()) => {
  return filteredProjects.map(project => {
    const creationDate = project.creation_date ? new Date(project.creation_date) : null;
    const lastUpdateDate = project.last_updated ? new Date(project.last_updated) : null;
    const completionDate = project.last_updated ? new Date(project.last_updated) : null;

    const duration = (creationDate && completionDate) ?
      Math.round((completionDate - creationDate) / (1000 * 60 * 60 * 24)) :
      '';
    
    const software = (() => {
      try {
        const arr = JSON.parse(project.software || '[]');
        return arr.length ? arr.join(', ') : 'Not specified';
      } catch {
        return project.software || 'Not specified';
      }
    })();
    
    return {
      name: project.name || 'Unnamed',
      status: project.status || 'Unknown',
      software: software,
      created: creationDate ? formatDateOnly(creationDate.toISOString()) : '',
      lastUpdated: lastUpdateDate ? formatDateOnly(lastUpdateDate.toISOString()) : '',
      completed: completionDate ? formatDateOnly(completionDate.toISOString()) : '',
      timeSpentHours: project.time_spent_minutes ? Math.round(project.time_spent_minutes / 60 * 100) / 100 : 0,
      durationDays: duration,
      group: project.group_name || 'Unassigned',
      outputType: project.output_type || 'Unknown',
      user: project.user_name || 'Unknown'
    };
  });
};

/**
 * Aggregate all analytics data for export
 */
export const prepareAllAnalyticsData = (filteredProjects, metadataOptions = {}, dateRange = {}, formatDateOnly = null) => {
  return {
    summaryMetrics: prepareSummaryMetrics(filteredProjects),
    statusDistribution: prepareStatusDistribution(filteredProjects),
    outputTypeDistribution: prepareOutputTypeDistribution(filteredProjects),
    softwareDistribution: prepareSoftwareDistribution(filteredProjects),
    creationTimeline: prepareCreationTimeline(filteredProjects, dateRange.startDate, dateRange.endDate),
    timeSpentDistribution: prepareTimeSpentDistribution(filteredProjects),
    durationDistribution: prepareDurationDistribution(filteredProjects),
    groupPerformance: prepareGroupPerformance(filteredProjects),
    softwareAnalysis: prepareSoftwareAnalysis(filteredProjects),
    monthlyTimeTracking: prepareMonthlyTimeTracking(filteredProjects, dateRange.startDate, dateRange.endDate),
    analysisGoalsDistribution: prepareAnalysisGoalsDistribution(
      filteredProjects,
      metadataOptions.analysisGoals || []
    ),
    projectVelocity: prepareProjectVelocity(filteredProjects, dateRange.startDate, dateRange.endDate),
    projectDetails: prepareProjectDetails(filteredProjects, dateRange.timezone, formatDateOnly),
    dateRange: dateRange,
    generatedAt: new Date().toISOString()
  };
};

export default {
  parseMultiSelectionField,
  prepareSummaryMetrics,
  prepareStatusDistribution,
  prepareOutputTypeDistribution,
  prepareSoftwareDistribution,
  prepareCreationTimeline,
  prepareTimeSpentDistribution,
  prepareDurationDistribution,
  prepareGroupPerformance,
  prepareSoftwareAnalysis,
  prepareMonthlyTimeTracking,
  prepareAnalysisGoalsDistribution,
  prepareProjectVelocity,
  prepareProjectDetails,
  prepareAllAnalyticsData,
  chartColors
};
