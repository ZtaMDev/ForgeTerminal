<div align="center">
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="public/logo.svg">
  <img alt="Forge Terminal Logo" src="public/logo.svg" width="128" height="128">
</picture>
<h1>Forge</h1>
</div>

**Forge** is a modern, high-performance terminal emulator and multiplexer built with Tauri, React, and xterm.js. Run, arrange, and manage multiple terminal sessions in a single, fluid interface with advanced splitting, tabs, and an integrated Web Preview panel.

<table align="center">
<tr>
<td>
<img width="400" alt="EasyHotCorners Screenshot 1" src="https://github.com/user-attachments/assets/4c1d1cf8-0779-455c-80d7-b1794803274d" />
</td>
<td>
<img width="400" alt="EasyHotCorners Screenshot 2" src="https://github.com/user-attachments/assets/b9a186bf-8f48-4c00-bfa0-d7864232719d" />
</td>
</tr>
</table>

## Key Features

- **Advanced Multiplexing & Layouts:** Split panes horizontally or vertically to create complex binary-tree terminal grids. Resize panes effortlessly.
- **Drag & Drop / Keyboard Reordering:** Grab a terminal and drop it on the edges of another to split it, or in the center to swap places. Use `Ctrl+Alt+ArrowKeys` to instantly swap terminal positions without taking your hands off the keyboard.
- **Intelligent Focus Tracking:** Forge remembers your exact active terminal state. Whether you open the Settings panel, trigger the Command Palette, or change tabs, the focus instantly snaps back exactly where you left it so you never miss a keystroke.
- **Web Preview Panel:** Browse the web or read documentation side-by-side with your terminal. Toggle it with `Ctrl+Shift+Y`, move it to the left or right, and automatically route `Ctrl+Click` links from the terminal into the previewer.
- **File Viewer Tabs:** Native support for viewing images and raw files inside their own tabs without leaving the application.
- **Past Sessions Memory:** Access your past terminal paths and quickly launch new sessions exactly where you need them (`Ctrl+Shift+O`).
- **Passthrough Mode & Dynamic Command Key:** Toggle keyboard passthrough (`Ctrl+<cmd>`) to send shortcuts directly to terminal applications (like vim/nano/tmux) without triggering Forge's UI commands. The core `<cmd>` key (default `` ` ``) is fully customizable in the settings, instantly adapting all global shortcuts to fit your exact workflow.
- **Beautiful & Customizable:** Powered by the gorgeous **Catppuccin** color palette. Customize your default shell, font, cursor style, scrollback limits, status bar visibility, animations, and more via a rich built-in settings panel.
- **Developer Mode & Tutorial:** Built-in interactive tutorial for onboarding, and advanced developer modes for configuration resets.

## Keybindings

> [!NOTE]
> Forge uses a dynamic **Command Key** denoted as `<cmd>` in the shortcuts below. By default, this is the backquote (`` ` ``) key. You can completely customize this key in the **Settings** panel (e.g., change it to `m` or `'`) to match your keyboard layout and workflow perfectly.

### Global Shortcuts

| Shortcut            | Action                      |
| ------------------- | --------------------------- |
| `Ctrl + <cmd>`      | Toggle Passthrough Mode     |
| `Ctrl + Shift + <cmd>` | New Terminal                |
| `Ctrl + Alt + <cmd>`| New Terminal at custom Path |
| `Ctrl + Shift + P`  | Command Palette             |
| `Ctrl + ,`          | Open Settings               |
| `Ctrl + Shift + O`  | Past Sessions               |
| `Ctrl + Shift + Y`  | Toggle Web Preview Panel    |

### Tab Management

| Shortcut             | Action           |
| -------------------- | ---------------- |
| `Ctrl + Tab`         | Next Tab         |
| `Ctrl + Shift + Tab` | Previous Tab     |
| `Ctrl + 1` to `9`    | Jump to Tab 1-9  |
| `Alt + ArrowUp/Down` | Reorder Tabs     |
| `Ctrl + Shift + D`   | Duplicate Tab    |
| `Ctrl + Shift + R`   | Rename Tab       |
| `Ctrl + Shift + W`   | Close Entire Tab |

### Pane & Multiplexer

| Shortcut                         | Action                     |
| -------------------------------- | -------------------------- |
| `Ctrl + \`                       | Split Horizontally         |
| `Ctrl + Shift + \`               | Split Vertically           |
| `Ctrl + W`                       | Close current Split / Pane |
| `Ctrl + Shift + ArrowLeft/Right` | Cycle Focus through Splits |
| `Ctrl + Alt + ArrowKeys`         | Swap/Move focused Terminal |
| `Ctrl + Alt + RightClick`        | Drag & Drop a Terminal     |

### Terminal Actions

| Shortcut                | Action                 |
| ----------------------- | ---------------------- |
| `Ctrl + Shift + C`      | Copy Selection         |
| `Ctrl + Shift + V`      | Paste                  |
| `Ctrl + Shift + F`      | Search within Terminal |
| `Ctrl + =` / `Ctrl + -` | Zoom In / Out          |

## Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS, xterm.js, Zustand
- **Backend:** Tauri (Rust)
- **Shell Compatibility:** Windows PowerShell, Cmd, Bash, Zsh, etc.

## Development

```bash
# Install dependencies
bun install

# Run in development mode
bun run tauri dev

# Build for production
bun run tauri build
```

## License

MIT
