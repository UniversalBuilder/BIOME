# BIOME v2.3.0 — Release Notes

**Release date:** 2026-02-27  
**Installer:** `BIOME_2.3.0_x64_en-US.msi`

---

## What's New

### Persistent Page Titles in Top Bar
Each page now shows its title and subtitle anchored in the navigation bar. The titles remain visible regardless of scroll position, following standard app navigation conventions. The old large title banners embedded in the scrollable content have been removed.

### About Card Redesign
- Replaced the green "B" letter avatar with the BIOME gradient logotype, consistent with the main header
- Version badge changed from green to **amber** for better visual hierarchy
- Details and Website action buttons now use the same neutral style

### Project Details — Collapsible Sections
- Project Metadata (Zone A) and Project Workspace (Zone B) each have an independent **chevron collapse toggle**
- The "Edit Project Metadata" button has been moved into the Zone A header for quicker access

---

## Improvements

- **Colour consistency**: All remaining blue accents in the Project Workspace (textarea borders, table headers, dividers, file links, row hovers) have been replaced with bioluminescent green, fully aligning with the BIOME design system
- **Top bar shadow**: Now permanently visible using a plain CSS class — provides clear separation between the navigation bar and the scrollable content area at all times

---

## Bug Fixes

- **Double scrollbar**: Removed the `html`-level forced scrollbar that was appearing as a phantom second scrollbar track alongside the correct in-card scrollbar
- **Right-side window gap**: Removed reserved-but-unused scrollbar space (`scrollbar-gutter`) that was creating an asymmetric margin on the right side of the window
- **Top bar shadow flicker**: Shadow was only appearing on hover due to a Tailwind JIT issue with arbitrary-value dark-mode utilities — fixed by moving to a dedicated CSS class

---

## Upgrade Notes

This is a UI-only release. No database schema changes, no migration required. Existing data is fully preserved on upgrade.
