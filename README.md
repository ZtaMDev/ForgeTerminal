<picture>
  <source media="(prefers-color-scheme: dark)" srcset="public/logo.svg">
  <img alt="Forge Logo" src="public/logo.svg" width="128" height="128">
</picture>

# Forge

**Forge** is a terminal emulator and multiplexer built with Tauri and React. Run and manage multiple terminal sessions in one window with split panes, tabs, and a powerful command palette.

## Features

- Multi-tab terminal emulator with split panes
- Open terminal sessions in any path via CLI (`forge <path>`) or the path dialog
- Past Sessions history with keyboard-navigable menu (`Ctrl+Shift+O`)
- Passthrough mode for keyboard shortcut passthrough
- Command palette for quick actions (`Ctrl+Shift+P`)
- Customizable settings (font, cursor, theme, animations)
- Session persistence and restore
- Developer mode with advanced controls
- Interactive tutorial

## Keybindings

| Shortcut | Action |
|---|---|
| Ctrl+` | Toggle passthrough mode |
| Ctrl+Shift+` | New terminal |
| Ctrl+Alt+` | New terminal at path |
| Ctrl+Shift+P | Command palette |
| Ctrl+Shift+O | Past Sessions |
| Ctrl+, | Settings |
| Ctrl+Shift+D | Duplicate tab |
| Ctrl+W | Close pane / tab |
| Ctrl+\ | Split horizontally |
| Ctrl+Shift+\ | Split vertically |
| Ctrl+Shift+ArrowLeft | Previous split |
| Ctrl+Shift+ArrowRight | Next split |

## Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS, xterm.js
- **Backend:** Tauri (Rust)
- **Shell:** Windows PowerShell / Cmd

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
