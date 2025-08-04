# Console Launch Settings Implementation

The Settings component now includes an option to control console visibility when launching the desktop app. However, the actual implementation of this setting requires additional configuration in the Tauri build process.

## Current Implementation

1. **Settings UI**: Added a toggle in the Settings component to control `showConsoleOnLaunch`
2. **Storage**: The setting is saved to localStorage as `biome_show_console_on_launch`
3. **Access**: The setting can be read by any component that needs it

## To Implement Console Control (Future Enhancement)

### Option 1: Build-time Configuration
The current `main.rs` file contains:
```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "console")]
```

This could be modified to read from a configuration file or environment variable.

### Option 2: Runtime Window Management
Use Tauri's window management API to show/hide console programmatically:
```rust
// In main.rs, add a command to toggle console visibility
#[tauri::command]
fn toggle_console_visibility(show: bool) -> Result<(), String> {
    // Implementation would depend on platform-specific APIs
    Ok(())
}
```

### Option 3: Launcher Script Approach
Create a launcher that reads the localStorage setting and launches the app with appropriate flags.

## Current Status

The Settings UI is ready and functional. The actual console control would require:
1. Rust code changes in `src-tauri/src/main.rs`
2. Platform-specific implementations for Windows/macOS/Linux
3. Testing across different operating systems

For now, users can access the setting in the Settings menu, and the preference is saved for future implementation.
