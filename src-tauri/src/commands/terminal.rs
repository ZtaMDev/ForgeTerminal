use crate::state::{AppState, PtySession};
use portable_pty::{native_pty_system, CommandBuilder, PtySize};
use serde::Serialize;
use std::io::{Read, Write};
use std::sync::{Arc, Mutex};
use tauri::{Emitter, State};

#[derive(Serialize, Clone)]
pub struct PtySpawnResult {
    pub process_id: i32,
    pub cwd: String,
}

#[derive(Serialize, Clone)]
struct PtyDataPayload {
    id: String,
    data: String,
}

#[derive(Serialize, Clone)]
struct PtyExitPayload {
    id: String,
    code: i32,
}

#[derive(Serialize, Clone)]
struct PtyErrorPayload {
    id: String,
    message: String,
}

#[tauri::command]
pub fn pty_spawn(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
    id: String,
    shell: String,
    cwd: String,
    cols: u16,
    rows: u16,
) -> Result<PtySpawnResult, String> {
    let pty_system = native_pty_system();
    let size = PtySize {
        rows,
        cols,
        pixel_width: 0,
        pixel_height: 0,
    };

    let pair = pty_system
        .openpty(size)
        .map_err(|e| format!("Failed to open PTY: {}", e))?;

    let mut cmd = CommandBuilder::new(&shell);
    let shell_lower = shell.to_lowercase();
    if shell_lower.contains("powershell") || shell_lower.contains("pwsh") {
        cmd.arg("-NoLogo");
    } else if shell_lower.contains("cmd.exe") || shell_lower.ends_with("cmd") {
        cmd.args(["/k", "cls"]);
    }
    let actual_cwd = if cwd.is_empty() {
        // Default to user's home directory
        let home = std::env::var("USERPROFILE")
            .or_else(|_| std::env::var("HOME"))
            .unwrap_or_else(|_| ".".to_string());
        cmd.cwd(std::path::Path::new(&home));
        home
    } else {
        cmd.cwd(std::path::Path::new(&cwd));
        cwd
    };

    let child = pair
        .slave
        .spawn_command(cmd)
        .map_err(|e| format!("Failed to spawn command: {}", e))?;

    let child_pid = child.process_id();

    let reader = pair
        .master
        .try_clone_reader()
        .map_err(|e| format!("Failed to clone reader: {}", e))?;

    let writer = pair
        .master
        .take_writer()
        .map_err(|e| format!("Failed to get writer: {}", e))?;

    let writer = Arc::new(Mutex::new(writer));
    let master = Arc::new(Mutex::new(pair.master));
    let child = Arc::new(Mutex::new(child));

    let app_handle = app.clone();
    let session_id = id.clone();

    // Reader thread: PTY -> JS
    std::thread::spawn(move || {
        let mut buf = [0u8; 65536];
        let mut reader = reader;
        loop {
            match reader.read(&mut buf) {
                Ok(0) => {
                    let _ = app_handle.emit(
                        &format!("pty:{}:exit", session_id),
                        PtyExitPayload {
                            id: session_id.clone(),
                            code: 0,
                        },
                    );
                    break;
                }
                Ok(n) => {
                    let data = String::from_utf8_lossy(&buf[..n]).to_string();
                    let _ = app_handle.emit(
                        &format!("pty:{}:data", session_id),
                        PtyDataPayload {
                            id: session_id.clone(),
                            data,
                        },
                    );
                }
                Err(e) => {
                    let _ = app_handle.emit(
                        &format!("pty:{}:error", session_id),
                        PtyErrorPayload {
                            id: session_id.clone(),
                            message: e.to_string(),
                        },
                    );
                    break;
                }
            }
        }
    });

    let session = PtySession {
        id: id.clone(),
        writer,
        master,
        child,
    };

    let mut sessions = state.sessions.lock().map_err(|e| e.to_string())?;
    sessions.insert(id, session);

    Ok(PtySpawnResult {
        process_id: child_pid.unwrap_or(0) as i32,
        cwd: actual_cwd,
    })
}

#[tauri::command]
pub fn pty_write(state: State<'_, AppState>, id: String, data: String) -> Result<(), String> {
    let sessions = state.sessions.lock().map_err(|e| e.to_string())?;
    let session = sessions
        .get(&id)
        .ok_or_else(|| format!("Session {} not found", id))?;

    let mut writer = session.writer.lock().map_err(|e| e.to_string())?;
    writer
        .write_all(data.as_bytes())
        .map_err(|e| format!("Failed to write to PTY: {}", e))?;
    writer
        .flush()
        .map_err(|e| format!("Failed to flush PTY: {}", e))?;

    Ok(())
}

#[tauri::command]
pub fn pty_resize(
    state: State<'_, AppState>,
    id: String,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    let sessions = state.sessions.lock().map_err(|e| e.to_string())?;
    let session = sessions
        .get(&id)
        .ok_or_else(|| format!("Session {} not found", id))?;

    let master = session.master.lock().map_err(|e| e.to_string())?;
    master
        .resize(PtySize {
            rows,
            cols,
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|e| format!("Failed to resize PTY: {}", e))?;

    Ok(())
}

#[tauri::command]
pub fn pty_kill(state: State<'_, AppState>, id: String) -> Result<(), String> {
    let mut sessions = state.sessions.lock().map_err(|e| e.to_string())?;
    if let Some(session) = sessions.remove(&id) {
        if let Ok(mut child) = session.child.lock() {
            let _ = child.kill();
        }
    }
    Ok(())
}
