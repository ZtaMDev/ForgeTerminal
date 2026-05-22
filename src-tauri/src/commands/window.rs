use tauri::Manager;

#[tauri::command]
pub async fn window_start_drag(app: tauri::AppHandle) -> Result<(), String> {
    app.get_webview_window("main")
        .ok_or("main window not found")?
        .start_dragging()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn window_minimize(app: tauri::AppHandle) -> Result<(), String> {
    app.get_webview_window("main")
        .ok_or("main window not found")?
        .minimize()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn window_maximize(app: tauri::AppHandle) -> Result<(), String> {
    app.get_webview_window("main")
        .ok_or("main window not found")?
        .maximize()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn window_unmaximize(app: tauri::AppHandle) -> Result<(), String> {
    app.get_webview_window("main")
        .ok_or("main window not found")?
        .unmaximize()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn window_toggle_maximize(app: tauri::AppHandle) -> Result<(), String> {
    let win = app
        .get_webview_window("main")
        .ok_or("main window not found")?;
    if win.is_maximized().map_err(|e| e.to_string())? {
        win.unmaximize().map_err(|e| e.to_string())?;
    } else {
        win.maximize().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn window_close(app: tauri::AppHandle) -> Result<(), String> {
    app.get_webview_window("main")
        .ok_or("main window not found")?
        .close()
        .map_err(|e| e.to_string())
}
