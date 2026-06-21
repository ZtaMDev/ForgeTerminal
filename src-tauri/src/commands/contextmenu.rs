#[cfg(windows)]
pub fn install_context_menu_inner() -> Result<(), String> {
    use winreg::enums::*;
    use winreg::RegKey;

    let exe_path = std::env::current_exe()
        .map_err(|e| e.to_string())?
        .to_string_lossy()
        .into_owned();

    let hkcu = RegKey::predef(HKEY_CURRENT_USER);

    // Directory background (right-click on empty space in folder)
    let bg_path = r"Software\Classes\Directory\Background\shell\ForgeTerminal";
    let (bg_key, _) = hkcu.create_subkey(bg_path).map_err(|e| e.to_string())?;
    bg_key.set_value("", &"Open Forge Terminal Here").map_err(|e| e.to_string())?;
    bg_key.set_value("Icon", &exe_path).map_err(|e| e.to_string())?;

    let (bg_cmd, _) = bg_key.create_subkey("command").map_err(|e| e.to_string())?;
    bg_cmd.set_value("", &format!("\"{}\" \"%V\"", exe_path)).map_err(|e| e.to_string())?;

    // Directory folder (right-click on a folder)
    let dir_path = r"Software\Classes\Directory\shell\ForgeTerminal";
    let (dir_key, _) = hkcu.create_subkey(dir_path).map_err(|e| e.to_string())?;
    dir_key.set_value("", &"Open Forge Terminal Here").map_err(|e| e.to_string())?;
    dir_key.set_value("Icon", &exe_path).map_err(|e| e.to_string())?;

    let (dir_cmd, _) = dir_key.create_subkey("command").map_err(|e| e.to_string())?;
    dir_cmd.set_value("", &format!("\"{}\" \"%1\"", exe_path)).map_err(|e| e.to_string())?;

    Ok(())
}

#[cfg(windows)]
pub fn uninstall_context_menu_inner() -> Result<(), String> {
    use winreg::enums::*;
    use winreg::RegKey;

    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let _ = hkcu.delete_subkey_all(r"Software\Classes\Directory\Background\shell\ForgeTerminal");
    let _ = hkcu.delete_subkey_all(r"Software\Classes\Directory\shell\ForgeTerminal");
    Ok(())
}

#[cfg(not(windows))]
pub fn install_context_menu_inner() -> Result<(), String> {
    Err("Context menu installation is only supported on Windows".to_string())
}

#[cfg(not(windows))]
pub fn uninstall_context_menu_inner() -> Result<(), String> {
    Err("Context menu uninstallation is only supported on Windows".to_string())
}

#[tauri::command]
pub fn install_context_menu() -> Result<(), String> {
    install_context_menu_inner()
}

#[tauri::command]
pub fn uninstall_context_menu() -> Result<(), String> {
    uninstall_context_menu_inner()
}

#[tauri::command]
pub fn is_context_menu_installed() -> Result<bool, String> {
    #[cfg(windows)]
    {
        use winreg::enums::*;
        use winreg::RegKey;
        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        match hkcu.open_subkey(r"Software\Classes\Directory\Background\shell\ForgeTerminal\command") {
            Ok(_) => Ok(true),
            Err(_) => Ok(false),
        }
    }
    #[cfg(not(windows))]
    {
        Ok(false)
    }
}
