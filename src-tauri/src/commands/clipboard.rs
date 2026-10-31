use arboard::Clipboard;

#[tauri::command]
pub fn clipboard_read_text() -> Result<String, String> {
    let mut clipboard = Clipboard::new().map_err(|e| format!("Failed to access clipboard: {}", e))?;
    clipboard
        .get_text()
        .map_err(|e| format!("Failed to read clipboard: {}", e))
}

#[tauri::command]
pub fn clipboard_write_text(text: String) -> Result<(), String> {
    let mut clipboard = Clipboard::new().map_err(|e| format!("Failed to access clipboard: {}", e))?;
    clipboard
        .set_text(text)
        .map_err(|e| format!("Failed to write clipboard: {}", e))
}

