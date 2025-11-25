## [1.4.3] - 2025-11-25
### Fixed
- Project Table View rendering issues where the table appeared empty despite having data.
- Resolved conflict between `react-window` v2.2.3 and `react-virtualized-auto-sizer` by removing the external sizer and relying on the library's internal `ResizeObserver`.
- Updated `react-window` API usage to match the installed version (v2.2.3).
