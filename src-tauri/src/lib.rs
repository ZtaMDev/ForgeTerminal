mod commands;
mod pty;
mod state;

use state::AppState;
use tauri::Emitter;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_cli::init())
        .plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
            let payload = serde_json::json!({ "args": argv, "cwd": cwd });
            let _ = app.emit("new-instance", payload);
        }))
        .manage(AppState::new())
        .invoke_handler(tauri::generate_handler![
            commands::terminal::pty_spawn,
            commands::terminal::pty_write,
            commands::terminal::pty_resize,
            commands::terminal::pty_kill,
            commands::filesystem::fs_read_dir,
            commands::filesystem::fs_read_file,
            commands::filesystem::fs_read_file_binary,
            commands::filesystem::fs_write_file,
            commands::filesystem::fs_stat,
            commands::filesystem::fs_create_dir,
            commands::filesystem::fs_remove,
            commands::filesystem::fs_rename,
            commands::filesystem::get_default_shell,
            commands::workspace::workspace_load,
            commands::workspace::workspace_save,
            commands::workspace::config_load,
            commands::workspace::config_save,
            commands::workspace::get_process_args,
            commands::window::window_start_drag,
            commands::window::window_minimize,
            commands::window::window_toggle_maximize,
            commands::window::window_close,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
