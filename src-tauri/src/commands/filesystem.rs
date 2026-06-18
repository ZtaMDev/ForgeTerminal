use serde::Serialize;
use std::path::Path;
use tokio::fs;

fn base64_encode(data: &[u8]) -> String {
    const CHARS: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut result = String::new();
    for chunk in data.chunks(3) {
        let b0 = chunk[0] as u32;
        let b1 = chunk.get(1).copied().unwrap_or(0) as u32;
        let b2 = chunk.get(2).copied().unwrap_or(0) as u32;
        let triple = (b0 << 16) | (b1 << 8) | b2;
        result.push(CHARS[((triple >> 18) & 0x3F) as usize] as char);
        result.push(CHARS[((triple >> 12) & 0x3F) as usize] as char);
        if chunk.len() > 1 {
            result.push(CHARS[((triple >> 6) & 0x3F) as usize] as char);
        } else {
            result.push('=');
        }
        if chunk.len() > 2 {
            result.push(CHARS[(triple & 0x3F) as usize] as char);
        } else {
            result.push('=');
        }
    }
    result
}

#[derive(Serialize)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub size: u64,
    pub modified_at: String,
}

#[tauri::command]
pub async fn fs_read_dir(path: String) -> Result<Vec<FileEntry>, String> {
    let mut entries = Vec::new();
    let mut read_dir = fs::read_dir(&path)
        .await
        .map_err(|e| format!("Failed to read directory: {}", e))?;

    while let Some(entry) = read_dir
        .next_entry()
        .await
        .map_err(|e| format!("Failed to read entry: {}", e))?
    {
        let metadata = entry
            .metadata()
            .await
            .map_err(|e| format!("Failed to read metadata: {}", e))?;

        let modified = metadata
            .modified()
            .ok()
            .map(|t| {
                let duration = t.duration_since(std::time::UNIX_EPOCH).unwrap_or_default();
                let secs = duration.as_secs();
                // Simple ISO-like format
                format_timestamp(secs)
            })
            .unwrap_or_default();

        entries.push(FileEntry {
            name: entry.file_name().to_string_lossy().to_string(),
            path: entry.path().to_string_lossy().to_string(),
            is_dir: metadata.is_dir(),
            size: metadata.len(),
            modified_at: modified,
        });
    }

    // Sort directories first, then by name
    entries.sort_by(|a, b| {
        if a.is_dir != b.is_dir {
            b.is_dir.cmp(&a.is_dir)
        } else {
            a.name.to_lowercase().cmp(&b.name.to_lowercase())
        }
    });

    Ok(entries)
}

#[tauri::command]
pub async fn fs_read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path)
        .await
        .map_err(|e| format!("Failed to read file: {}", e))
}

#[tauri::command]
pub async fn fs_read_file_binary(path: String) -> Result<String, String> {
    let data = fs::read(&path)
        .await
        .map_err(|e| format!("Failed to read file: {}", e))?;
    Ok(base64_encode(&data))
}

#[tauri::command]
pub async fn fs_write_file(path: String, content: String) -> Result<(), String> {
    fs::write(&path, &content)
        .await
        .map_err(|e| format!("Failed to write file: {}", e))
}

#[tauri::command]
pub async fn fs_stat(path: String) -> Result<FileEntry, String> {
    let metadata = fs::metadata(&path)
        .await
        .map_err(|e| format!("Failed to stat: {}", e))?;

    let modified = metadata
        .modified()
        .ok()
        .map(|t| {
            let duration = t.duration_since(std::time::UNIX_EPOCH).unwrap_or_default();
            format_timestamp(duration.as_secs())
        })
        .unwrap_or_default();

    let path = Path::new(&path);
    Ok(FileEntry {
        name: path
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_default(),
        path: path.to_string_lossy().to_string(),
        is_dir: metadata.is_dir(),
        size: metadata.len(),
        modified_at: modified,
    })
}

#[tauri::command]
pub async fn fs_create_dir(path: String) -> Result<(), String> {
    fs::create_dir_all(&path)
        .await
        .map_err(|e| format!("Failed to create directory: {}", e))
}

#[tauri::command]
pub async fn fs_remove(path: String) -> Result<(), String> {
    let metadata = fs::metadata(&path)
        .await
        .map_err(|e| format!("Failed to stat: {}", e))?;

    if metadata.is_dir() {
        fs::remove_dir_all(&path)
            .await
            .map_err(|e| format!("Failed to remove directory: {}", e))
    } else {
        fs::remove_file(&path)
            .await
            .map_err(|e| format!("Failed to remove file: {}", e))
    }
}

#[tauri::command]
pub async fn fs_rename(old_path: String, new_path: String) -> Result<(), String> {
    fs::rename(&old_path, &new_path)
        .await
        .map_err(|e| format!("Failed to rename: {}", e))
}

#[tauri::command]
pub fn get_default_shell() -> String {
    #[cfg(target_os = "windows")]
    {
        let pwsh_path = "C:\\Program Files\\PowerShell\\7\\pwsh.exe";
        if Path::new(pwsh_path).exists() {
            return pwsh_path.to_string();
        }
        let system_root = std::env::var("SYSTEMROOT").unwrap_or_else(|_| "C:\\Windows".to_string());
        let ps_path = format!(
            "{}\\System32\\WindowsPowerShell\\v1.0\\powershell.exe",
            system_root
        );
        if Path::new(&ps_path).exists() {
            return ps_path;
        }
        "cmd.exe".to_string()
    }
    #[cfg(target_os = "linux")]
    {
        let shells = ["/bin/zsh", "/bin/bash", "/bin/sh"];
        for shell in &shells {
            if Path::new(shell).exists() {
                return shell.to_string();
            }
        }
        "bash".to_string()
    }
    #[cfg(target_os = "macos")]
    {
        "/bin/zsh".to_string()
    }
}

fn format_timestamp(secs: u64) -> String {
    // Simple timestamp formatting
    let days = secs / 86400;
    let hours = (secs % 86400) / 3600;
    let minutes = (secs % 3600) / 60;
    let seconds = secs % 60;

    format!(
        "{:04}-{:02}-{:02}T{:02}:{:02}:{:02}Z",
        days / 365 + 1970,
        (days % 365) / 30 + 1,
        days % 30 + 1,
        hours,
        minutes,
        seconds
    )
}
