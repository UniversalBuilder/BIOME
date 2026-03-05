/**
 * pdfExportService.js
 *
 * PDF export for BIOME Analytics.
 * Layout: Cover page -> 2x2 chart grid pages (4 charts + insights per page) -> data tables
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- Layout constants ---
const PAGE_W   = 210;
const PAGE_H   = 297;
const MARGIN   = 14;
const COL_W    = (PAGE_W - MARGIN * 2 - 8) / 2; // ~87mm per column, 8mm gap
const COL_R    = MARGIN + COL_W + 8;             // X of right column
const ROW_H    = 92;                             // fixed height per chart row (mm)
const ROW_GAP  = 8;                              // gap between rows (mm)
const MAX_CHART_H = 58;                          // max chart image height in a grid cell
const CONTENT_START = 16;                        // Y below section header
const FOOTER_Y = PAGE_H - 8;

// --- Color palette ---
const C = {
  title:   [15,  23,  42],
  heading: [30,  58, 138],
  sub:     [71,  85, 105],
  muted:   [148, 163, 184],
  accent:  [59, 130, 246],
  success: [16, 185, 129],
  warn:    [245, 158, 11],
  border:  [226, 232, 240],
  bg:      [248, 250, 252],
  white:   [255, 255, 255],
  dark:    [30,  41,  59],   // slate-800 (chart backing)
};

// --- Helpers ---
const hRule = (doc, x, y, w, color = C.border) => {
  doc.setDrawColor(...color);
  doc.setLineWidth(0.3);
  doc.line(x, y, x + w, y);
};

const drawFooter = (doc) => {
  const n = doc.internal.getNumberOfPages();
  doc.setFontSize(8);
  doc.setTextColor(...C.muted);
  doc.text('BIOME Analytics Report', MARGIN, FOOTER_Y);
  doc.text(`Page ${n}`, PAGE_W - MARGIN, FOOTER_Y, { align: 'right' });
  hRule(doc, MARGIN, FOOTER_Y - 3, PAGE_W - MARGIN * 2);
};

const wrappedText = (doc, text, x, y, maxW, fontSize = 8, color = C.sub) => {
  doc.setFontSize(fontSize);
  doc.setTextColor(...color);
  const lines = doc.splitTextToSize(text, maxW);
  doc.text(lines, x, y);
  return y + lines.length * (fontSize * 0.352 + 1.2);
};

/** Format a raw ISO date string (YYYY-MM-DD) or plain text for display */
const fmtDate = (raw) => {
  if (!raw || raw === 'All time' || raw === 'Present') return raw;
  try {
    const d = new Date(raw + 'T00:00:00');
    if (isNaN(d.getTime())) return raw;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return raw; }
};

// --- Cover page ---
const addCoverPage = (doc, summaryMetrics, dateRange) => {
  // Header band
  doc.setFillColor(...C.heading);
  doc.rect(0, 0, PAGE_W, 52, 'F');

  doc.setFontSize(26);
  doc.setTextColor(...C.white);
  doc.setFont(undefined, 'bold');
  doc.text('BIOME Analytics Report', MARGIN, 24);
  doc.setFont(undefined, 'normal');

  // Period label
  const sd = dateRange?.startDate;
  const ed = dateRange?.endDate;
  let periodLabel;
  if ((!sd || sd === 'All time') && (!ed || ed === 'Present')) {
    periodLabel = 'All data (no date filter applied)';
  } else {
    periodLabel = `${fmtDate(sd) || 'All time'}  to  ${fmtDate(ed) || 'Present'}`;
  }
  doc.setFontSize(11);
  doc.setTextColor(186, 210, 253);
  doc.text(`Period: ${periodLabel}`, MARGIN, 36);
  doc.setFontSize(9);
  doc.setTextColor(147, 197, 253);
  doc.text(`Generated: ${new Date().toLocaleString()}`, MARGIN, 44);

  // KPI boxes
  const metrics = [
    { label: 'Total Projects',   value: String(summaryMetrics.totalProjects),         color: C.accent },
    { label: 'Active Projects',  value: String(summaryMetrics.activeProjects),         color: C.success },
    { label: 'Completed',        value: String(summaryMetrics.completedProjects),      color: [99, 102, 241] },
    { label: 'Completion Rate',  value: `${summaryMetrics.completionRate}%`,           color: C.warn },
    { label: 'Avg Time/Project', value: `${summaryMetrics.averageTimeHours}h`,         color: [236, 72, 153] },
  ];
  const boxW = (PAGE_W - MARGIN * 2 - 16) / 5;
  const boxY = 62;
  const boxH = 28;

  metrics.forEach((m, i) => {
    const x = MARGIN + i * (boxW + 4);
    doc.setFillColor(...C.white);
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.4);
    doc.roundedRect(x, boxY, boxW, boxH, 2, 2, 'FD');
    doc.setFillColor(...m.color);
    doc.roundedRect(x, boxY, boxW, 3, 2, 2, 'F');
    doc.rect(x, boxY + 1.5, boxW, 1.5, 'F');
    doc.setFontSize(7);
    doc.setTextColor(...C.muted);
    doc.text(m.label, x + boxW / 2, boxY + 10, { align: 'center', maxWidth: boxW - 4 });
    doc.setFontSize(13);
    doc.setTextColor(...C.title);
    doc.setFont(undefined, 'bold');
    doc.text(m.value, x + boxW / 2, boxY + 22, { align: 'center' });
    doc.setFont(undefined, 'normal');
  });

  hRule(doc, MARGIN, 100, PAGE_W - MARGIN * 2);

  // Summary paragraph
  const total = summaryMetrics.totalProjects;
  const active = summaryMetrics.activeProjects;
  const done   = summaryMetrics.completedProjects;
  const rate   = summaryMetrics.completionRate;
  const avgT   = summaryMetrics.averageTimeHours;
  const avgD   = summaryMetrics.averageProjectDuration;
  const summaryText =
    `This report covers ${total} project${total !== 1 ? 's' : ''} for the period: ${periodLabel}. ` +
    `${active} project${active !== 1 ? 's are' : ' is'} currently active and ${done} ` +
    `${done !== 1 ? 'have' : 'has'} been completed (${rate}% completion rate). ` +
    `On average, each project requires ${avgT} hours of work and spans ${avgD} days.`;
  wrappedText(doc, summaryText, MARGIN, 108, PAGE_W - MARGIN * 2, 9, C.sub);

  // Contents list
  doc.setFontSize(9);
  doc.setTextColor(...C.heading);
  doc.setFont(undefined, 'bold');
  doc.text('Report Contents', MARGIN, 140);
  doc.setFont(undefined, 'normal');

  const contents = [
    'Page 2    -  Status, Output Type, Software Usage & Creation Timeline',
    'Page 3    -  Time Spent, Duration, Monthly Tracking & Analysis Goals',
    'Page 4    -  Status Flow & Project Velocity',
    'Page 5+  -  Summary Metrics, Group Performance & Software Analysis',
  ];
  contents.forEach((line, i) => {
    doc.setFontSize(8.5);
    doc.setTextColor(...C.sub);
    doc.text(line, MARGIN + 4, 149 + i * 9);
  });

  drawFooter(doc);
  doc.addPage();
};

// --- Draw single chart card ---
/**
 * Draw one chart card at (x, y) within a fixed row height.
 * @param {number} availH - vertical space available for the chart image
 */
const drawChartCard = (doc, x, y, title, chartData, insights = [], availH = MAX_CHART_H) => {
  const w = COL_W;

  // Title
  doc.setFontSize(9.5);
  doc.setTextColor(...C.heading);
  doc.setFont(undefined, 'bold');
  doc.text(title, x, y + 4.5, { maxWidth: w });
  doc.setFont(undefined, 'normal');
  let curY = y + 7;

  hRule(doc, x, curY, w, C.accent);
  curY += 2.5;

  // Chart image
  if (chartData?.image) {
    const aspectRatio = chartData.aspectRatio || 0.75;
    const imgH = Math.min(availH, Math.max(35, w * aspectRatio));
    doc.setFillColor(...C.dark);
    doc.roundedRect(x, curY, w, imgH, 2, 2, 'F');
    doc.addImage(chartData.image, 'PNG', x, curY, w, imgH);
    curY += imgH + 2.5;
  } else {
    doc.setFontSize(7.5);
    doc.setTextColor(...C.muted);
    doc.text('(No chart data)', x + w / 2, curY + 10, { align: 'center' });
    curY += 15;
  }

  // Insights
  if (insights.length > 0) {
    hRule(doc, x, curY, w);
    curY += 2.5;
    doc.setFontSize(7);
    doc.setTextColor(...C.sub);
    for (const line of insights) {
      if (curY > FOOTER_Y - 12) break;
      const wrapped = doc.splitTextToSize(`- ${line}`, w - 2);
      doc.text(wrapped, x + 1, curY);
      curY += wrapped.length * 3.5;
    }
  }
};

// --- Chart grid page (up to 4 cards in 2x2 layout) ---
const addChartGridPage = (doc, sectionTitle, cards) => {
  // Section header bar
  doc.setFillColor(...C.bg);
  doc.rect(0, 0, PAGE_W, 12, 'F');
  doc.setFontSize(9);
  doc.setTextColor(...C.heading);
  doc.setFont(undefined, 'bold');
  doc.text(sectionTitle, MARGIN, 8);
  doc.setFont(undefined, 'normal');
  hRule(doc, 0, 12, PAGE_W, C.border);

  const row1Y = CONTENT_START;
  const row2Y = CONTENT_START + ROW_H + ROW_GAP;

  // Row 1: cards[0] (left) + cards[1] (right)
  if (cards[0]) drawChartCard(doc, MARGIN, row1Y, cards[0].title, cards[0].data, cards[0].insights, MAX_CHART_H);
  if (cards[1]) drawChartCard(doc, COL_R,  row1Y, cards[1].title, cards[1].data, cards[1].insights, MAX_CHART_H);

  // Horizontal divider between rows
  if (cards[2]) {
    hRule(doc, MARGIN, row1Y + ROW_H, PAGE_W - MARGIN * 2, C.border);
    // Row 2: cards[2] (left) + cards[3] (right)
    drawChartCard(doc, MARGIN, row2Y, cards[2].title, cards[2].data, cards[2].insights, MAX_CHART_H);
    if (cards[3]) drawChartCard(doc, COL_R, row2Y, cards[3].title, cards[3].data, cards[3].insights, MAX_CHART_H);
  }

  drawFooter(doc);
  doc.addPage();
};

// --- Insight builders ---
const top = (obj, n = 3) =>
  Object.entries(obj || {}).sort((a, b) => Number(b[1]) - Number(a[1])).slice(0, n);

const buildStatusInsights = (dist, total) => {
  const lines = top(dist).map(([s, c]) => `${s}: ${c} (${Math.round(c / total * 100)}%)`);
  lines.push(`${Object.keys(dist || {}).length} distinct statuses recorded`);
  return lines;
};
const buildOutputTypeInsights = (dist, total) => {
  const lines = top(dist).map(([t, c]) => `${t}: ${c} (${Math.round(c / total * 100)}%)`);
  lines.push(`${Object.keys(dist || {}).length} output types`);
  return lines;
};
const buildSoftwareInsights = (dist) => {
  const all = dist?.all || dist || {};
  const lines = top(all, 4).map(([s, c]) => `${s}: ${c} uses`);
  lines.push(`${Object.keys(all).length} distinct tools used`);
  return lines;
};
const buildTimelineInsights = (timeline) => {
  if (!timeline) return ['No timeline data available'];
  const entries = Object.entries(timeline);
  if (!entries.length) return ['No projects in timeline range'];
  const total = entries.reduce((s, [, v]) => s + v, 0);
  const peak = entries.reduce((a, b) => (b[1] > a[1] ? b : a));
  return [
    `Peak month: ${peak[0]} (${peak[1]} project${peak[1] !== 1 ? 's' : ''})`,
    `Average: ${(total / entries.length).toFixed(1)} projects/month`,
    `Total in period: ${total} projects`,
  ];
};
const buildTimeSpentInsights = (dist, avgHours) => {
  const lines = top(dist).map(([r, c]) => `${r}: ${c} project${c !== 1 ? 's' : ''}`);
  lines.push(`Overall average: ${avgHours} hours/project`);
  return lines;
};
const buildDurationInsights = (dist, avgDays) => {
  const lines = top(dist).map(([r, c]) => `${r}: ${c} project${c !== 1 ? 's' : ''}`);
  lines.push(`Overall average duration: ${avgDays} days`);
  return lines;
};
const buildMonthlyInsights = (monthly) => {
  if (!monthly) return ['No monthly data available'];
  const entries = Object.entries(monthly);
  const total = entries.reduce((s, [, v]) => s + (v?.hours ?? v ?? 0), 0);
  if (!entries.length) return ['No monthly data'];
  const peak = entries.reduce((a, b) => ((b[1]?.hours ?? b[1] ?? 0) > (a[1]?.hours ?? a[1] ?? 0) ? b : a));
  return [
    `Total hours logged: ${Math.round(total)}h`,
    `Peak month: ${peak[0]} (${Math.round(peak[1]?.hours ?? peak[1] ?? 0)}h)`,
    `Average: ${(total / entries.length).toFixed(1)}h/month`,
  ];
};
const buildGoalsInsights = (dist, total) =>
  top(dist, 4).map(([g, c]) => `${g}: ${c} (${Math.round(c / Math.max(total, 1) * 100)}%)`);
const buildStatusFlowInsights = (dist) => {
  const entries = Object.entries(dist || {}).sort((a, b) => b[1] - a[1]);
  const active = entries.find(([s]) => /active/i.test(s));
  const hold   = entries.find(([s]) => /hold/i.test(s));
  const review = entries.find(([s]) => /review/i.test(s));
  const lines = [];
  if (active) lines.push(`In progress: ${active[1]} projects`);
  if (hold)   lines.push(`Blocked/On Hold: ${hold[1]} projects`);
  if (review) lines.push(`In review: ${review[1]} projects`);
  lines.push(`${entries.length} workflow stages tracked`);
  return lines;
};
const buildVelocityInsights = (velocity) => {
  if (!velocity) return ['No velocity data'];
  const vals = Object.values(velocity).filter(v => v > 0);
  const total = vals.reduce((s, v) => s + v, 0);
  const max = Math.max(...(vals.length ? vals : [0]));
  return [
    `Total completions tracked: ${total}`,
    `Best month: ${max} completion${max !== 1 ? 's' : ''}`,
    `Active months: ${vals.length}`,
  ];
};

// --- Data table section ---
const addTableSection = (doc, tableTitle, headers, rows) => {
  doc.setFontSize(11);
  doc.setTextColor(...C.heading);
  doc.setFont(undefined, 'bold');
  doc.text(tableTitle, MARGIN, MARGIN + 6);
  doc.setFont(undefined, 'normal');
  hRule(doc, MARGIN, MARGIN + 9, PAGE_W - MARGIN * 2, C.accent);

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: MARGIN + 13,
    margin: { left: MARGIN, right: MARGIN },
    headStyles: { fillColor: C.heading, textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { textColor: C.title[0], fontSize: 8.5 },
    alternateRowStyles: { fillColor: C.bg },
    didDrawPage: () => {
      doc.setFontSize(8);
      doc.setTextColor(...C.muted);
      doc.text(`Page ${doc.internal.getNumberOfPages()}`, PAGE_W - MARGIN, PAGE_H - 8, { align: 'right' });
      hRule(doc, MARGIN, PAGE_H - 11, PAGE_W - MARGIN * 2);
    },
  });
};

// --- Save helper ---
const savePDF = async (doc, filename) => {
  try {
    if (window.__TAURI__) {
      const { save } = await import('@tauri-apps/plugin-dialog');
      const { writeBinaryFile } = await import('@tauri-apps/plugin-fs');
      const filePath = await save({
        filters: [{ name: 'PDF Document', extensions: ['pdf'] }],
        defaultPath: filename,
      });
      if (filePath) {
        await writeBinaryFile(filePath, new Uint8Array(doc.output('arraybuffer')));
      }
    } else {
      doc.save(filename);
    }
  } catch (e) {
    console.error('PDF save error:', e);
    doc.save(filename);
  }
};

// --- Main export (with charts) ---
export const exportAnalyticsPDF = async (analyticsData, chartElements = {}) => {
  try {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const {
      summaryMetrics,
      statusDistribution,
      outputTypeDistribution,
      softwareDistribution,
      creationTimeline,
      timeSpentDistribution,
      durationDistribution,
      groupPerformance,
      softwareAnalysis,
      monthlyTimeTracking,
      analysisGoalsDistribution,
      projectVelocity,
      dateRange,
    } = analyticsData;

    const total = summaryMetrics?.totalProjects || 1;
    const avgT  = summaryMetrics?.averageTimeHours;
    const avgD  = summaryMetrics?.averageProjectDuration;

    // Cover
    addCoverPage(doc, summaryMetrics, dateRange);

    // Page 2: 4 charts (2x2) - Status, Output Type, Software, Timeline
    addChartGridPage(doc, 'Distribution & Timeline Overview', [
      { title: 'Status Distribution',       data: chartElements.statusChart,          insights: buildStatusInsights(statusDistribution, total) },
      { title: 'Output / Result Type',       data: chartElements.outputTypeChart,      insights: buildOutputTypeInsights(outputTypeDistribution, total) },
      { title: 'Software Usage',             data: chartElements.softwareChart,        insights: buildSoftwareInsights(softwareDistribution) },
      { title: 'Project Creation Timeline',  data: chartElements.creationTimelineChart, insights: buildTimelineInsights(creationTimeline) },
    ]);

    // Page 3: 4 charts (2x2) - Time Spent, Duration, Monthly, Goals
    addChartGridPage(doc, 'Time, Duration & Activity Tracking', [
      { title: 'Time Spent Distribution',    data: chartElements.timeSpentChart,        insights: buildTimeSpentInsights(timeSpentDistribution, avgT) },
      { title: 'Project Duration',           data: chartElements.durationChart,         insights: buildDurationInsights(durationDistribution, avgD) },
      { title: 'Monthly Time Tracking',      data: chartElements.monthlyHoursChart,     insights: buildMonthlyInsights(monthlyTimeTracking) },
      { title: 'Analysis Goal Distribution', data: chartElements.goalDistributionChart, insights: buildGoalsInsights(analysisGoalsDistribution, total) },
    ]);

    // Page 4: 2 charts (1 row) - Status Flow, Velocity
    addChartGridPage(doc, 'Project Status Flow & Velocity', [
      { title: 'Status Flow',      data: chartElements.statusFlowChart, insights: buildStatusFlowInsights(statusDistribution) },
      { title: 'Project Velocity', data: chartElements.velocityChart,   insights: buildVelocityInsights(projectVelocity) },
    ]);

    // Table pages (addPage already triggered by last addChartGridPage)
    addTableSection(doc, 'Summary Metrics', ['Metric', 'Value'], [
      ['Total Projects',       summaryMetrics.totalProjects],
      ['Active Projects',      summaryMetrics.activeProjects],
      ['Completed Projects',   summaryMetrics.completedProjects],
      ['Completion Rate',      `${summaryMetrics.completionRate}%`],
      ['Avg Time per Project', `${summaryMetrics.averageTimeHours} hours`],
      ['Avg Project Duration', `${summaryMetrics.averageProjectDuration} days`],
    ]);

    if (groupPerformance && Object.keys(groupPerformance).length > 0) {
      doc.addPage();
      const rows = Object.entries(groupPerformance).map(([name, m]) => [
        name, m.totalProjects, m.completedProjects, `${m.completionRate}%`, `${m.averageDuration} days`,
      ]);
      addTableSection(doc, 'Group Performance Analysis',
        ['Group', 'Total', 'Completed', 'Completion Rate', 'Avg Duration'], rows);
    }

    if (softwareAnalysis && Object.keys(softwareAnalysis).length > 0) {
      doc.addPage();
      const rows = Object.entries(softwareAnalysis)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 25)
        .map(([name, m]) => [name, m.count, `${m.averageTime} hours`]);
      addTableSection(doc, 'Software Usage Analysis', ['Software', 'Usage Count', 'Avg Time per Project'], rows);
    }

    const filename = `BIOME_Analytics_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
    await savePDF(doc, filename);
  } catch (error) {
    console.error('Error exporting analytics PDF:', error);
    throw error;
  }
};

// --- Data-only export (no charts) ---
export const exportAnalyticsPDFDataOnly = async (analyticsData) => {
  try {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const { summaryMetrics, statusDistribution, outputTypeDistribution, softwareDistribution, dateRange } = analyticsData;

    addCoverPage(doc, summaryMetrics, dateRange);

    addTableSection(doc, 'Summary Metrics', ['Metric', 'Value'], [
      ['Total Projects',       summaryMetrics.totalProjects],
      ['Active Projects',      summaryMetrics.activeProjects],
      ['Completed Projects',   summaryMetrics.completedProjects],
      ['Completion Rate',      `${summaryMetrics.completionRate}%`],
      ['Avg Time/Project',     `${summaryMetrics.averageTimeHours} hours`],
      ['Avg Duration',         `${summaryMetrics.averageProjectDuration} days`],
    ]);

    doc.addPage();
    addTableSection(doc, 'Status Distribution', ['Status', 'Count'],
      Object.entries(statusDistribution || {}).map(([s, c]) => [s, c]));

    doc.addPage();
    addTableSection(doc, 'Output / Result Type Distribution', ['Type', 'Count'],
      Object.entries(outputTypeDistribution || {}).map(([t, c]) => [t, c]));

    doc.addPage();
    const swAll = softwareDistribution?.all || softwareDistribution || {};
    addTableSection(doc, 'Software Usage', ['Software', 'Count'],
      Object.entries(swAll).sort((a, b) => b[1] - a[1]).map(([s, c]) => [s, c]));

    const filename = `BIOME_Analytics_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
    await savePDF(doc, filename);
  } catch (error) {
    console.error('Error generating data-only PDF:', error);
    throw error;
  }
};

export default {
  exportAnalyticsPDF,
  exportAnalyticsPDFDataOnly,
};
