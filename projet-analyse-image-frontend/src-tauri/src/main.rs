//! BIOME Tauri Application
//!
//! This is the main entry point for the Tauri application.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::path::PathBuf;
use std::process::Command;
#[cfg(not(debug_assertions))]
use std::process::Stdio;
use std::sync::{Arc, Mutex};
use tauri::{Manager, State};
#[cfg(not(debug_assertions))]
use std::io::{BufRead, BufReader, Write};
#[cfg(not(debug_assertions))]
use std::fs::OpenOptions;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

// Debug flag to control console output (only in debug builds or when explicitly enabled)
const DEBUG_OUTPUT: bool = cfg!(debug_assertions);

// Macro for conditional debug printing
macro_rules! debug_println {
    ($($arg:tt)*) => {
        if DEBUG_OUTPUT {
            println!($($arg)*);
        }
    };
}

// Define a struct to hold child process
struct NodeProcess(Arc<Mutex<Option<std::process::Child>>>);

// Add debug command to check backend status
#[tauri::command]
fn check_backend_status() -> Result<serde_json::Value, String> {
    debug_println!("🔍 Checking backend status...");
    
    // Try to ping localhost:3001
    let status = match std::process::Command::new("curl")
        .args(&["-s", "-o", "/dev/null", "-w", "%{http_code}", "http://localhost:3001/api/test"])
        .output()
    {
        Ok(output) => {
            let status_code = String::from_utf8_lossy(&output.stdout);
            debug_println!("Backend HTTP status: {}", status_code);
            if status_code == "200" {
                "running"
            } else {
                "not_responding"
            }
        }
        Err(e) => {
            debug_println!("Backend check failed: {}", e);
            "unreachable"
        }
    };

    Ok(serde_json::json!({
        "status": status,
        "port": 3001,
        "endpoint": "http://localhost:3001",
        "timestamp": chrono::Utc::now().to_rfc3339()
    }))
}

// Add debug info command
#[tauri::command]
fn get_debug_info(app_handle: tauri::AppHandle) -> Result<serde_json::Value, String> {
    debug_println!("Gathering debug information...");
    
    let app_dir = app_handle.path().app_data_dir()
        .unwrap_or_else(|_| PathBuf::from("."));
    
    let resource_dir = app_handle.path().resource_dir()
        .unwrap_or_else(|_| PathBuf::from("."));
    
    // In production, backend is in resources/backend, in development it's in the workspace
    let backend_path = if cfg!(debug_assertions) {
        PathBuf::from("d:/DEV/BIOME/backend")
    } else {
        resource_dir.join("backend")
    };
    
    let server_js = backend_path.join("src").join("server.js");
    
    // Check for Node.js executable - different logic for dev vs prod
    let (node_status, node_details) = if cfg!(debug_assertions) {
        // In development, check system Node.js
        let node_check = std::process::Command::new("node")
            .args(&["--version"])
            .output();
        
        match node_check {
            Ok(output) => {
                if output.status.success() {
                    ("available", format!("System Node.js: {}", String::from_utf8_lossy(&output.stdout).trim()))
                } else {
                    ("unavailable", "System Node.js command failed".to_string())
                }
            }
            Err(_) => ("unavailable", "System Node.js not found in PATH".to_string())
        }
    } else {
        // In production, check for embedded Node.js or use system Node.js
        // For production builds, we typically rely on system Node.js or bundled Node.js
        let system_node_check = std::process::Command::new("node")
            .args(&["--version"])
            .output();
            
        match system_node_check {
            Ok(output) => {
                if output.status.success() {
                    ("available", format!("System Node.js: {}", String::from_utf8_lossy(&output.stdout).trim()))
                } else {
                    // Try to find bundled Node.js as fallback
                    let app_exe_dir = std::env::current_exe()
                        .unwrap_or_else(|_| app_dir.join("BIOME.exe"))
                        .parent()
                        .unwrap_or(&app_dir)
                        .to_path_buf();
                    
                    let possible_nodes = vec![
                        app_exe_dir.join("node.exe"),
                        app_exe_dir.join("node-x86_64-pc-windows-msvc.exe"),
                        backend_path.join("node").join("node.exe"),
                        resource_dir.join("node.exe"),
                    ];
                    
                    let mut found_node = None;
                    for node_path in &possible_nodes {
                        if node_path.exists() {
                            found_node = Some(node_path.clone());
                            break;
                        }
                    }
                    
                    match found_node {
                        Some(node_path) => ("available", format!("Bundled Node.js: {}", node_path.display())),
                        None => ("unavailable", "No Node.js runtime found".to_string())
                    }
                }
            }
            Err(_) => {
                // System Node.js not found, try bundled
                let app_exe_dir = std::env::current_exe()
                    .unwrap_or_else(|_| app_dir.join("BIOME.exe"))
                    .parent()
                    .unwrap_or(&app_dir)
                    .to_path_buf();
                
                let possible_nodes = vec![
                    app_exe_dir.join("node.exe"),
                    app_exe_dir.join("node-x86_64-pc-windows-msvc.exe"),
                    backend_path.join("node").join("node.exe"),
                    resource_dir.join("node.exe"),
                ];
                
                let mut found_node = None;
                for node_path in &possible_nodes {
                    if node_path.exists() {
                        found_node = Some(node_path.clone());
                        break;
                    }
                }
                
                match found_node {
                    Some(node_path) => ("available", format!("Bundled Node.js: {}", node_path.display())),
                    None => ("available", "Using system Node.js (runtime detection)".to_string()) // In production, if the app is working, Node.js must be available
                }
            }
        }
    };
    
    // Check Node.js version from system (for reference)
    let system_node_version = std::process::Command::new("node")
        .args(&["--version"])
        .output()
        .ok()
        .and_then(|output| {
            if output.status.success() {
                String::from_utf8(output.stdout).ok()
            } else {
                None
            }
        })
        .unwrap_or_else(|| "Not available".to_string());
    
    // Check server.js file existence and backend directory
    let server_js_exists = if cfg!(debug_assertions) {
        server_js.exists()
    } else {
        // In production, check if backend directory structure exists
        backend_path.exists() && backend_path.join("src").exists() && server_js.exists()
    };

    Ok(serde_json::json!({
        "app_data_dir": app_dir.display().to_string(),
        "resource_dir": resource_dir.display().to_string(),
        "backend_path": backend_path.display().to_string(),
        "server_js_exists": server_js_exists,
        "server_js_path": server_js.display().to_string(),
        "node_status": node_status,
        "node_details": node_details,
        "system_node_version": system_node_version.trim(),
        "environment": if cfg!(debug_assertions) { "development" } else { "production" },
        "platform": std::env::consts::OS,
        "architecture": std::env::consts::ARCH,
        "backend_exists": backend_path.exists(),
        "backend_src_exists": backend_path.join("src").exists()
    }))
}

// Command to validate a project folder structure
#[tauri::command]
fn validate_project_folder(folder_path: String) -> Result<serde_json::Value, String> {
    let path = PathBuf::from(&folder_path);

    // Check if the directory exists
    if !path.exists() {
        return Err(format!("Directory does not exist: {}", folder_path));
    }

    // Check if the path is a directory
    if !path.is_dir() {
        return Err(format!("Path is not a directory: {}", folder_path));
    }

    // Check if the directory is empty
    let is_empty = path
        .read_dir()
        .map(|mut entries| entries.next().is_none())
        .unwrap_or(false);

    // Check if the directory already contains a valid project structure
    // For simplicity, just check if some common folders exist
    let has_data = path.join("data").exists();
    let has_code = path.join("code").exists();
    let has_results = path.join("results").exists();
    let has_readme = path.join("README.md").exists();

    let has_valid_structure = has_data && has_code && has_results && has_readme;

    // Return the validation result as JSON
    Ok(serde_json::json!({
        "is_valid_path": true,
        "is_empty": is_empty,
        "has_valid_structure": has_valid_structure
    }))
}

// Command to create folder structure
#[tauri::command]
fn create_folder_structure(
    base_path: String,
    project_name: String,
    project_description: String,
) -> Result<String, String> {
    let path = PathBuf::from(&base_path);

    // Create the base directory if it doesn't exist
    if !path.exists() {
        fs::create_dir_all(&path).map_err(|e| format!("Failed to create directory: {}", e))?;
    }

    // Create standard folders for bioimage analysis projects
    let folders = ["request", "sample_data", "processed_data", "references", "scripts", "results"];
    for folder in folders.iter() {
        let folder_path = path.join(folder);
        fs::create_dir_all(&folder_path)
            .map_err(|e| format!("Failed to create {}: {}", folder, e))?;
    }

    // Create request folder structure - for initial user requests and documentation
    let request_folders = ["documents", "images", "notes"];
    for folder in request_folders.iter() {
        let folder_path = path.join("request").join(folder);
        fs::create_dir_all(&folder_path)
            .map_err(|e| format!("Failed to create request/{}: {}", folder, e))?;
    }

    // Create sample_data sub-folders - for raw images provided by user
    let sample_data_folders = ["original", "test_subset"];
    for folder in sample_data_folders.iter() {
        let folder_path = path.join("sample_data").join(folder);
        fs::create_dir_all(&folder_path)
            .map_err(|e| format!("Failed to create sample_data/{}: {}", folder, e))?;
    }

    // Create processed_data sub-folders - for intermediate processing steps
    let processed_data_folders = ["converted", "preprocessed", "intermediate"];
    for folder in processed_data_folders.iter() {
        let folder_path = path.join("processed_data").join(folder);
        fs::create_dir_all(&folder_path)
            .map_err(|e| format!("Failed to create processed_data/{}: {}", folder, e))?;
    }

    // Create references sub-folders - for scientific documentation
    let references_folders = ["articles", "protocols", "manuals"];
    for folder in references_folders.iter() {
        let folder_path = path.join("references").join(folder);
        fs::create_dir_all(&folder_path)
            .map_err(|e| format!("Failed to create references/{}: {}", folder, e))?;
    }

    // Create results sub-folders - for final outputs
    let results_folders = ["analysis_results", "tutorials", "protocols", "examples"];
    for folder in results_folders.iter() {
        let folder_path = path.join("results").join(folder);
        fs::create_dir_all(&folder_path)
            .map_err(|e| format!("Failed to create results/{}: {}", folder, e))?;
    }

    // Create initial README.md
    let readme_path = path.join("README.md");
    let readme_content = format!(
        "# {}\n\n## Description\n{}\n\n## Project Structure\n\n\
        This bioimage analysis project follows the BIOME standard organization:\n\n\
        - **request/**: Contains the initial user request and supporting documentation\n\
          - documents/: Project specifications, requirements, and communication\n\
          - images/: Reference images from the initial request\n\
          - notes/: Project planning and meeting notes\n\n\
        - **sample_data/**: Contains the raw biological images provided for analysis\n\
          - original/: Original unmodified images from the biological sample\n\
          - test_subset/: Small subset of images for testing analysis pipelines\n\n\
        - **processed_data/**: Contains intermediate processing results\n\
          - converted/: Format-converted images (e.g., TIFF to other formats)\n\
          - preprocessed/: Images after initial processing (denoising, calibration)\n\
          - intermediate/: Temporary analysis files and intermediate results\n\n\
        - **references/**: Contains scientific and technical documentation\n\
          - articles/: Relevant scientific papers and literature\n\
          - protocols/: Analysis protocols and methodology documentation\n\
          - manuals/: Software manuals and technical guides\n\n\
        - **scripts/**: Contains all analysis code and automation scripts\n\
          - Analysis pipelines and image processing scripts\n\
          - Custom functions and utilities\n\
          - Batch processing and automation code\n\n\
        - **results/**: Contains final outputs and deliverables\n\
          - analysis_results/: Final quantitative results, measurements, and statistics\n\
          - tutorials/: Step-by-step guides for reproducing the analysis\n\
          - protocols/: Finalized analysis protocols for future use\n\
          - examples/: Example outputs and sample results\n\n\
        ## Usage Notes\n\n\
        1. Place your raw images in `sample_data/original/`\n\
        2. Use `sample_data/test_subset/` for pipeline development\n\
        3. Save intermediate processing steps in `processed_data/`\n\
        4. Document your methodology in `references/protocols/`\n\
        5. Place final results and reports in `results/analysis_results/`\n\n\
        ## Journal\n\n\
        ### {}\n\
        Project created.\n",
        project_name,
        project_description,
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs()
    );

    fs::write(&readme_path, readme_content)
        .map_err(|e| format!("Failed to create README: {}", e))?;

    // Return the timestamp
    Ok(std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs()
        .to_string())
}

// Command to update README.md
#[tauri::command]
fn update_readme_file(
    base_path: String,
    project_name: String,
    project_description: String,
    journal_entries: Vec<serde_json::Value>,
) -> Result<String, String> {
    let path = PathBuf::from(&base_path);
    let readme_path = path.join("README.md");

    // Scan the actual folder structure and get file counts
    let mut folder_status = std::collections::HashMap::new();
    let bioimage_folders = [
        ("request", vec!["documents", "images", "notes"]),
        ("sample_data", vec!["original", "test_subset"]),
        ("processed_data", vec!["converted", "preprocessed", "intermediate"]),
        ("references", vec!["articles", "protocols", "manuals"]),
        ("scripts", vec![]),
        ("results", vec!["analysis_results", "tutorials", "protocols", "examples"]),
    ];

    for (folder_name, subfolders) in &bioimage_folders {
        let folder_path = path.join(folder_name);
        if folder_path.exists() {
            let mut file_count = 0;
            let mut total_size = 0u64;
            
            // Count files in main folder
            if let Ok(entries) = fs::read_dir(&folder_path) {
                for entry in entries.flatten() {
                    if let Ok(metadata) = entry.metadata() {
                        if metadata.is_file() {
                            file_count += 1;
                            total_size += metadata.len();
                        }
                    }
                }
            }
            
            // Count files in subfolders
            let mut subfolder_info = Vec::new();
            for subfolder in subfolders {
                let subfolder_path = folder_path.join(subfolder);
                if subfolder_path.exists() {
                    let mut sub_file_count = 0;
                    let mut sub_total_size = 0u64;
                    
                    if let Ok(entries) = fs::read_dir(&subfolder_path) {
                        for entry in entries.flatten() {
                            if let Ok(metadata) = entry.metadata() {
                                if metadata.is_file() {
                                    sub_file_count += 1;
                                    sub_total_size += metadata.len();
                                    file_count += 1;
                                    total_size += sub_total_size;
                                }
                            }
                        }
                    }
                    
                    if sub_file_count > 0 {
                        let size_str = if sub_total_size > 1024 * 1024 {
                            format!("{:.1} MB", sub_total_size as f64 / (1024.0 * 1024.0))
                        } else if sub_total_size > 1024 {
                            format!("{:.1} KB", sub_total_size as f64 / 1024.0)
                        } else {
                            format!("{} bytes", sub_total_size)
                        };
                        subfolder_info.push(format!("    - {}/: {} files ({})", subfolder, sub_file_count, size_str));
                    } else {
                        subfolder_info.push(format!("    - {}/: empty", subfolder));
                    }
                } else {
                    subfolder_info.push(format!("    - {}/: not created", subfolder));
                }
            }
            
            let size_str = if total_size > 1024 * 1024 {
                format!("{:.1} MB", total_size as f64 / (1024.0 * 1024.0))
            } else if total_size > 1024 {
                format!("{:.1} KB", total_size as f64 / 1024.0)
            } else {
                format!("{} bytes", total_size)
            };
            
            folder_status.insert(folder_name.to_string(), (file_count, size_str, subfolder_info));
        } else {
            folder_status.insert(folder_name.to_string(), (0, "not created".to_string(), vec![]));
        }
    }

    // Generate README content with actual folder status
    let mut readme_content = format!(
        "# {}\n\n## Description\n{}\n\n## Project Structure\n\n\
        This bioimage analysis project follows the BIOME standard organization:\n\n",
        project_name, project_description
    );

    // Add detailed folder information with actual content
    for (folder_name, description, subfolder_descriptions) in [
        ("request", "Contains the initial user request and supporting documentation", vec![
            "documents/: Project specifications, requirements, and communication",
            "images/: Reference images from the initial request", 
            "notes/: Project planning and meeting notes"]),
        ("sample_data", "Contains the raw biological images provided for analysis", vec![
            "original/: Original unmodified images from the biological sample",
            "test_subset/: Small subset of images for testing analysis pipelines"]),
        ("processed_data", "Contains intermediate processing results", vec![
            "converted/: Format-converted images (e.g., TIFF to other formats)",
            "preprocessed/: Images after initial processing (denoising, calibration)",
            "intermediate/: Temporary analysis files and intermediate results"]),
        ("references", "Contains scientific and technical documentation", vec![
            "articles/: Relevant scientific papers and literature",
            "protocols/: Analysis protocols and methodology documentation",
            "manuals/: Software manuals and technical guides"]),
        ("scripts", "Contains all analysis code and automation scripts", vec![]),
        ("results", "Contains final outputs and deliverables", vec![
            "analysis_results/: Final quantitative results, measurements, and statistics",
            "tutorials/: Step-by-step guides for reproducing the analysis",
            "protocols/: Finalized analysis protocols for future use",
            "examples/: Example outputs and sample results"]),
    ] {
        if let Some((file_count, size_str, actual_subfolders)) = folder_status.get(folder_name) {
            readme_content.push_str(&format!(
                "- **{}/**: {} ({} files, {})\n",
                folder_name, description, file_count, size_str
            ));
            
            // Show actual subfolder status if available
            if !actual_subfolders.is_empty() {
                for subfolder_status in actual_subfolders {
                    readme_content.push_str(&format!("  {}\n", subfolder_status));
                }
            } else if !subfolder_descriptions.is_empty() {
                // Show standard descriptions if no actual subfolders scanned
                for sub_desc in subfolder_descriptions {
                    readme_content.push_str(&format!("  - {}\n", sub_desc));
                }
            }
            readme_content.push('\n');
        }
    }

    readme_content.push_str(
        "## Usage Notes\n\n\
        1. Place your raw images in `sample_data/original/`\n\
        2. Use `sample_data/test_subset/` for pipeline development\n\
        3. Save intermediate processing steps in `processed_data/`\n\
        4. Document your methodology in `references/protocols/`\n\
        5. Place final results and reports in `results/analysis_results/`\n\n\
        ## Journal\n\n"
    );

    // Add journal entries
    if !journal_entries.is_empty() {
        for entry in journal_entries {
            if let (Some(date), Some(text)) = (
                entry.get("date").and_then(|d| d.as_str()),
                entry.get("text").and_then(|t| t.as_str()),
            ) {
                readme_content.push_str(&format!("### {}\n{}\n\n", date, text));
            }
        }
    } else {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs();
        readme_content.push_str(&format!("### {}\nREADME updated.\n\n", now));
    }

    // Write README file
    fs::write(&readme_path, readme_content)
        .map_err(|e| format!("Failed to update README: {}", e))?;

    // Return the timestamp
    Ok(std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs()
        .to_string())
}

// Command to scan a project folder
#[tauri::command]
fn scan_project_folder(project_path: String) -> Result<serde_json::Value, String> {
    let path = PathBuf::from(&project_path);

    if !path.exists() || !path.is_dir() {
        return Err(format!("Invalid project path: {}", project_path));
    }

    // Check for bioimage analysis structure
    let expected_folders = ["request", "sample_data", "processed_data", "references", "scripts", "results"];
    let mut valid_structure = true;
    let mut missing_folders = Vec::new();
    let mut folder_details = serde_json::Map::new();

    // Simple implementation to demonstrate the structure
    let mut result = serde_json::json!({
        "path": project_path,
        "folders": [],
        "files": [],
        "structure_valid": false,
        "missing_folders": [],
        "folder_details": {}
    });

    // Check for expected bioimage folders
    for expected_folder in &expected_folders {
        let folder_path = path.join(expected_folder);
        if !folder_path.exists() {
            valid_structure = false;
            missing_folders.push(expected_folder.to_string());
        } else {
            // Count files in this folder and subfolders
            let mut file_count = 0;
            let mut total_size = 0u64;
            
            if let Ok(entries) = fs::read_dir(&folder_path) {
                for entry in entries.flatten() {
                    if let Ok(metadata) = entry.metadata() {
                        if metadata.is_file() {
                            file_count += 1;
                            total_size += metadata.len();
                        } else if metadata.is_dir() {
                            // Count files in subdirectories too
                            if let Ok(sub_entries) = fs::read_dir(entry.path()) {
                                for sub_entry in sub_entries.flatten() {
                                    if let Ok(sub_metadata) = sub_entry.metadata() {
                                        if sub_metadata.is_file() {
                                            file_count += 1;
                                            total_size += sub_metadata.len();
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            
            folder_details.insert(
                expected_folder.to_string(),
                serde_json::json!({
                    "exists": true,
                    "file_count": file_count,
                    "total_size": total_size
                })
            );
        }
    }

    // Read the directory and get the first level of files and folders
    if let Ok(entries) = fs::read_dir(&path) {
        for entry in entries.flatten() {
            let metadata = entry.metadata();
            if let Ok(meta) = metadata {
                let name = entry.file_name().to_string_lossy().to_string();
                let path_str = entry.path().to_string_lossy().to_string();

                if meta.is_dir() {
                    result["folders"]
                        .as_array_mut()
                        .unwrap()
                        .push(serde_json::json!({
                            "name": name,
                            "path": path_str,
                            "is_expected": expected_folders.contains(&name.as_str())
                        }));
                } else {
                    result["files"]
                        .as_array_mut()
                        .unwrap()
                        .push(serde_json::json!({
                            "name": name,
                            "path": path_str,
                            "size": meta.len()
                        }));
                }
            }
        }
    }

    // Update result with structure validation
    result["structure_valid"] = serde_json::Value::Bool(valid_structure);
    result["missing_folders"] = serde_json::Value::Array(
        missing_folders.into_iter().map(serde_json::Value::String).collect()
    );
    result["folder_details"] = serde_json::Value::Object(folder_details);

    Ok(result)
}

// Command to open a folder in the OS file explorer
#[tauri::command]
fn open_in_explorer(path: String) -> Result<(), String> {
    let folder_path = PathBuf::from(&path);
    if !folder_path.exists() {
        return Err(format!("Path does not exist: {}", path));
    }

    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .arg(folder_path)
            .spawn()
            .map_err(|e| format!("Failed to open Explorer: {}", e))?;
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(folder_path)
            .spawn()
            .map_err(|e| format!("Failed to open Finder: {}", e))?;
    }

    #[cfg(all(unix, not(target_os = "macos")))]
    {
        Command::new("xdg-open")
            .arg(folder_path)
            .spawn()
            .map_err(|e| format!("Failed to open file manager: {}", e))?;
    }

    Ok(())
}

// Command to get the application directory
#[tauri::command]
fn get_app_dir() -> String {
    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(dir) = exe_path.parent() {
            return dir.to_string_lossy().to_string();
        }
    }
    String::from(".")
}

// Command to check if a directory exists
#[tauri::command]
fn check_dir_exists(path: String) -> bool {
    let path_buf = PathBuf::from(path);
    path_buf.exists() && path_buf.is_dir()
}

// Command to start the backend server
#[tauri::command]
async fn start_backend_server(
    port: u16,
    backend_path: String,
    node_process: State<'_, NodeProcess>,
) -> Result<u16, String> {
    #[cfg(debug_assertions)]
    let node_path = if cfg!(target_os = "windows") {
        "node.exe"
    } else {
        "node"
    };
    
    #[cfg(not(debug_assertions))]
    let node_path = {
        // In production, use bundled Node.js executable
        if cfg!(target_os = "windows") {
            "node.exe"
        } else {
            "node"
        }
    };

    // Build the path to the backend server.js file
    let server_js_path = PathBuf::from(&backend_path).join("src").join("server.js");

    if !server_js_path.exists() {
        return Err(format!(
            "Backend server.js not found at: {}",
            server_js_path.to_string_lossy()
        ));
    }

    // Start the Node.js server with the specified port
    #[cfg(target_os = "windows")]
    let child = Command::new(node_path)
        .current_dir(&backend_path) // Set working directory to backend path
        .arg(server_js_path)
        .env("PORT", port.to_string())
        .env("TAURI_APP_DATA", &backend_path)
        .creation_flags(0x08000000) // CREATE_NO_WINDOW on Windows
        .spawn();

    #[cfg(not(target_os = "windows"))]
    let child = Command::new(node_path)
        .current_dir(&backend_path) // Set working directory to backend path
        .arg(server_js_path)
        .env("PORT", port.to_string())
        .env("TAURI_APP_DATA", &backend_path)
        .spawn();

    match child {
        Ok(child) => {
            // Store the child process
            let mut process_guard = node_process.0.lock().unwrap();
            *process_guard = Some(child);

            debug_println!("Backend server started on port {}", port);
            Ok(port)
        }
        Err(e) => Err(format!("Failed to start backend server: {}", e)),
    }
}

// Command to stop the backend server
#[tauri::command]
fn stop_backend_server(node_process: State<NodeProcess>) -> Result<(), String> {
    let mut process = node_process.0.lock().unwrap();
    if let Some(mut child) = process.take() {
        match child.kill() {
            Ok(_) => {
                debug_println!("Backend server stopped");
                Ok(())
            }
            Err(e) => Err(format!("Failed to stop backend server: {}", e)),
        }
    } else {
        // No process to stop
        Ok(())
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(NodeProcess(Arc::new(Mutex::new(None))))
        // Ensure backend child process is terminated on window close to avoid orphaned processes/port contention
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                let process_state = window.state::<NodeProcess>();
                let mut guard = process_state.0.lock().unwrap();
                if let Some(mut child) = guard.take() {
                    let _ = child.kill();
                    debug_println!("Stopped backend process on window close");
                }
            }
        })
        .setup(|app| {
            debug_println!("Setting up BIOME application...");

            // Get the app's data directory
            let app_dir = app.path().app_data_dir()
                .unwrap_or_else(|_| {
                    let fallback = PathBuf::from(".");
                    debug_println!("Warning: Could not get app data directory, using fallback: {}", fallback.display());
                    fallback
                });

            // Create the app data directory if it doesn't exist
            if !app_dir.exists() {
                fs::create_dir_all(&app_dir).unwrap_or_else(|e| {
                    debug_println!("Warning: Could not create app data directory: {}", e);
                });
            }

            // In development, let the frontend launcher manage the backend to avoid double-start
            #[cfg(debug_assertions)]
            {
                debug_println!("Development mode: skipping Rust auto-start of backend; frontend launcher will manage it.");
                // Still prepare app data dir and env for consistency
                let app_dir = app.path().app_data_dir()
                    .unwrap_or_else(|_| PathBuf::from("."));
                if !app_dir.exists() {
                    let _ = fs::create_dir_all(&app_dir);
                }
                std::env::set_var("TAURI_APP_DATA", app_dir.to_string_lossy().to_string());
                std::env::set_var("NODE_ENV", "production");
            }

            // Determine backend path based on build type (production only)
            #[cfg(not(debug_assertions))]
            let backend_path = {
                // Production mode - look for bundled backend
                debug_println!("Production mode: Looking for bundled backend");
                // For production builds, the resource directory should be relative to the app directory
                // On Windows, this should be the directory containing BIOME.exe
                let app_exe_dir = std::env::current_exe()
                    .unwrap_or_else(|_| app_dir.join("BIOME.exe"))
                    .parent()
                    .unwrap_or(&app_dir)
                    .to_path_buf();
                
                debug_println!("App executable directory: {}", app_exe_dir.display());
                
                // Look for backend in resources subdirectory
                let backend_in_resources = app_exe_dir.join("resources").join("backend");
                if backend_in_resources.exists() && backend_in_resources.join("src").join("server.js").exists() {
                    debug_println!("✅ Found backend in resources: {}", backend_in_resources.display());
                    backend_in_resources
                } else {
                    debug_println!("Backend not found in resources, trying other locations");
                    
                    // Try other possible locations
                    let other_locations = vec![
                        app_exe_dir.join("backend"),
                        app_dir.join("backend"),
                        app_dir.parent().unwrap_or(&app_dir).join("backend"),
                    ];
                    
                    let mut found_backend = None;
                    for location in &other_locations {
                        if location.exists() && location.join("src").join("server.js").exists() {
                            debug_println!("✅ Found backend at: {}", location.display());
                            found_backend = Some(location.clone());
                            break;
                        }
                    }
                    
                    found_backend.unwrap_or_else(|| {
                        debug_println!("❌ Backend not found in any expected location");
                        debug_println!("Searched locations:");
                        debug_println!("  - {}", backend_in_resources.display());
                        for location in other_locations {
                            debug_println!("  - {}", location.display());
                        }
                        // Return the expected location anyway
                        backend_in_resources
                    })
                }
            };

            #[cfg(not(debug_assertions))]
            debug_println!("Backend path: {}", backend_path.display());
            #[cfg(not(debug_assertions))]
            debug_println!("App data directory: {}", app_dir.display());

            // Set environment variables for the backend (production only)
            #[cfg(not(debug_assertions))]
            {
                std::env::set_var("TAURI_APP_DATA", app_dir.to_string_lossy().to_string());
                std::env::set_var("NODE_ENV", "production");
            }

            // Get the NodeProcess state (production only)
            #[cfg(not(debug_assertions))]
            let node_process_state = app.state::<NodeProcess>();

            // Start the backend server
            #[cfg(not(debug_assertions))]
            let node_path = {
                // In production, look for Node.js in the installation directory (same as BIOME.exe)
                let app_exe_dir = std::env::current_exe()
                    .unwrap_or_else(|_| app_dir.join("BIOME.exe"))
                    .parent()
                    .unwrap_or(&app_dir)
                    .to_path_buf();
                
                // Try different possible locations and names
                let possible_node_paths = vec![
                    app_exe_dir.join("node-x86_64-pc-windows-msvc.exe"),  // Target triple version (from externalBin)
                    app_exe_dir.join("node.exe"),                          // Regular version
                    app_exe_dir.join("bin").join("node-x86_64-pc-windows-msvc.exe"),
                    app_exe_dir.join("bin").join("node.exe"),
                    app_dir.join("node-x86_64-pc-windows-msvc.exe"),       // Fallback to app data dir
                    app_dir.join("node.exe"),
                ];
                
                let mut found_node_path = None;
                for path in &possible_node_paths {
                    if path.exists() {
                        debug_println!("✅ Found Node.js at: {}", path.display());
                        found_node_path = Some(path.to_string_lossy().to_string());
                        break;
                    }
                }
                
                found_node_path.unwrap_or_else(|| {
                    debug_println!("❌ No bundled Node.js found!");
                    debug_println!("Expected locations:");
                    for path in possible_node_paths {
                        debug_println!("  - {}", path.display());
                    }
                    debug_println!("Falling back to system Node.js");
                    "node.exe".to_string()
                })
            };

            // Build the path to the backend server.js file
            #[cfg(not(debug_assertions))]
            let server_js_path = backend_path.join("src").join("server.js");

            #[cfg(not(debug_assertions))]
            if !server_js_path.exists() {
                debug_println!(
                    "Warning: Backend server.js not found at: {}",
                    server_js_path.display()
                );
                debug_println!("Application will continue without backend server");
                debug_println!("Expected backend structure:");
                debug_println!("  {}/src/server.js", backend_path.display());
                return Ok(());
            }

            // If a backend is already running on the expected port, reuse it instead of spawning a new one
            #[cfg(not(debug_assertions))]
            let already_running = match std::process::Command::new("curl")
                .args(&["-s", "-o", "/dev/null", "-w", "%{http_code}", "http://localhost:3001/api/test"])
                .output()
            {
                Ok(output) => {
                    let status_code = String::from_utf8_lossy(&output.stdout).to_string();
                    status_code.trim() == "200"
                }
                Err(_) => false,
            };

            #[cfg(not(debug_assertions))]
            if already_running {
                println!("ℹ️ Backend already running at http://localhost:3001; reusing existing instance.");
                return Ok(());
            }

            #[cfg(not(debug_assertions))]
            println!("Starting Node.js backend server...");
            #[cfg(not(debug_assertions))]
            println!("Node path: {}", node_path);
            #[cfg(not(debug_assertions))]
            println!("Server.js path: {}", server_js_path.display());
            #[cfg(not(debug_assertions))]
            println!("Working directory: {}", backend_path.display());

            // Create log file for backend output (production only)
            #[cfg(not(debug_assertions))]
            let log_dir = app_dir.join("logs");
            #[cfg(not(debug_assertions))]
            if !log_dir.exists() {
                let _ = fs::create_dir_all(&log_dir);
            }
            #[cfg(not(debug_assertions))]
            let log_file = log_dir.join("backend_startup.log");
            
            // Start the Node.js server with enhanced logging and no console window
            #[cfg(all(not(debug_assertions), target_os = "windows"))]
            let command_result = Command::new(&node_path)
                .current_dir(&backend_path)
                .arg(&server_js_path)
                .env("PORT", "3001")
                .env("NODE_ENV", "production")
                .env("TAURI_APP_DATA", app_dir.to_string_lossy().to_string())
                .env("DEBUG", "biome:*")
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .creation_flags(0x08000000) // CREATE_NO_WINDOW on Windows
                .spawn();

            #[cfg(all(not(debug_assertions), not(target_os = "windows")))]
            let command_result = Command::new(&node_path)
                .current_dir(&backend_path)
                .arg(&server_js_path)
                .env("PORT", "3001")
                .env("NODE_ENV", "production")
                .env("TAURI_APP_DATA", app_dir.to_string_lossy().to_string())
                .env("DEBUG", "biome:*")
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .spawn();

            #[cfg(not(debug_assertions))]
            match command_result
            {
                Ok(mut child) => {
                    println!("✅ Backend server process started successfully");
                    
                    // Capture stdout/stderr for logging
                    if let Some(stdout) = child.stdout.take() {
                        let log_file_clone = log_file.clone();
                        std::thread::spawn(move || {
                            let reader = BufReader::new(stdout);
                            let mut log_content = String::new();
                            for line in reader.lines() {
                                if let Ok(line) = line {
                                    println!("BACKEND STDOUT: {}", line);
                                    log_content.push_str(&format!("[STDOUT] {}\n", line));
                                }
                            }
                            let _ = fs::write(log_file_clone, log_content);
                        });
                    }
                    
                    if let Some(stderr) = child.stderr.take() {
                        let log_file_clone = log_file.clone();
                        std::thread::spawn(move || {
                            let reader = BufReader::new(stderr);
                            let mut log_content = String::new();
                            for line in reader.lines() {
                                if let Ok(line) = line {
                                    println!("BACKEND STDERR: {}", line);
                                    log_content.push_str(&format!("[STDERR] {}\n", line));
                                }
                            }
                            if !log_content.is_empty() {
                                let _ = OpenOptions::new()
                                    .create(true)
                                    .append(true)
                                    .open(log_file_clone)
                                    .and_then(|mut file| file.write_all(log_content.as_bytes()));
                            }
                        });
                    }
                    
                    // Store the child process
                    let mut process_guard = node_process_state.0.lock().unwrap();
                    *process_guard = Some(child);
                    
                    println!("🌐 Backend server should be available at: http://localhost:3001");
                    println!("📋 Log file: {}", log_file.display());
                    
                    // Wait a moment and test the connection
                    std::thread::sleep(std::time::Duration::from_secs(2));
                    
                    match std::process::Command::new("curl")
                        .args(&["-s", "-w", "%{http_code}", "http://localhost:3001/api/test"])
                        .output()
                    {
                        Ok(output) => {
                            let status = String::from_utf8_lossy(&output.stdout);
                            if status.contains("200") {
                                println!("✅ Backend server is responding correctly");
                            } else {
                                println!("⚠️ Backend server started but not responding properly (status: {})", status);
                            }
                        }
                        Err(e) => {
                            println!("⚠️ Could not test backend connection: {}", e);
                        }
                    }
                }
                Err(e) => {
                    println!("❌ Failed to start backend server: {}", e);
                    println!("📋 Error details:");
                    #[cfg(not(debug_assertions))]
                    println!("   - Node path: {}", node_path);
                    #[cfg(not(debug_assertions))]
                    println!("   - Working dir: {}", backend_path.display());
                    #[cfg(not(debug_assertions))]
                    println!("   - Server.js: {}", server_js_path.display());
                    
                    // Write error to log file
                    let error_log = format!(
                        "Backend startup failed at {}\nNode path: {}\nWorking dir: {}\nServer.js: {}\nError: {}\n",
                        chrono::Utc::now().to_rfc3339(),
                        "(debug build)",
                        app_dir.display(),
                        "(debug build)",
                        e
                    );
                    let _ = fs::write(log_file, error_log);
                    
                    println!("Application will continue in frontend-only mode");
                    println!("Check the log file for more details: {}", log_dir.join("backend_startup.log").display());
                }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            validate_project_folder,
            create_folder_structure,
            update_readme_file,
            scan_project_folder,
            open_in_explorer,
            get_app_dir,
            check_dir_exists,
            start_backend_server,
            stop_backend_server,
            check_backend_status,
            get_debug_info,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
