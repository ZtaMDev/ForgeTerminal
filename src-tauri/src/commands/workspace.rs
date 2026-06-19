use std::path::PathBuf;
use tokio::fs;

fn get_config_dir() -> Result<PathBuf, String> {
    let home = std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))
        .map_err(|_| "Could not determine home directory".to_string())?;

    Ok(PathBuf::from(home).join(".config").join("forge"))
}

fn get_workspace_path(cwd: &str) -> PathBuf {
    let cwd_path = PathBuf::from(cwd);
    cwd_path.join(".config").join("workspace.forge.json")
}

#[tauri::command]
pub async fn workspace_load(cwd: String) -> Result<Option<String>, String> {
    let path = get_workspace_path(&cwd);

    if !path.exists() {
        return Ok(None);
    }

    let content = fs::read_to_string(&path)
        .await
        .map_err(|e| format!("Failed to read workspace: {}", e))?;

    Ok(Some(content))
}

#[tauri::command]
pub async fn workspace_save(cwd: String, state: String) -> Result<(), String> {
    let path = get_workspace_path(&cwd);

    // Ensure .config directory exists
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .await
            .map_err(|e| format!("Failed to create config directory: {}", e))?;
    }

    fs::write(&path, &state)
        .await
        .map_err(|e| format!("Failed to save workspace: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn config_load() -> Result<Option<String>, String> {
    let config_dir = get_config_dir()?;
    let path = config_dir.join("config.json");

    if !path.exists() {
        return Ok(None);
    }

    let content = fs::read_to_string(&path)
        .await
        .map_err(|e| format!("Failed to read config: {}", e))?;

    Ok(Some(content))
}

#[tauri::command]
pub async fn config_save(config: String) -> Result<(), String> {
    let config_dir = get_config_dir()?;
    let path = config_dir.join("config.json");

    fs::create_dir_all(&config_dir)
        .await
        .map_err(|e| format!("Failed to create config directory: {}", e))?;

    fs::write(&path, &config)
        .await
        .map_err(|e| format!("Failed to save config: {}", e))?;

    Ok(())
}
#[tauri::command]
pub async fn get_process_args() -> Result<Vec<String>, String> {
    Ok(std::env::args().collect())
}
