# Contributing

## Windows Context Menu

You can install the "Open Forge Terminal Here" context menu entry from the Settings panel (Session section).

The context menu registers two entries:
- **Folder background** (right-click on empty space) — uses `%V`
- **Folder** (right-click on a folder) — uses `%1`

Forge reads the path from the first command-line argument (`args[1]`), following the same pattern as GitPop and Windows Terminal.

### Manual Registry

If you prefer to install manually, edit `forge-context-menu.reg`, replace `REPLACE_WITH_FULL_PATH_TO` with the actual path to `forge.exe`, then:

```cmd
regedit /s forge-context-menu.reg
```

### How it works

```
"Forge.exe" "%V"
```

`%V` expands to the folder path in Explorer. Forge captures this as `args[1]` in `get_current_dir()` and passes it to the terminal session on startup. The `tauri-plugin-single-instance` forwards the args to the running instance via the `new-instance` event.
