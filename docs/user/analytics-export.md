# Analytics Export Guide

BIOME provides comprehensive export functionality to share and analyze project statistics. You can export your analytics data in two formats: **PDF** (with visual charts) and **Excel** (with detailed data tables).

## Exporting as PDF

The PDF export creates a professional, print-ready report containing all charts and summary metrics from your Analytics page.

### What's Included in PDF Export

#### Title Page
- Report generation date
- Date range of the data (if filters are applied)
- Key metrics summary in prominent cards:
  - Total Projects
  - Active Projects
  - Completion Rate
  - Average Project Duration
  - Average Time per Project

#### Chart Pages
The PDF includes all 11 analytics charts from your Analytics page:

1. **Project Status Distribution** - Pie chart showing projects by status (Preparing, Active, Review, Completed, On Hold)
2. **Output/Result Type Distribution** - Breakdown of projects by their output type
3. **Software Usage Distribution** - Most commonly used analysis software tools
4. **Project Creation Timeline** - Monthly project creation trend over the past 12 months
5. **Time Spent Distribution** - Distribution of projects grouped by hours invested
6. **Project Duration Distribution** - How long projects typically take from creation to completion
7. **Monthly Time Tracking** - Monthly hours invested with cumulative trend analysis
8. **Analysis Goals Distribution** - Common research objectives and analysis types
9. **Project Status Flow** - Projects progressing through different status stages
10. **Project Velocity** - Number of completed projects per month
11. **Time vs. Duration** - Relationship between project duration and actual time spent

#### Data Tables
- **Summary Metrics** - All key metrics in tabular format
- **Group Performance Analysis** - Completion rates and average duration by research group
- **Software Usage Analysis** - Software tool usage statistics and average time per project

### How to Export as PDF

1. Navigate to the **Analytics** page from the main menu
2. (Optional) Apply date range filters to focus on a specific time period
3. Click the **"Export PDF"** button (red icon) in the top-right corner
4. A loading indicator will appear while the PDF is being generated (typically 2-5 seconds)
5. Choose a location to save the file on your computer
6. The file will be saved as `BIOME_Analytics_Report_YYYY-MM-DD.pdf`

### PDF Features

- **Print-Optimized Design** - Clean, professional layout optimized for printing
- **High-Resolution Charts** - All charts are rendered at high resolution for clarity
- **Automatic Pagination** - Content automatically flows across multiple pages
- **Date Range Awareness** - Reflects the currently applied date filters
- **Multi-Mode Support** - Works in both Desktop (Tauri) and Web environments

## Exporting as Excel

The Excel export provides detailed, structured data tables that you can further analyze, pivot, and customize in Microsoft Excel or other spreadsheet applications.

### What's Included in Excel Export

#### Summary Sheet
- Report metadata (generation date, date range)
- All key metrics:
  - Total Projects
  - Active Projects
  - Completion Rate
  - Average Time per Project
  - Average Project Duration

#### Projects Sheet
Complete list of all projects with:
- Project Name
- Status
- Software Used
- Creation Date
- Last Update Date
- Completion Date
- Time Spent (hours)
- Duration (days)
- Group Name
- Output Type
- User

#### Chart Data Sheets (11 sheets)
Each of the major charts in Analytics has a dedicated data sheet:

- **Status Distribution** - Count of projects by status
- **Output Type Distribution** - Count of projects by output type
- **Software Distribution** - Software usage and count
- **Creation Timeline** - Monthly project creation data
- **Time Distribution** - Projects grouped by time spent ranges
- **Monthly Hours** - Monthly time tracking data with cumulative totals
- **Duration Distribution** - Projects grouped by duration ranges
- **Project Velocity** - Monthly project completion data
- **Analysis Goals** - Analysis goal type distribution
- **Status Flow** - Status stage progression data
- **Time vs Duration** - Raw data with project duration and time spent correlation

#### Analysis Sheets

- **Group Performance** - For each research group:
  - Total Projects
  - Completed Projects
  - Completion Rate (%)
  - Average Duration (days)

- **Software Analysis** - For each software tool:
  - Usage Count
  - Average Time per Project (hours)

### How to Export as Excel

1. Navigate to the **Analytics** page from the main menu
2. (Optional) Apply date range filters to focus on a specific time period
3. Click the **"Export Excel"** button (green icon) in the top-right corner
4. A loading indicator will appear while the Excel file is being generated
5. Choose a location to save the file on your computer
6. The file will be saved as `BIOME_Analytics_Report_YYYY-MM-DD.xlsx`

### Excel Features

- **Multiple Worksheets** - Organized data across 14+ sheets for different analyses
- **Formatted Headers** - Bold headers with frozen panes for easy scrolling
- **Ready to Analyze** - Data is ready for pivot tables, charts, and custom formulas
- **Date Range Awareness** - Reflects the currently applied date filters
- **Copy-Ready** - All data can be easily copied to other documents

## Using Filters with Exports

Both PDF and Excel exports **respect the date range filters** you have applied on the Analytics page.

### Example Workflow

1. **Apply a date filter**: Select a start date (e.g., Jan 1, 2024) and end date (e.g., Mar 31, 2024)
2. **Click "Apply Filter"** to see filtered analytics
3. **Export PDF or Excel** - Only the filtered data will be included
4. **Reset filters** by clicking "Reset" to export all historical data

This allows you to generate reports for specific quarters, project phases, or investigation periods.

## Technical Details

### PDF Generation
- Uses **jsPDF** for document generation
- Uses **html2canvas** for chart rendering
- Client-side processing (no server upload required)
- Supports both dark and light mode themes
- Works in Desktop (Tauri) and Web environments

### Excel Generation
- Uses **XLSX** library for spreadsheet creation
- Supports multi-sheet workbooks
- Compatible with Microsoft Excel, Google Sheets, and LibreOffice
- Automatic column width adjustment
- Professional formatting with alternating row colors

### File Naming
- PDF: `BIOME_Analytics_Report_YYYY-MM-DD.pdf`
- Excel: `BIOME_Analytics_Report_YYYY-MM-DD.xlsx`
- Dates use ISO format (YYYY-MM-DD)

## Troubleshooting

### PDF Export is Slow
- PDF generation requires rendering all charts to images
- Typical time: 2-5 seconds with many charts
- Slower on systems with limited performance
- **Solution**: Close other applications to free up system resources

### Charts Don't Appear in PDF (Desktop Only)
- In rare cases, charts may not render correctly
- **Solution**: Try exporting as Excel instead, which includes raw data tables

### Excel File Won't Open
- Ensure you have Excel 2007 or newer installed
- File may be corrupted if download was interrupted
- **Solution**: Try exporting again

### Date Filters Not Applied to Export
- Verify that "Apply Filter" button was clicked before exporting
- Check that the date range is correctly set
- **Solution**: Reset filters and re-apply if needed

## Best Practices

1. **Regular Reports** - Generate monthly or quarterly PDF reports for stakeholder communication
2. **Data Backup** - Excel exports serve as a backup of your analytics data
3. **Custom Analysis** - Use Excel exports with pivot tables for deeper analysis
4. **Share Projects** - PDF reports are ideal for sharing with team members and stakeholders
5. **Archive Periodically** - Export and archive reports for compliance and historical tracking

## Related Topics

- [Analytics Overview](analytics.md) - Learn about all available analytics and metrics
- [Project Management](projects.md) - Managing projects in BIOME
- [Dashboard](dashboard.md) - Quick overview of your recent activity
