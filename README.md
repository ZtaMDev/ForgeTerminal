<picture>
  <source media="(prefers-color-scheme: dark)" srcset="public/logo.svg">
  <img alt="Forge Logo" src="public/logo.svg" width="128" height="128">
</picture>

# Forge

**Forge** is a terminal emulator and multiplexer built with Tauri and React.

## Features

- Multi-tab terminal emulator with split panes
- Passthrough mode for keyboard shortcut passthrough
- Command palette for quick actions
- Customizable settings (font, cursor, theme, animations)
- Session persistence and restore
- Developer mode with advanced controls
- Interactive tutorial

## Keybindings

| Shortcut | Action |
|---|---|
| Ctrl+` | Toggle passthrough mode |
| Ctrl+Shift+` | New terminal at path |
| Ctrl+Shift+P | Command palette |
| Ctrl+, | Settings |
| Ctrl+Shift+D | Duplicate tab |
| Ctrl+W | Close pane / tab |
| Ctrl+Shift+ArrowLeft | Previous split |
| Ctrl+Shift+ArrowRight | Next split |

## Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS, xterm.js
- **Backend:** Tauri (Rust)
- **Shell:** Windows PowerShell / Cmd

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Build

```bash
npm run tauri build
```

## License

MIT
