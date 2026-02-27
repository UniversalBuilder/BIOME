import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend,
  Title,
  Filler
} from 'chart.js';
import { Bar, Pie, Line, Scatter } from 'react-chartjs-2';
import { Tooltip } from './Tooltip';
import { ThemeContext } from '../contexts/ThemeContext';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  ChartTooltip,
  Legend,
  Title,
  Filler
);

const Analytics = ({ projects = [], analytics = {} }) => {
  const { isDarkMode } = useContext(ThemeContext);
  
  // Get min creation date and max last update date from projects
  const getDefaultDateRange = () => {
    let minCreationDate = null;
    let maxUpdateDate = null;
    
    projects.forEach(project => {
      const creationDate = project.creation_date ? new Date(project.creation_date) : null;
      const lastUpdateDate = project.last_update_date ? new Date(project.last_update_date) : null;
      
      if (creationDate && (!minCreationDate || creationDate < minCreationDate)) {
        minCreationDate = creationDate;
      }
      
      if (lastUpdateDate && (!maxUpdateDate || lastUpdateDate > maxUpdateDate)) {
        maxUpdateDate = lastUpdateDate;
      }
    });
    
    return {
      startDate: minCreationDate ? minCreationDate.toISOString().split('T')[0] : '',
      endDate: maxUpdateDate ? maxUpdateDate.toISOString().split('T')[0] : ''
    };
  };
  
  // Date filtering state with default values
  const defaultDateRange = getDefaultDateRange();
  const [startDate, setStartDate] = useState(defaultDateRange.startDate);
  const [endDate, setEndDate] = useState(defaultDateRange.endDate);
  const [filteredProjects, setFilteredProjects] = useState(projects);
  const [isFiltered, setIsFiltered] = useState(false);
  
  // Filter projects by date range - wrapped in useCallback
  const applyDateFilter = useCallback(() => {
    if (!startDate && !endDate) {
      setFilteredProjects(projects);
      setIsFiltered(false);
      return;
    }
    
    const start = startDate ? new Date(startDate) : new Date(0); // Jan 1, 1970
    const end = endDate ? new Date(endDate) : new Date(); // Current date
    
    // Set end date to the end of the day
    end.setHours(23, 59, 59, 999);
    
    const filtered = projects.filter(project => {
      const creationDate = project.creation_date ? new Date(project.creation_date) : null;
      if (!creationDate) return false;
      
      // Check if the project was created on or after the start date
      if (creationDate < start) return false;
      
      // Check if the project's last update was on or before the end date
      // If no last_update_date, fall back to completion_date or creation_date
      const lastUpdateDate = project.last_update_date 
        ? new Date(project.last_update_date) 
        : (project.completion_date 
            ? new Date(project.completion_date) 
            : creationDate);
      
      return lastUpdateDate <= end;
    });
    
    setFilteredProjects(filtered);
    setIsFiltered(true);
  }, [startDate, endDate, projects]);
  
  // Reset filters
  const resetFilters = () => {
    setStartDate('');
    setEndDate('');
    setFilteredProjects(projects);
    setIsFiltered(false);
  };
  
  // Export analytics to Excel format with file save dialog
  const exportToExcel = async () => {
    try {
      // Dynamically import xlsx library
      const XLSX = await import('xlsx');
      
      // Prepare workbook and worksheets
      const wb = XLSX.utils.book_new();
      
      // Create summary sheet
      const summaryData = [
        ['BIOME Analytics Report', ''],
        ['Generated on', new Date().toLocaleString()],
        ['Period', isFiltered ? `${startDate || 'All time'} to ${endDate || 'Present'}` : 'All time'],
        ['', ''],
        ['Key Metrics', ''],
        ['Total Projects', filteredProjects.length],
        ['Active Projects', filteredProjects.filter(p => p.status !== 'Finished' && p.status !== 'On Hold').length],
        ['Average Time per Project (hours)', averageTimeHours],
        ['Completion Rate', `${completionRate}%`],
        ['Average Project Duration (days)', averageProjectDuration],
      ];
      
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
      
      // Create projects sheet
      const projectHeaders = ['Project Name', 'Status', 'Software', 'Created', 'Last Updated', 'Completed', 'Time Spent (h)', 'Duration (days)'];
      const projectsData = [projectHeaders];
      
      filteredProjects.forEach(project => {
        const creationDate = project.creation_date ? new Date(project.creation_date) : null;
        const lastUpdateDate = project.last_update_date ? new Date(project.last_update_date) : null;
        const completionDate = project.completion_date ? new Date(project.completion_date) : null;
        const duration = (creationDate && completionDate) ? 
          Math.round((completionDate - creationDate) / (1000 * 60 * 60 * 24)) : 
          '';
          
        projectsData.push([
//          project.name || 'Unnamed',
          project.name,
          project.status || 'Unknown',
          project.software || 'Not specified',
          creationDate ? creationDate.toLocaleDateString() : '',
          lastUpdateDate ? lastUpdateDate.toLocaleDateString() : '',
          completionDate ? completionDate.toLocaleDateString() : '',
          project.time_spent_minutes ? Math.round(project.time_spent_minutes / 60 * 100) / 100 : 0,
          duration
        ]);
      });
      
      const projectsWs = XLSX.utils.aoa_to_sheet(projectsData);
      XLSX.utils.book_append_sheet(wb, projectsWs, 'Projects');
      
      // Generate distribution data sheets
      const distributionSheets = [
        {
          name: 'Status Distribution',
          data: [
            ['Status', 'Count'],
            ...Object.entries(statusCounts).map(([status, count]) => [status, count])
          ]
        },
        {
          name: 'Output Type Distribution',
          data: [
            ['Output/Result Type', 'Count'],
            ...Object.entries(outputTypeCounts).map(([type, count]) => [type, count])
          ]
        },
        {
          name: 'Software Distribution',
          data: [
            ['Software', 'Count'],
            ...sortedSoftware.map(([software, count]) => [software, count])
          ]
        },
        {
          name: 'Time Distribution',
          data: [
            ['Time Range', 'Count'],
            ...Object.entries(timeSpentRanges).map(([range, count]) => [range, count])
          ]
        },
        {
          name: 'Duration Distribution',
          data: [
            ['Duration Range', 'Count'],
            ...Object.entries(durationRanges).map(([range, count]) => [range, count])
          ]
        }
      ];
      
      distributionSheets.forEach(sheet => {
        const ws = XLSX.utils.aoa_to_sheet(sheet.data);
        XLSX.utils.book_append_sheet(wb, ws, sheet.name);
      });
      
      // Convert workbook to binary string
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      
      try {
        // For Tauri apps - use the native save dialog
        // First check if we're running in a Tauri environment
        if (window.__TAURI__) {
          const { save } = await import('@tauri-apps/plugin-dialog');
          const { writeBinaryFile } = await import('@tauri-apps/plugin-fs');
          
          // Open save dialog
          const filePath = await save({
            filters: [{
              name: 'Excel Spreadsheet',
              extensions: ['xlsx']
            }],
            defaultPath: `BIOME_Analytics_Report_${new Date().toISOString().slice(0, 10)}.xlsx`
          });
          
          if (filePath) {
            // Write the file to the selected location
            await writeBinaryFile(filePath, excelBuffer);
          }
        } else {
          // For web - use the saveAs function
          const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `BIOME_Analytics_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      } catch (error) {
        console.error('Error saving file:', error);
        // Fallback to standard download
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `BIOME_Analytics_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      try { window.toast?.('Failed to export data. Please try again.', { type: 'error' }); } catch {}
    }
  };

  // Update filtered projects when projects prop changes
  React.useEffect(() => {
    if (!isFiltered) {
      setFilteredProjects(projects);
    } else {
      // Reapply filters when projects data changes
      applyDateFilter();
    }
  }, [projects, isFiltered, applyDateFilter]);
  
  // Define theme colors for Pandora-inspired theme (blue-cyan bioluminescent forest)
  const chartColors = {
    textColor: isDarkMode ? 'rgba(225, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
    gridColor: isDarkMode ? 'rgba(42, 54, 85, 0.6)' : 'rgba(0, 0, 0, 0.1)',
    backgroundColor: isDarkMode ? 'rgba(20, 27, 50, 0.8)' : 'rgba(255, 255, 255, 0.8)',
    // Pandora-inspired color palette
    pandoraColors: [
      'rgba(56, 209, 237, 0.75)',  // cyan blue
      'rgba(14, 145, 218, 0.75)',  // medium blue
      'rgba(143, 224, 201, 0.75)', // teal
      'rgba(0, 214, 186, 0.75)',   // turquoise
      'rgba(92, 119, 222, 0.75)',  // periwinkle blue
      'rgba(27, 89, 248, 0.75)',   // deep blue
      'rgba(116, 178, 252, 0.75)', // sky blue
      'rgba(31, 196, 165, 0.75)',  // seafoam
      'rgba(55, 166, 114, 0.75)',  // blue green
    ],
    pandoraBorders: [
      'rgba(56, 209, 237, 1)',
      'rgba(14, 145, 218, 1)',
      'rgba(143, 224, 201, 1)',
      'rgba(0, 214, 186, 1)',
      'rgba(92, 119, 222, 1)',
      'rgba(27, 89, 248, 1)',
      'rgba(116, 178, 252, 1)',
      'rgba(31, 196, 165, 1)',
      'rgba(55, 166, 114, 1)',
    ],
    // Status colors - Natural tones for light mode, bioluminescent for dark mode
    statusColors: {
      'Preparing': isDarkMode ? 'rgba(179, 102, 255, 0.9)' : 'rgba(139, 122, 216, 0.9)',     // Rich amethyst vs electric purple
      'Active': isDarkMode ? 'rgba(0, 191, 255, 0.9)' : 'rgba(74, 158, 199, 0.9)',            // Ocean teal vs electric cyan
      'Completed': isDarkMode ? 'rgba(57, 255, 20, 0.9)' : 'rgba(82, 183, 136, 0.9)',         // Forest jade vs electric green
      'On Hold': isDarkMode ? 'rgba(255, 149, 0, 0.9)' : 'rgba(231, 111, 81, 0.9)',           // Terra cotta vs bright orange
      'Review': isDarkMode ? 'rgba(255, 255, 0, 0.9)' : 'rgba(244, 162, 97, 0.9)',            // Sunset amber vs electric yellow
      'Cancelled': isDarkMode ? 'rgba(255, 0, 0, 0.9)' : 'rgba(200, 16, 46, 0.9)',            // Deep crimson vs pure red
      'Intake': isDarkMode ? 'rgba(179, 102, 255, 0.9)' : 'rgba(139, 122, 216, 0.9)',        // Legacy mapping to Preparing
      'In Progress': isDarkMode ? 'rgba(0, 191, 255, 0.9)' : 'rgba(74, 158, 199, 0.9)',       // Legacy mapping to Active
      'In-Progress': isDarkMode ? 'rgba(0, 191, 255, 0.9)' : 'rgba(74, 158, 199, 0.9)',       // Legacy mapping to Active (alternate spelling)
      'Finished': isDarkMode ? 'rgba(57, 255, 20, 0.9)' : 'rgba(82, 183, 136, 0.9)',          // Same as Completed
      'Waiting': isDarkMode ? 'rgba(255, 255, 0, 0.9)' : 'rgba(244, 162, 97, 0.9)',           // Sunset amber vs electric yellow
      'Pending': isDarkMode ? 'rgba(179, 102, 255, 0.9)' : 'rgba(139, 122, 216, 0.9)',       // Rich amethyst vs electric purple
      'Planning': isDarkMode ? 'rgba(0, 191, 255, 0.9)' : 'rgba(74, 158, 199, 0.9)',          // Ocean teal vs electric cyan
      'Archived': isDarkMode ? 'rgba(102, 107, 133, 0.85)' : 'rgba(107, 114, 128, 0.85)',    // Neutral gray
      'Unknown': 'rgba(107, 114, 128, 0.75)',     // neutral gray
    },
    statusBorders: {
      'Preparing': isDarkMode ? 'rgba(179, 102, 255, 1)' : 'rgba(107, 99, 199, 1)',         // Rich amethyst vs electric purple
      'Active': isDarkMode ? 'rgba(0, 191, 255, 1)' : 'rgba(46, 123, 166, 1)',                // Ocean teal vs electric cyan
      'Completed': isDarkMode ? 'rgba(57, 255, 20, 1)' : 'rgba(45, 106, 79, 1)',             // Forest jade vs electric green
      'On Hold': isDarkMode ? 'rgba(255, 149, 0, 1)' : 'rgba(212, 74, 46, 1)',               // Terra cotta vs bright orange
      'Review': isDarkMode ? 'rgba(255, 255, 0, 1)' : 'rgba(231, 111, 81, 1)',                // Sunset amber vs electric yellow
      'Cancelled': isDarkMode ? 'rgba(255, 0, 0, 1)' : 'rgba(160, 16, 32, 1)',                 // Deep crimson vs pure red
      'Intake': isDarkMode ? 'rgba(179, 102, 255, 1)' : 'rgba(107, 99, 199, 1)',            // Legacy mapping to Preparing
      'In Progress': isDarkMode ? 'rgba(0, 191, 255, 1)' : 'rgba(46, 123, 166, 1)',           // Legacy mapping to Active
      'In-Progress': isDarkMode ? 'rgba(0, 191, 255, 1)' : 'rgba(46, 123, 166, 1)',           // Legacy mapping to Active (alternate spelling)
      'Finished': isDarkMode ? 'rgba(57, 255, 20, 1)' : 'rgba(45, 106, 79, 1)',              // Same as Completed
      'Waiting': isDarkMode ? 'rgba(255, 255, 0, 1)' : 'rgba(231, 111, 81, 1)',               // Sunset amber vs electric yellow
      'Pending': isDarkMode ? 'rgba(179, 102, 255, 1)' : 'rgba(107, 99, 199, 1)',           // Rich amethyst vs electric purple
      'Planning': isDarkMode ? 'rgba(0, 191, 255, 1)' : 'rgba(46, 123, 166, 1)',              // Ocean teal vs electric cyan
      'Archived': isDarkMode ? 'rgba(102, 107, 133, 1)' : 'rgba(75, 85, 99, 1)',                // Neutral gray
      'Unknown': 'rgba(107, 114, 128, 1)',
    },
    // BIOME logo gradient for special highlights
    biomeGradient: {
      from: '#00F7FF', // cyan
      middle: '#9B6BF3', // purple
      to: '#4DB4FF', // sky blue
    }
  };
  
  // Common chart options
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: chartColors.textColor
        }
      },
      tooltip: {
        backgroundColor: chartColors.backgroundColor,
        titleColor: chartColors.textColor,
        bodyColor: chartColors.textColor,
        borderColor: chartColors.gridColor,
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: {
          color: chartColors.gridColor
        },
        ticks: {
          color: chartColors.textColor
        }
      },
      y: {
        grid: {
          color: chartColors.gridColor
        },
        ticks: {
          color: chartColors.textColor
        }
      }
    }
  };

  // Calculate number of projects by status
  const statusCounts = {};
  // Use filtered projects instead of all projects and map status names
  filteredProjects.forEach(project => {
    let status = project.status || 'Unknown';
    // Map legacy status names to new ones for display
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

  // Prepare data for status distribution chart
  const statusData = {
    labels: Object.keys(statusCounts),
    datasets: [
      {
        label: 'Projects by Status',
        data: Object.values(statusCounts),
        backgroundColor: Object.keys(statusCounts).map(status => 
          chartColors.statusColors[status] || chartColors.statusColors['Unknown']
        ),
        borderColor: Object.keys(statusCounts).map(status => 
          chartColors.statusBorders[status] || chartColors.statusBorders['Unknown']
        ),
        borderWidth: 1,
      },
    ],
  };

  // Calculate number of projects by software
  const softwareCounts = {};
  // Use filtered projects instead of all projects
  filteredProjects.forEach(project => {
    const software = project.software || 'Not specified';
    softwareCounts[software] = (softwareCounts[software] || 0) + 1;
  });

  // Sort by project count and get top 8 plus "Others"
  const sortedSoftware = Object.entries(softwareCounts)
    .sort((a, b) => b[1] - a[1]);
  
  const topSoftware = sortedSoftware.slice(0, 8);
  const otherSoftware = sortedSoftware.slice(8).reduce(
    (acc, [, count]) => acc + count,
    0
  );

  // Prepare data for software distribution chart
  const softwareLabels = topSoftware.map(([name]) => name);
  const softwareData = topSoftware.map(([, count]) => count);
  
  if (otherSoftware > 0) {
    softwareLabels.push('Others');
    softwareData.push(otherSoftware);
  }

  const softwareChartData = {
    labels: softwareLabels,
    datasets: [
      {
        label: 'Projects by Software',
        data: softwareData,
        backgroundColor: chartColors.pandoraColors,
        borderColor: chartColors.pandoraBorders,
        borderWidth: 1,
      },
    ],
  };

  // Output/Result Type Distribution
  const outputTypeCounts = {};
  filteredProjects.forEach(project => {
    const type = project.output_type || 'Unspecified';
    outputTypeCounts[type] = (outputTypeCounts[type] || 0) + 1;
  });

  const outputTypeData = {
    labels: Object.keys(outputTypeCounts),
    datasets: [
      {
        label: 'Projects by Output/Result Type',
        data: Object.values(outputTypeCounts),
        backgroundColor: Object.keys(outputTypeCounts).map((_, i) => 
          chartColors.pandoraColors[i % chartColors.pandoraColors.length]
        ),
        borderColor: Object.keys(outputTypeCounts).map((_, i) => 
          chartColors.pandoraBorders[i % chartColors.pandoraBorders.length]
        ),
        borderWidth: 1,
      },
    ],
  };

  // Calculate project creation over time
  const projectsByMonth = {};
  const now = new Date();
  const monthsAgo12 = new Date();
  monthsAgo12.setMonth(now.getMonth() - 12);
  
  // Initialize all months with zeros
  for (let i = 0; i < 12; i++) {
    const date = new Date(now);
    date.setMonth(now.getMonth() - i);
    const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    projectsByMonth[monthKey] = 0;
  }
  
  // Count projects per month - use filtered projects
  filteredProjects.forEach(project => {
    const creationDate = project.creation_date ? new Date(project.creation_date) : null;
    if (creationDate && creationDate > monthsAgo12) {
      const monthKey = `${creationDate.getFullYear()}-${(creationDate.getMonth() + 1).toString().padStart(2, '0')}`;
      if (projectsByMonth[monthKey] !== undefined) {
        projectsByMonth[monthKey]++;
      }
    }
  });
  
  // Sort by date 
  const sortedMonths = Object.keys(projectsByMonth).sort();
  
  const formatMonthLabel = (monthKey) => {
    const [year, month] = monthKey.split('-');
    return `${month}/${year.substring(2)}`;
  };
  
  const timeSeriesData = {
    labels: sortedMonths.map(formatMonthLabel),
    datasets: [
      {
        label: 'Projects Created',
        data: sortedMonths.map(month => projectsByMonth[month]),
        borderColor: chartColors.pandoraBorders[0],
        backgroundColor: chartColors.pandoraColors[0],
        fill: true,
        tension: 0.3,
      },
    ],
  };

  // Calculate time spent per month
  const timeSpentByMonth = {};
  
  // Initialize months for time tracking
  for (let i = 0; i < 12; i++) {
    const date = new Date(now);
    date.setMonth(now.getMonth() - i);
    const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    timeSpentByMonth[monthKey] = 0;
  }
  
  // Aggregate time spent in each month - use filtered projects
  filteredProjects.forEach(project => {
    if (project.time_spent_minutes && project.creation_date) {
      const creationDate = new Date(project.creation_date);
      if (creationDate > monthsAgo12) {
        const monthKey = `${creationDate.getFullYear()}-${(creationDate.getMonth() + 1).toString().padStart(2, '0')}`;
        if (timeSpentByMonth[monthKey] !== undefined) {
          timeSpentByMonth[monthKey] += project.time_spent_minutes / 60; // Convert to hours
        }
      }
    }
  });
  
  // Sort months chronologically for time tracking
  const sortedTimeMonths = Object.keys(timeSpentByMonth).sort();
  
  // Time tracking data for bar chart with cumulative line
  const timeTrackingData = {
    labels: sortedTimeMonths.map(formatMonthLabel),
    datasets: [
      {
        type: 'bar',
        label: 'Hours Spent',
        data: sortedTimeMonths.map(key => Math.round(timeSpentByMonth[key] * 10) / 10),
        backgroundColor: chartColors.pandoraColors[2],
        borderColor: chartColors.pandoraBorders[2],
        borderWidth: 1,
        order: 2
      },
      {
        type: 'line',
        label: 'Cumulative Hours',
        data: (() => {
          let cumulative = 0;
          return sortedTimeMonths.map(key => {
            cumulative += timeSpentByMonth[key];
            return Math.round(cumulative * 10) / 10;
          });
        })(),
        borderColor: chartColors.pandoraBorders[5],
        backgroundColor: 'transparent',
        borderWidth: 2,
        pointRadius: 4,
        tension: 0.4,
        yAxisID: 'y1',
        order: 1
      }
    ]
  };
  
  // Time tracking chart options with dual axes
  const timeTrackingOptions = {
    ...commonOptions,
    scales: {
      x: {
        ...commonOptions.scales.x,
      },
      y: {
        ...commonOptions.scales.y,
        title: {
          display: true,
          text: 'Monthly Hours'
        },
        beginAtZero: true
      },
      y1: {
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: 'Cumulative Hours'
        },
        ticks: {
          color: chartColors.textColor
        },
        beginAtZero: true
      }
    }
  };

  // Options for charts showing time spent data
  const timeSpentByCreationMonthOptions = {
    ...commonOptions,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Average Hours'
        },
        ticks: {
          color: chartColors.textColor
        },
        grid: {
          color: chartColors.gridColor
        }
      },
      x: {
        title: {
          display: true,
          text: 'Software Platform'
        },
        ticks: {
          color: chartColors.textColor
        },
        grid: {
          color: chartColors.gridColor
        }
      }
    }
  };

  // Group analytics will be implemented in future updates
  // const { 
  //   projectsByGroup = [], 
  //   timeByGroup = [],
  //   completionRateByGroup = [] 
  // } = analytics;

  // We'll use these data variables when implementing group charts in a future update
  // For now, we'll comment them out to avoid ESLint warnings
  /*
  // Prepare data for group distribution with alternating colors
  const groupBarData = {
    labels: projectsByGroup.map(g => g.name),
    datasets: [
      {
        label: 'Projects',
        data: projectsByGroup.map(g => g.count),
        backgroundColor: projectsByGroup.map((_, i) => 
          chartColors.pandoraColors[i % chartColors.pandoraColors.length]
        ),
        borderColor: projectsByGroup.map((_, i) => 
          chartColors.pandoraBorders[i % chartColors.pandoraBorders.length]
        ),
        borderWidth: 1,
      }
    ]
  };
  
  // Time by group chart data with alternating colors
  const timeByGroupData = {
    labels: timeByGroup.map(g => g.name),
    datasets: [
      {
        label: 'Hours',
        data: timeByGroup.map(g => g.hours),
        backgroundColor: timeByGroup.map((_, i) => 
          chartColors.pandoraColors[(i + 3) % chartColors.pandoraColors.length]
        ),
        borderColor: timeByGroup.map((_, i) => 
          chartColors.pandoraBorders[(i + 3) % chartColors.pandoraBorders.length]
        ),
        borderWidth: 1,
      }
    ]
  };
  
  // Completion rate by group chart data with alternating colors
  const completionRateData = {
    labels: completionRateByGroup.map(g => g.name),
    datasets: [
      {
        label: 'Completion Rate (%)',
        data: completionRateByGroup.map(g => g.rate),
        backgroundColor: completionRateByGroup.map((_, i) => 
          chartColors.pandoraColors[(i + 6) % chartColors.pandoraColors.length]
        ),
        borderColor: completionRateByGroup.map((_, i) => 
          chartColors.pandoraBorders[(i + 6) % chartColors.pandoraBorders.length]
        ),
        borderWidth: 1,
      }
    ]
  };
  */

  // Calculate key statistics - use filtered projects
  const totalProjects = filteredProjects.length;
  const activeProjects = filteredProjects.filter(p => 
    p.status !== 'Finished' && p.status !== 'On Hold'
  ).length;
  
  const averageTimeHours = filteredProjects.length > 0 
    ? Math.round((filteredProjects.reduce((sum, p) => sum + (p.time_spent_minutes || 0), 0) / filteredProjects.length / 60) * 10) / 10
    : 0;
    
  const completedProjects = filteredProjects.filter(p => p.status === 'Finished').length;
  const completionRate = totalProjects > 0 
    ? Math.round((completedProjects / totalProjects) * 100)
    : 0;

  // Calculate project duration statistics (days from creation to completion/current date) - use filtered projects
  const projectDurations = [];
  const durationRanges = {
    '0-7d': 0,   // 1 week
    '8-14d': 0,  // 2 weeks
    '15-30d': 0, // 1 month
    '31-90d': 0, // 3 months
    '91-180d': 0, // 6 months
    '180+d': 0   // over 6 months
  };
  
  filteredProjects.forEach(project => {
    if (project.creation_date) {
      const creationDate = new Date(project.creation_date);
      // Use completion date if available, otherwise use current date for ongoing projects
      const endDate = project.completion_date ? new Date(project.completion_date) : new Date();
      
      // Only count positive durations
      if (endDate > creationDate) {
        const durationDays = Math.round((endDate - creationDate) / (1000 * 60 * 60 * 24));
        projectDurations.push(durationDays);
        
        // Categorize into ranges
        if (durationDays <= 7) durationRanges['0-7d']++;
        else if (durationDays <= 14) durationRanges['8-14d']++;
        else if (durationDays <= 30) durationRanges['15-30d']++;
        else if (durationDays <= 90) durationRanges['31-90d']++;
        else if (durationDays <= 180) durationRanges['91-180d']++;
        else durationRanges['180+d']++;
      }
    }
  });
  
  // Calculate average duration
  const averageProjectDuration = projectDurations.length > 0 
    ? Math.round(projectDurations.reduce((sum, days) => sum + days, 0) / projectDurations.length)
    : 0;
  
  // Format project duration data
  const durationData = {
    labels: Object.keys(durationRanges),
    datasets: [
      {
        label: 'Project Count',
        data: Object.values(durationRanges),
        backgroundColor: Object.keys(durationRanges).map((_, i) => 
          chartColors.pandoraColors[(i + 1) % chartColors.pandoraColors.length]
        ),
        borderColor: Object.keys(durationRanges).map((_, i) => 
          chartColors.pandoraBorders[(i + 1) % chartColors.pandoraBorders.length]
        ),
        borderWidth: 1
      }
    ]
  };

  // Time spent distribution - use filtered projects
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
  
  const timeSpentData = {
    labels: Object.keys(timeSpentRanges),
    datasets: [
      {
        label: 'Project Count',
        data: Object.values(timeSpentRanges),
        backgroundColor: Object.keys(timeSpentRanges).map((_, i) => 
          chartColors.pandoraColors[i % chartColors.pandoraColors.length]
        ),
        borderColor: Object.keys(timeSpentRanges).map((_, i) => 
          chartColors.pandoraBorders[i % chartColors.pandoraBorders.length]
        ),
        borderWidth: 1,
      },
    ],
  };

  // Enhanced Analytics Data Processing

  // Define predefined categories
  const PREDEFINED_CATEGORIES = {
    sampleTypes: [
      'cells on slides',
      'tissue slices', 
      'cells in multiwell plates',
      'whole organ / animal',
      'other'
    ],
    imagingTechniques: [
      'widefield microscopy',
      'widefield fluorescence microscopy',
      'slide scanning',
      'confocal microscopy',
      'time lapse microscopy',
      'super resolution microscopy',
      'high content screening',
      'other'
    ],
    analysisGoals: [
      'object counting',
      'intensity measurement',
      '3D reconstruction',
      'object classification',
      'object morphometry',
      'other'
    ]
  };

  // Helper function to parse multi-selection fields (comma-separated or array)
  const parseMultiSelectionField = (fieldValue, predefinedOptions) => {
    if (!fieldValue) return [];
    
    let selections;
    if (typeof fieldValue === 'string') {
      // Handle comma-separated strings or JSON arrays
      try {
        selections = JSON.parse(fieldValue);
      } catch {
        selections = fieldValue.split(',').map(s => s.trim()).filter(s => s);
      }
    } else if (Array.isArray(fieldValue)) {
      selections = fieldValue;
    } else {
      selections = [fieldValue];
    }
    
    // Normalize selections to match predefined categories
    return selections.map(selection => {
      const normalizedSelection = selection.toLowerCase().trim();
      const matchingCategory = predefinedOptions.find(option => 
        option.toLowerCase() === normalizedSelection ||
        normalizedSelection.includes(option.toLowerCase()) ||
        option.toLowerCase().includes(normalizedSelection)
      );
      return matchingCategory || 'other';
    });
  };

  // Sample Type Distribution with predefined categories
  const sampleTypeCounts = {};
  // Initialize all predefined categories with 0
  PREDEFINED_CATEGORIES.sampleTypes.forEach(type => {
    sampleTypeCounts[type] = 0;
  });
  
  filteredProjects.forEach(project => {
    if (project.sample_type && project.sample_type.trim()) {
      const selections = parseMultiSelectionField(project.sample_type, PREDEFINED_CATEGORIES.sampleTypes);
      selections.forEach(selection => {
        sampleTypeCounts[selection] = (sampleTypeCounts[selection] || 0) + 1;
      });
    }
  });

  const sampleTypeData = {
    labels: Object.keys(sampleTypeCounts),
    datasets: [
      {
        label: 'Projects by Sample Type',
        data: Object.values(sampleTypeCounts),
        backgroundColor: Object.keys(sampleTypeCounts).map((_, i) => 
          chartColors.pandoraColors[i % chartColors.pandoraColors.length]
        ),
        borderColor: Object.keys(sampleTypeCounts).map((_, i) => 
          chartColors.pandoraBorders[i % chartColors.pandoraBorders.length]
        ),
        borderWidth: 1,
      },
    ],
  };

  // Image Type Distribution with predefined categories
  const imageTypeCounts = {};
  // Initialize all predefined categories with 0
  PREDEFINED_CATEGORIES.imagingTechniques.forEach(technique => {
    imageTypeCounts[technique] = 0;
  });
  
  filteredProjects.forEach(project => {
    if (project.image_types && project.image_types.trim()) {
      const selections = parseMultiSelectionField(project.image_types, PREDEFINED_CATEGORIES.imagingTechniques);
      selections.forEach(selection => {
        imageTypeCounts[selection] = (imageTypeCounts[selection] || 0) + 1;
      });
    }
  });

  const imageTypeData = {
    labels: Object.keys(imageTypeCounts),
    datasets: [
      {
        label: 'Projects by Imaging Technique',
        data: Object.values(imageTypeCounts),
        backgroundColor: Object.keys(imageTypeCounts).map((_, i) => 
          chartColors.pandoraColors[(i + 2) % chartColors.pandoraColors.length]
        ),
        borderColor: Object.keys(imageTypeCounts).map((_, i) => 
          chartColors.pandoraBorders[(i + 2) % chartColors.pandoraBorders.length]
        ),
        borderWidth: 1,
      },
    ],
  };

  // Analysis Goal Distribution with predefined categories
  const analysisGoalCounts = {};
  // Initialize all predefined categories with 0
  PREDEFINED_CATEGORIES.analysisGoals.forEach(goal => {
    analysisGoalCounts[goal] = 0;
  });
  
  filteredProjects.forEach(project => {
    if (project.analysis_goal && project.analysis_goal.trim()) {
      const selections = parseMultiSelectionField(project.analysis_goal, PREDEFINED_CATEGORIES.analysisGoals);
      selections.forEach(selection => {
        analysisGoalCounts[selection] = (analysisGoalCounts[selection] || 0) + 1;
      });
    }
  });

  const analysisGoalData = {
    labels: Object.keys(analysisGoalCounts),
    datasets: [
      {
        label: 'Projects by Analysis Goal',
        data: Object.values(analysisGoalCounts),
        backgroundColor: Object.keys(analysisGoalCounts).map((_, i) => 
          chartColors.pandoraColors[(i + 4) % chartColors.pandoraColors.length]
        ),
        borderColor: Object.keys(analysisGoalCounts).map((_, i) => 
          chartColors.pandoraBorders[(i + 4) % chartColors.pandoraBorders.length]
        ),
        borderWidth: 1,
      },
    ],
  };

  // Software Efficiency Analysis
  const softwareEfficiency = {};
  filteredProjects.forEach(project => {
    const software = project.software || 'Not specified';
    const timeSpent = project.time_spent_minutes || 0;
    
    if (!softwareEfficiency[software]) {
      softwareEfficiency[software] = { totalTime: 0, projectCount: 0 };
    }
    softwareEfficiency[software].totalTime += timeSpent;
    softwareEfficiency[software].projectCount += 1;
  });

  const softwareEfficiencyData = {
    labels: Object.keys(softwareEfficiency),
    datasets: [
      {
        label: 'Average Hours per Project',
        data: Object.values(softwareEfficiency).map(s => 
          s.projectCount > 0 ? Math.round((s.totalTime / s.projectCount / 60) * 10) / 10 : 0
        ),
        backgroundColor: Object.keys(softwareEfficiency).map((_, i) => 
          chartColors.pandoraColors[(i + 1) % chartColors.pandoraColors.length]
        ),
        borderColor: Object.keys(softwareEfficiency).map((_, i) => 
          chartColors.pandoraBorders[(i + 1) % chartColors.pandoraBorders.length]
        ),
        borderWidth: 1,
      },
    ],
  };

  // Status Flow Analysis (for bottleneck identification)
  const statusFlow = {
    'Preparing': filteredProjects.filter(p => p.status === 'Preparing' || p.status === 'Intake' || p.status === 'Planning').length,
    'Active': filteredProjects.filter(p => p.status === 'Active' || p.status === 'In Progress' || p.status === 'In-Progress').length,
    'Review': filteredProjects.filter(p => p.status === 'Review' || p.status === 'Waiting').length,
    'Completed': filteredProjects.filter(p => p.status === 'Completed' || p.status === 'Finished').length,
    'On Hold': filteredProjects.filter(p => p.status === 'On Hold').length,
  };

  const statusFlowData = {
    labels: Object.keys(statusFlow),
    datasets: [
      {
        label: 'Projects in Stage',
        data: Object.values(statusFlow),
        backgroundColor: Object.keys(statusFlow).map(status => 
          chartColors.statusColors[status] || chartColors.statusColors['Unknown']
        ),
        borderColor: Object.keys(statusFlow).map(status => 
          chartColors.statusBorders[status] || chartColors.statusBorders['Unknown']
        ),
        borderWidth: 1,
      },
    ],
  };

  const statusFlowOptions = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      title: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Projects'
        },
        ticks: {
          color: chartColors.textColor
        },
        grid: {
          color: chartColors.gridColor
        }
      },
      x: {
        title: {
          display: true,
          text: 'Project Status'
        },
        ticks: {
          color: chartColors.textColor
        },
        grid: {
          color: chartColors.gridColor
        }
      }
    }
  };

  // Group Performance Analysis
  const groupPerformance = {};
  filteredProjects.forEach(project => {
    const groupName = project.group_name || 'No Group';
    if (!groupPerformance[groupName]) {
      groupPerformance[groupName] = { 
        total: 0, 
        completed: 0, 
        totalDuration: 0, 
        projectsWithDuration: 0 
      };
    }
    
    groupPerformance[groupName].total += 1;
    if (project.status === 'Completed' || project.status === 'Finished') {
      groupPerformance[groupName].completed += 1;
    }
    
    // Calculate average project duration for this group
    if (project.creation_date) {
      const creationDate = new Date(project.creation_date);
      const endDate = project.completion_date ? new Date(project.completion_date) : new Date();
      const duration = Math.round((endDate - creationDate) / (1000 * 60 * 60 * 24));
      if (duration > 0) {
        groupPerformance[groupName].totalDuration += duration;
        groupPerformance[groupName].projectsWithDuration += 1;
      }
    }
  });

  const groupPerformanceData = {
    labels: Object.keys(groupPerformance),
    datasets: [
      {
        label: 'Completion Rate (%)',
        data: Object.values(groupPerformance).map(g => 
          g.total > 0 ? Math.round((g.completed / g.total) * 100) : 0
        ),
        backgroundColor: Object.keys(groupPerformance).map((_, i) => 
          chartColors.pandoraColors[(i + 3) % chartColors.pandoraColors.length]
        ),
        borderColor: Object.keys(groupPerformance).map((_, i) => 
          chartColors.pandoraBorders[(i + 3) % chartColors.pandoraBorders.length]
        ),
        borderWidth: 1,
        yAxisID: 'y',
      },
      {
        label: 'Avg Duration (days)',
        data: Object.values(groupPerformance).map(g => 
          g.projectsWithDuration > 0 ? Math.round(g.totalDuration / g.projectsWithDuration) : 0
        ),
        backgroundColor: Object.keys(groupPerformance).map((_, i) => 
          chartColors.pandoraColors[(i + 5) % chartColors.pandoraColors.length] + '80' // Add transparency
        ),
        borderColor: Object.keys(groupPerformance).map((_, i) => 
          chartColors.pandoraBorders[(i + 5) % chartColors.pandoraBorders.length]
        ),
        borderWidth: 1,
        yAxisID: 'y1',
        type: 'line',
      },
    ],
  };

  const groupPerformanceOptions = {
    ...commonOptions,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      ...commonOptions.plugins,
      title: {
        display: false
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Research Groups'
        },
        ticks: {
          color: chartColors.textColor
        },
        grid: {
          color: chartColors.gridColor
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Completion Rate (%)'
        },
        ticks: {
          color: chartColors.textColor
        },
        grid: {
          color: chartColors.gridColor
        },
        max: 100,
        min: 0
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Average Duration (days)'
        },
        ticks: {
          color: chartColors.textColor
        },
        grid: {
          drawOnChartArea: false,
        },
        min: 0
      },
    },
  };

  // Calculate projects completed per month (Velocity)
  const completedByMonth = {};
  
  // Initialize all months with zeros
  for (let i = 0; i < 12; i++) {
    const date = new Date(now);
    date.setMonth(now.getMonth() - i);
    const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    completedByMonth[monthKey] = 0;
  }
  
  // Count completed projects per month
  filteredProjects.forEach(project => {
    if (project.status === 'Completed' || project.status === 'Finished') {
      // Use completion_date if available, otherwise fallback to last_update_date
      const dateStr = project.completion_date || project.last_update_date;
      
      if (dateStr) {
        const completionDate = new Date(dateStr);
        if (completionDate > monthsAgo12) {
          const monthKey = `${completionDate.getFullYear()}-${(completionDate.getMonth() + 1).toString().padStart(2, '0')}`;
          if (completedByMonth[monthKey] !== undefined) {
            completedByMonth[monthKey]++;
          }
        }
      }
    }
  });

  const velocityData = {
    labels: sortedMonths.map(formatMonthLabel),
    datasets: [
      {
        label: 'Projects Completed',
        data: sortedMonths.map(month => completedByMonth[month]),
        borderColor: chartColors.pandoraBorders[3], // Turquoise
        backgroundColor: chartColors.pandoraColors[3],
        fill: true,
        tension: 0.3,
      },
    ],
  };

  // Time vs Duration Scatter Plot
  const timeVsDurationData = {
    datasets: [
      {
        label: 'Projects',
        data: filteredProjects
          .filter(p => p.time_spent_minutes && p.creation_date)
          .map(p => {
            const creationDate = new Date(p.creation_date);
            const endDate = p.completion_date ? new Date(p.completion_date) : new Date();
            const durationDays = Math.max(1, Math.round((endDate - creationDate) / (1000 * 60 * 60 * 24)));
            const hours = p.time_spent_minutes / 60;
            return {
              x: durationDays,
              y: hours,
              project: p // Store project data for tooltip
            };
          }),
        backgroundColor: chartColors.pandoraColors[1], // Medium blue
        borderColor: chartColors.pandoraBorders[1],
        pointRadius: 5,
        pointHoverRadius: 7,
      }
    ]
  };

  const scatterOptions = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      tooltip: {
        ...commonOptions.plugins.tooltip,
        callbacks: {
          label: (context) => {
            const point = context.raw;
            return `${point.project.name}: ${point.y.toFixed(1)}h in ${point.x} days`;
          }
        }
      }
    },
    scales: {
      x: {
        ...commonOptions.scales.x,
        type: 'linear',
        position: 'bottom',
        title: {
          display: true,
          text: 'Duration (Days)'
        }
      },
      y: {
        ...commonOptions.scales.y,
        title: {
          display: true,
          text: 'Time Spent (Hours)'
        }
      }
    }
  };

  // Force chart re-rendering when filtered projects change
  const [chartKey, setChartKey] = useState(Date.now());

  // Update chart key when filtered projects change to force re-rendering of all charts
  useEffect(() => {
    setChartKey(Date.now());
  }, [filteredProjects]);

  return (
    <div className="analytics-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6 animate-fade-in">
          <p className="text-gray-600 dark:text-gray-300">
            Data insights from {isFiltered ? filteredProjects.length : projects.length} projects
            {isFiltered && (
              <span className="ml-2 text-blue-600 text-sm font-medium">
                (Filtered)
              </span>
            )}
          </p>
          
          {/* Date range filter controls */}
          <div className="mt-4 flex flex-wrap gap-4 items-end">
            <div>
              <label htmlFor="start-date" className="block text-sm font-medium text-gray-600 dark:text-night-200 mb-1">
                Start Date
              </label>
              <input
                type="date"
                id="start-date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-night-800 border border-gray-200 dark:border-night-600 rounded-md text-sm text-gray-900 dark:text-night-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                style={{
                  colorScheme: isDarkMode ? 'dark' : 'light'
                }}
              />
            </div>
            <div>
              <label htmlFor="end-date" className="block text-sm font-medium text-gray-600 dark:text-night-200 mb-1">
                End Date
              </label>
              <input
                type="date"
                id="end-date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-night-800 border border-gray-200 dark:border-night-600 rounded-md text-sm text-gray-900 dark:text-night-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                style={{
                  colorScheme: isDarkMode ? 'dark' : 'light'
                }}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={applyDateFilter}
                className="py-2 px-4 text-sm font-medium rounded-xl backdrop-filter backdrop-blur-md bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white shadow-lg hover:shadow-xl border border-white/20 transition-all duration-200 flex items-center gap-2"
              >
                Apply Filter
              </button>
              {isFiltered && (
                <button
                  onClick={resetFilters}
                  className="py-2 px-4 text-sm font-medium rounded-xl backdrop-filter backdrop-blur-md bg-gradient-to-r from-red-400 to-orange-500 hover:from-red-500 hover:to-orange-600 text-white shadow-lg hover:shadow-xl border border-white/20 transition-all duration-200"
                >
                  Reset
                </button>
              )}
            </div>
            <div className="ml-auto">
              <button
                onClick={exportToExcel}
                className="py-2 px-4 text-sm font-medium rounded-xl backdrop-filter backdrop-blur-md bg-gradient-to-r from-green-400 to-lime-500 hover:from-green-500 hover:to-lime-600 text-white shadow-lg hover:shadow-xl border border-white/20 transition-all duration-200 flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Export Report
              </button>
            </div>
          </div>
        </div>
        
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 animate-fade-in">
          <div className="bg-white dark:bg-night-800 rounded-lg border border-gray-200 dark:border-night-600 p-6 shadow-sm hover:shadow-lg transition-colors">
            <div className="flex flex-col">
              <span className="text-sm text-gray-600 dark:text-night-200">Total Projects</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-night-100">{totalProjects}</span>
            </div>
          </div>
          <div className="bg-white dark:bg-night-800 rounded-lg border border-gray-200 dark:border-night-600 p-6 shadow-sm hover:shadow-lg transition-colors">
            <div className="flex flex-col">
              <span className="text-sm text-gray-600 dark:text-night-200">Active Projects</span>
              <span className="text-2xl font-bold text-green-600 dark:text-green-400">{activeProjects}</span>
            </div>
          </div>
          <div className="bg-white dark:bg-night-800 rounded-lg border border-gray-200 dark:border-night-600 p-6 shadow-sm hover:shadow-lg transition-colors">
            <div className="flex flex-col">
              <span className="text-sm text-gray-600 dark:text-night-200">Avg. Time per Project</span>
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{averageTimeHours}h</span>
            </div>
          </div>
          <div className="bg-white dark:bg-night-800 rounded-lg border border-gray-200 dark:border-night-600 p-6 shadow-sm hover:shadow-lg transition-colors">
            <div className="flex flex-col">
              <span className="text-sm text-gray-600 dark:text-night-200">Completion Rate</span>
              <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">{completionRate}%</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Status Distribution */}
          <div className="bg-white dark:bg-night-800 rounded-lg border border-gray-200 dark:border-night-600 shadow-sm hover:shadow-lg transition-colors">
            <div className="p-4 border-b border-gray-200 dark:border-night-600">
              <Tooltip>
                <Tooltip.Trigger asChild>
                  <h3 className="font-medium text-gray-900 dark:text-night-100">Project Status Distribution</h3>
                </Tooltip.Trigger>
                <Tooltip.Panel className="bg-surface text-text text-sm px-2 py-1 rounded shadow-lg">
                  Distribution of projects by current status
                </Tooltip.Panel>
              </Tooltip>
            </div>
            <div className="p-4" style={{ height: '300px' }}>
              <Pie key={`status-${chartKey}`} data={statusData} options={commonOptions} />
            </div>
            <div className="px-4 pb-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                Shows the distribution of all projects by their current status (Active, Completed, On Hold, etc.)
              </p>
            </div>
          </div>
          
          {/* Output/Result Type Distribution */}
          <div className="bg-white dark:bg-night-800 rounded-lg border border-gray-200 dark:border-night-600 shadow-sm hover:shadow-lg transition-colors">
            <div className="p-4 border-b border-gray-200 dark:border-night-600">
              <Tooltip>
                <Tooltip.Trigger asChild>
                  <h3 className="font-medium text-gray-900 dark:text-night-100">Output/Result Type Distribution</h3>
                </Tooltip.Trigger>
                <Tooltip.Panel className="bg-surface text-text text-sm px-2 py-1 rounded shadow-lg">
                  Distribution of projects by declared output/result type
                </Tooltip.Panel>
              </Tooltip>
            </div>
            <div className="p-4" style={{ height: '300px' }}>
              <Pie key={`outputtype-${chartKey}`} data={outputTypeData} options={commonOptions} />
            </div>
            <div className="px-4 pb-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                Shows how projects are classified by their primary outcome (e.g., Counseling, Script, Training)
              </p>
            </div>
          </div>

          {/* Software Distribution */}
          <div className="bg-white dark:bg-night-800 rounded-lg border border-gray-200 dark:border-night-600 shadow-sm hover:shadow-lg transition-colors">
            <div className="p-4 border-b border-gray-200 dark:border-night-600">
              <Tooltip>
                <Tooltip.Trigger asChild>
                  <h3 className="font-medium text-gray-900 dark:text-night-100">Software Usage</h3>
                </Tooltip.Trigger>
                <Tooltip.Panel className="bg-surface text-text text-sm px-2 py-1 rounded shadow-lg">
                  Distribution of projects by software used
                </Tooltip.Panel>
              </Tooltip>
            </div>
            <div className="p-4" style={{ height: '300px' }}>
              <Pie key={`software-${chartKey}`} data={softwareChartData} options={commonOptions} />
            </div>
            <div className="px-4 pb-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                Distribution of projects by the primary analysis software or tool being used
              </p>
            </div>
          </div>
          
          {/* Projects Over Time */}
          <div className="bg-white dark:bg-night-800 rounded-lg border border-gray-200 dark:border-night-600 shadow-sm hover:shadow-lg transition-colors">
            <div className="p-4 border-b border-gray-200 dark:border-night-600">
              <Tooltip>
                <Tooltip.Trigger asChild>
                  <h3 className="font-medium text-gray-900 dark:text-night-100">Project Creation Timeline</h3>
                </Tooltip.Trigger>
                <Tooltip.Panel className="bg-surface text-text text-sm px-2 py-1 rounded shadow-lg">
                  Projects created per month over the past year
                </Tooltip.Panel>
              </Tooltip>
            </div>
            <div className="p-4" style={{ height: '300px' }}>
              <Line key={`timeline-${chartKey}`} data={timeSeriesData} options={commonOptions} />
            </div>
            <div className="px-4 pb-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                Timeline showing when new projects were created over the past months
              </p>
            </div>
          </div>
          
          {/* Time Spent Distribution */}
          <div className="bg-white dark:bg-night-800 rounded-lg border border-gray-200 dark:border-night-600 shadow-sm hover:shadow-lg transition-colors">
            <div className="p-4 border-b border-gray-200 dark:border-night-600">
              <Tooltip>
                <Tooltip.Trigger asChild>
                  <h3 className="font-medium text-gray-900 dark:text-night-100">Time Spent Distribution</h3>
                </Tooltip.Trigger>
                <Tooltip.Panel className="bg-surface text-text text-sm px-2 py-1 rounded shadow-lg">
                  Distribution of projects by time spent
                </Tooltip.Panel>
              </Tooltip>
            </div>
            <div className="p-4" style={{ height: '300px' }}>
              <Bar key={`timespent-${chartKey}`} data={timeSpentData} options={commonOptions} />
            </div>
            <div className="px-4 pb-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                Distribution of projects grouped by total time spent on analysis and research
              </p>
            </div>
          </div>
        </div>
        
        {/* Additional Analytics Section */}
        <h3 className="text-xl font-semibold text-gray-900 dark:text-night-100 mb-4 mt-8 animate-fade-in">Project Performance Analytics</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Monthly Time Tracking chart */}
          <div className="bg-white dark:bg-night-800 rounded-lg border border-gray-200 dark:border-night-600 shadow-sm hover:shadow-lg transition-colors">
            <div className="p-4 border-b border-gray-200 dark:border-night-600">
              <Tooltip>
                <Tooltip.Trigger asChild>
                  <h3 className="font-medium text-gray-900 dark:text-night-100">
                    Monthly Time Tracking
                    {projectDurations.length > 0 && (
                      <span className="ml-2 text-sm font-normal text-blue-600 dark:text-bioluminescent-300">
                        Total: {Math.round(Object.values(timeSpentByMonth).reduce((a, b) => a + b, 0))}h
                      </span>
                    )}
                  </h3>
                </Tooltip.Trigger>
                <Tooltip.Panel className="bg-surface text-text text-sm px-2 py-1 rounded shadow-lg">
                  Time spent per month and cumulative hours
                </Tooltip.Panel>
              </Tooltip>
            </div>
            <div className="p-4" style={{ height: '300px' }}>
              <Bar key={`timetracking-${chartKey}`} data={timeTrackingData} options={timeTrackingOptions} />
            </div>
            <div className="px-4 pb-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                Monthly breakdown of total time spent across all projects, showing productivity patterns
              </p>
            </div>
          </div>
          
          {/* Project Duration Distribution chart */}
          <div className="bg-white dark:bg-night-800 rounded-lg border border-gray-200 dark:border-night-600 shadow-sm hover:shadow-lg transition-colors">
            <div className="p-4 border-b border-gray-200 dark:border-night-600">
              <Tooltip>
                <Tooltip.Trigger asChild>
                  <h3 className="font-medium text-gray-900 dark:text-night-100">
                    Project Duration Distribution
                    {projectDurations.length > 0 && (
                      <span className="ml-2 text-sm font-normal text-blue-600 dark:text-bioluminescent-300">
                        Avg: {averageProjectDuration} days
                      </span>
                    )}
                  </h3>
                </Tooltip.Trigger>
                <Tooltip.Panel className="bg-surface text-text text-sm px-2 py-1 rounded shadow-lg">
                  Distribution of projects by duration (creation to completion/current date for ongoing projects)
                </Tooltip.Panel>
              </Tooltip>
            </div>
            <div className="p-4" style={{ height: '300px' }}>
              <Bar key={`duration-${chartKey}`} data={durationData} options={commonOptions} />
            </div>
            <div className="px-4 pb-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                Time from project creation to completion (or current date for ongoing projects), grouped by duration ranges
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Analytics Section */}
        <h3 className="text-xl font-semibold text-gray-900 dark:text-night-100 mb-4 mt-8 animate-fade-in">Enhanced Project Analytics</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Sample Type Distribution */}
          <div className="bg-white dark:bg-night-800 rounded-lg border border-gray-200 dark:border-night-600 shadow-sm hover:shadow-lg transition-colors">
            <div className="p-4 border-b border-gray-200 dark:border-night-600">
              <Tooltip>
                <Tooltip.Trigger asChild>
                  <h3 className="font-medium text-gray-900 dark:text-night-100">Sample Type Distribution</h3>
                </Tooltip.Trigger>
                <Tooltip.Panel className="bg-surface text-text text-sm px-2 py-1 rounded shadow-lg">
                  Distribution of projects by biological sample type
                </Tooltip.Panel>
              </Tooltip>
            </div>
            <div className="p-4" style={{ height: '300px' }}>
              <Pie key={`sampletype-${chartKey}`} data={sampleTypeData} options={commonOptions} />
            </div>
            <div className="px-4 pb-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                Shows the variety of biological samples being analyzed in your projects
              </p>
            </div>
          </div>

          {/* Imaging Technique Usage */}
          <div className="bg-white dark:bg-night-800 rounded-lg border border-gray-200 dark:border-night-600 shadow-sm hover:shadow-lg transition-colors">
            <div className="p-4 border-b border-gray-200 dark:border-night-600">
              <Tooltip>
                <Tooltip.Trigger asChild>
                  <h3 className="font-medium text-gray-900 dark:text-night-100">Imaging Technique Usage</h3>
                </Tooltip.Trigger>
                <Tooltip.Panel className="bg-surface text-text text-sm px-2 py-1 rounded shadow-lg">
                  Distribution of projects by imaging technique or modality
                </Tooltip.Panel>
              </Tooltip>
            </div>
            <div className="p-4" style={{ height: '300px' }}>
              <Bar key={`imagetype-${chartKey}`} data={imageTypeData} options={commonOptions} />
            </div>
            <div className="px-4 pb-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                Popular imaging techniques and modalities in your facility
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Analysis Goal Distribution */}
          <div className="bg-white dark:bg-night-800 rounded-lg border border-gray-200 dark:border-night-600 shadow-sm hover:shadow-lg transition-colors">
            <div className="p-4 border-b border-gray-200 dark:border-night-600">
              <Tooltip>
                <Tooltip.Trigger asChild>
                  <h3 className="font-medium text-gray-900 dark:text-night-100">Analysis Goal Distribution</h3>
                </Tooltip.Trigger>
                <Tooltip.Panel className="bg-surface text-text text-sm px-2 py-1 rounded shadow-lg">
                  Common types of analysis goals and research objectives
                </Tooltip.Panel>
              </Tooltip>
            </div>
            <div className="p-4" style={{ height: '300px' }}>
              <Pie key={`analysisgoal-${chartKey}`} data={analysisGoalData} options={commonOptions} />
            </div>
            <div className="px-4 pb-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                Most common research objectives and analysis types
              </p>
            </div>
          </div>

          {/* Software Efficiency Analysis */}
          <div className="bg-white dark:bg-night-800 rounded-lg border border-gray-200 dark:border-night-600 shadow-sm hover:shadow-lg transition-colors">
            <div className="p-4 border-b border-gray-200 dark:border-night-600">
              <Tooltip>
                <Tooltip.Trigger asChild>
                  <h3 className="font-medium text-gray-900 dark:text-night-100">
                    Software Efficiency Analysis
                    {filteredProjects.length > 0 && (
                      <span className="ml-2 text-sm font-normal text-blue-600 dark:text-bioluminescent-300">
                        Avg: {Math.round(filteredProjects.reduce((sum, p) => sum + (p.time_spent_minutes || 0), 0) / filteredProjects.length / 60 * 10) / 10}h per project
                      </span>
                    )}
                  </h3>
                </Tooltip.Trigger>
                <Tooltip.Panel className="bg-surface text-text text-sm px-2 py-1 rounded shadow-lg">
                  Average time spent per project by software used
                </Tooltip.Panel>
              </Tooltip>
            </div>
            <div className="p-4" style={{ height: '300px' }}>
              <Bar key={`softwareeff-${chartKey}`} data={softwareEfficiencyData} options={timeSpentByCreationMonthOptions} />
            </div>
            <div className="px-4 pb-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                Compare efficiency across different analysis software platforms
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Project Status Flow */}
          <div className="bg-white dark:bg-night-800 rounded-lg border border-gray-200 dark:border-night-600 shadow-sm hover:shadow-lg transition-colors">
            <div className="p-4 border-b border-gray-200 dark:border-night-600">
              <Tooltip>
                <Tooltip.Trigger asChild>
                  <h3 className="font-medium text-gray-900 dark:text-night-100">Project Status Flow</h3>
                </Tooltip.Trigger>
                <Tooltip.Panel className="bg-surface text-text text-sm px-2 py-1 rounded shadow-lg">
                  Flow of projects through different status stages
                </Tooltip.Panel>
              </Tooltip>
            </div>
            <div className="p-4" style={{ height: '300px' }}>
              <Bar key={`statusflow-${chartKey}`} data={statusFlowData} options={statusFlowOptions} />
            </div>
            <div className="px-4 pb-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                Visualize potential bottlenecks in your project workflow
              </p>
            </div>
          </div>

          {/* Group Performance Analysis */}
          <div className="bg-white dark:bg-night-800 rounded-lg border border-gray-200 dark:border-night-600 shadow-sm hover:shadow-lg transition-colors">
            <div className="p-4 border-b border-gray-200 dark:border-night-600">
              <Tooltip>
                <Tooltip.Trigger asChild>
                  <h3 className="font-medium text-gray-900 dark:text-night-100">Group Performance Analysis</h3>
                </Tooltip.Trigger>
                <Tooltip.Panel className="bg-surface text-text text-sm px-2 py-1 rounded shadow-lg">
                  Completion rates and average project duration by research group
                </Tooltip.Panel>
              </Tooltip>
            </div>
            <div className="p-4" style={{ height: '300px' }}>
              <Bar key={`groupperf-${chartKey}`} data={groupPerformanceData} options={groupPerformanceOptions} />
            </div>
            <div className="px-4 pb-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                Compare productivity and success rates across different research groups
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Project Velocity (Completed per Month) */}
          <div className="bg-white dark:bg-night-800 rounded-lg border border-gray-200 dark:border-night-600 shadow-sm hover:shadow-lg transition-colors">
            <div className="p-4 border-b border-gray-200 dark:border-night-600">
              <Tooltip>
                <Tooltip.Trigger asChild>
                  <h3 className="font-medium text-gray-900 dark:text-night-100">Project Velocity</h3>
                </Tooltip.Trigger>
                <Tooltip.Panel className="bg-surface text-text text-sm px-2 py-1 rounded shadow-lg">
                  Number of projects completed per month
                </Tooltip.Panel>
              </Tooltip>
            </div>
            <div className="p-4" style={{ height: '300px' }}>
              <Line key={`velocity-${chartKey}`} data={velocityData} options={commonOptions} />
            </div>
            <div className="px-4 pb-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                Trend of project completions over the last 12 months
              </p>
            </div>
          </div>

          {/* Time vs Duration Scatter Plot */}
          <div className="bg-white dark:bg-night-800 rounded-lg border border-gray-200 dark:border-night-600 shadow-sm hover:shadow-lg transition-colors">
            <div className="p-4 border-b border-gray-200 dark:border-night-600">
              <Tooltip>
                <Tooltip.Trigger asChild>
                  <h3 className="font-medium text-gray-900 dark:text-night-100">Time vs. Duration</h3>
                </Tooltip.Trigger>
                <Tooltip.Panel className="bg-surface text-text text-sm px-2 py-1 rounded shadow-lg">
                  Correlation between project duration and actual time spent
                </Tooltip.Panel>
              </Tooltip>
            </div>
            <div className="p-4" style={{ height: '300px' }}>
              <Scatter key={`scatter-${chartKey}`} data={timeVsDurationData} options={scatterOptions} />
            </div>
            <div className="px-4 pb-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                Analyze if longer projects actually require more work hours
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;