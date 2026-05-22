# Forge - Plan de Desarrollo

## Terminal Emulator + Multiplexer + Editor

---

## 1. Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Frontend** | React 19 + TypeScript + Vite |
| **UI Kit** | Tailwind CSS 4 + shadcn/ui |
| **Animaciones** | Framer Motion (desactivables en config) |
| **Estado** | Zustand v5 |
| **Terminal** | @xterm/xterm v6 + @xterm/addon-fit + @xterm/addon-webgl + @xterm/addon-search |
| **PTY (Rust)** | portable-pty (crate de WezTerm) + tokio |
| **Editor** | @uiw/react-codemirror v4 (CodeMirror 6) |
| **Lenguajes editor** | @codemirror/lang-* (todos los disponibles) + @codemirror/language-data (auto-detect) |
| **Tema** | Catppuccin Mocha (custom) + sintaxis adaptada |
| **Icons** | Lucide React |
| **File Tree** | Custom (virtual scrolling con react-window) |
| **Backend** | Rust + Tauri 2.0 + Tokio |
| **Formateo** | Biome |
| **Testing** | Vitest + Testing Library |

---

## 2. Estructura del Proyecto

```
forge/
├── src/                          # Frontend React
│   ├── components/
│   │   ├── layout/
│   │   │   ├── MainLayout.tsx        # Layout principal con paneles
│   │   │   ├── TitleBar.tsx          # Titlebar custom (frameless)
│   │   │   └── PanelResizer.tsx      # Divisor redimensionable
│   │   ├── terminal/
│   │   │   ├── TerminalInstance.tsx   # Wrapper xterm.js + PTY
│   │   │   ├── TerminalTab.tsx       # Contenido de tab de terminal
│   │   │   ├── SplitTerminal.tsx     # División horizontal/vertical
│   │   │   └── TerminalContextMenu.tsx
│   │   ├── explorer/
│   │   │   ├── FileExplorer.tsx      # Panel lateral del explorer
│   │   │   ├── FileTree.tsx          # Árbol de directorios virtualizado
│   │   │   ├── TreeNode.tsx          # Nodo individual del árbol
│   │   │   └── ExplorerContextMenu.tsx
│   │   ├── editor/
│   │   │   ├── CodeMirrorEditor.tsx  # Editor CodeMirror 6
│   │   │   ├── EditorTab.tsx         # Contenido de tab de editor
│   │   │   └── EditorContextMenu.tsx
│   │   ├── viewer/
│   │   │   ├── ImageViewer.tsx       # Visor de imágenes
│   │   │   └── RawViewer.tsx         # Visor raw (hex/text)
│   │   ├── tabs/
│   │   │   ├── TabBar.tsx            # Barra de tabs superior
│   │   │   └── Tab.tsx               # Tab individual (icono + nombre + cerrar)
│   │   ├── statusbar/
│   │   │   ├── StatusBar.tsx         # Barra de estado inferior
│   │   │   ├── TerminalStatus.tsx    # Info de terminal activa
│   │   │   └── EditorStatus.tsx      # Info de editor activo
│   │   ├── settings/
│   │   │   ├── SettingsModal.tsx     # Modal de configuración
│   │   │   ├── ThemeEditor.tsx       # Personalización de tema
│   │   │   └── ShortcutEditor.tsx    # Editor de atajos
│   │   └── common/
│   │       ├── CommandPalette.tsx    # Paleta de comandos (Ctrl+Shift+P)
│   │       ├── QuickOpen.tsx         # Abrir rápido (Ctrl+P)
│   │       ├── KeyboardShortcutModal.tsx
│   │       ├── ContextMenu.tsx       # Menu contextual genérico
│   │       ├── Button.tsx
│   │       ├── Tooltip.tsx
│   │       └── Icon.tsx
│   ├── hooks/
│   │   ├── useTerminal.ts           # Hook para conectar xterm + PTY
│   │   ├── useExplorer.ts           # Hook para el file explorer
│   │   ├── useFileSystem.ts         # Operaciones fs via Tauri
│   │   ├── useKeyboardShortcuts.ts  # Gestión global de shortcuts
│   │   ├── useResizeObserver.ts     # Observar resize de paneles
│   │   ├── useTheme.ts              # Hook de tema
│   │   ├── useConfig.ts             # Hook de configuración
│   │   ├── useDragDrop.ts           # Drag & drop de tabs
│   │   └── useWorkspace.ts          # Persistencia de workspace
│   ├── stores/
│   │   ├── terminalStore.ts         # Estado de terminales activas
│   │   ├── editorStore.ts           # Estado de editores abiertos
│   │   ├── explorerStore.ts         # Estado del explorer
│   │   ├── tabStore.ts              # Estado de tabs (orden, activa)
│   │   ├── configStore.ts           # Configuración global
│   │   ├── shortcutStore.ts         # Mapa de shortcuts
│   │   └── workspaceStore.ts        # Estado del workspace
│   ├── lib/
│   │   ├── ipc.ts                   # Comandos Tauri tipados
│   │   ├── themes.ts                # Definiciones de temas
│   │   ├── shortcuts.ts             # Shortcuts por defecto
│   │   ├── languages.ts             # Mapa de lenguajes CodeMirror
│   │   ├── colorUtils.ts            # Utilidades de color
│   │   └── utils.ts                 # Funciones helper
│   ├── types/
│   │   ├── terminal.ts              # Tipos de terminal
│   │   ├── editor.ts                # Tipos de editor
│   │   ├── config.ts                # Tipos de configuración
│   │   └── workspace.ts             # Tipos de workspace
│   ├── styles/
│   │   ├── globals.css              # Variables CSS, reset, fuente
│   │   ├── terminal.css             # Estilos xterm.js
│   │   ├── editor.css               # Estilos CodeMirror
│   │   ├── explorer.css             # Estilos file tree
│   │   └── animations.css           # Clases de animación
│   ├── App.tsx
│   └── main.tsx
├── src-tauri/
│   ├── src/
│   │   ├── main.rs                  # Entry point
│   │   ├── lib.rs                   # Builder de Tauri
│   │   ├── commands/
│   │   │   ├── mod.rs
│   │   │   ├── terminal.rs          # Comandos: spawn, resize, write, kill
│   │   │   ├── filesystem.rs        # Comandos: readDir, readFile, writeFile, stat
│   │   │   └── workspace.rs         # Comandos: loadWorkspace, saveWorkspace
│   │   ├── pty/
│   │   │   ├── mod.rs
│   │   │   └── manager.rs           # PTY session manager
│   │   └── state.rs                 # Estado compartido de Rust
│   ├── Cargo.toml
│   └── tauri.conf.json
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── components.json                  # Config shadcn/ui
└── plan.md
```

---

## 3. Arquitectura General

### 3.1 Layout Principal

```
┌─────────────────────────────────────────────────────┐
│ [TitleBar - custom frameless]                        │
├─────────────────────────────────────────────────────┤
│ [TabBar - tabs de terminal/editor/viewer]            │
├──────────┬──────────────────────────────────────────┤
│          │                                          │
│ Explorer │      Central Panel                       │
│ (izq/der) │  ┌──────────────────────────────┐       │
│           │  │  Terminal / Editor / Viewer   │       │
| Archivos  │  │                              │       │
│ actuales  │  │  O Split Terminal (2 lados)   │       │
│           │  └──────────────────────────────┘       │
│ PIN 🔒   │                                          │
├──────────┴──────────────────────────────────────────┤
│ [StatusBar - info contextual + shortcuts]            │
└─────────────────────────────────────────────────────┘
```

### 3.2 Data Flow

```
┌──────────────┐     Tauri IPC (invoke)     ┌─────────────────┐
│  React UI    │ ◄═══════════════════════►   │   Rust Backend  │
│  (xterm.js)  │                             │                 │
│  (CodeMirror)│  Commands:                  │  portable-pty   │
│  (FileTree)  │  - pty.spawn               │  (PTY sessions) │
│              │  - pty.write                │                 │
│  Stores:     │  - pty.resize               │  filesystem     │
│  Zustand     │  - fs.readDir               │  (tokio::fs)    │
│              │  - fs.readFile              │                 │
│              │  - workspace.save           │  workspace.json │
│              │                             │                 │
│  Events:     │  Tauri Events (emit)        │                 │
│  - onData    │  ◄═══════════════════════   │  PTY output     │
│  - onExit    │                             │  stream         │
└──────────────┘                             └─────────────────┘
```

---

## 4. Componentes Principales

### 4.1 Terminal (`TerminalInstance.tsx`)

```
- Inicializa xterm.js con:
  - Addon WebGL (GPU render)
  - Addon Fit (auto-resize)
  - Addon Search (buscar texto)
  - Catppuccin Mocha theme en xterm
  - Fuente: JetBrains Mono / Cascadia Code (Nerd Font)
- Conecta al PTY via Tauri invoke('pty_spawn')
- Pipe bidireccional: xterm.onData → pty.write | pty.onData → xterm.write
- Maneja resize: observer → invoke('pty_resize')
- Maneja focus/blur para activar shortcuts UI vs terminal passthrough
- Soporte completo UTF-8, CJK, emojis
```

### 4.2 Explorer (`FileExplorer.tsx`)

```
- Lazy load del árbol de directorios (solo niveles visibles)
- Virtual scrolling con react-window para 10k+ archivos
- Sigue la ruta del terminal activo (a menos que esté pinneado)
- Botón PIN para fijar ruta (toggle)
- Click derecho: menú contextual
- Keyboard navigation: ↑↓ Enter Space
- Iconos de archivo por extensión
```

### 4.3 Editor (`CodeMirrorEditor.tsx`)

```
- CodeMirror 6 con @uiw/react-codemirror
- Syntax highlighting: auto-detect via @codemirror/language-data
- Autocompletado nativo (sin LSP)
- Tema Catppuccin Mocha adaptado
- Keybindings VS Code-like
- Búsqueda en archivo (Ctrl+F) via @codemirror/search
- Multiple cursors
- Soporte para todos los lenguajes @codemirror/lang-*
```

### 4.4 TabBar

```
- Muestra tabs de terminales, editores, viewers
- Icono por tipo
- Drag & drop para reordenar
- Middle click cerrar
- Doble click → nueva terminal
- Pin tab (no se cierra)
```

### 4.5 StatusBar

```
- MODO TERMINAL: shell actual, ruta, click para cambiar shell
- MODO EDITOR: línea:columna, lenguaje, encoding
- Shortcuts visibles clickeables
```

### 4.6 SplitTerminal

```
- Dos terminales lado a lado o arriba/abajo
- Divisor arrastrable
- Cada split con su propio PTY
- Atajo: Ctrl+\ dividir, Ctrl+W cerrar split
```

---

## 5. Sistema de Shortcuts

### Contextos
- **global**: siempre activos (palette, toggle terminal, tabs)
- **terminal**: desactivados cuando xterm tiene foco (passthrough)
- **editor**: activos cuando CodeMirror tiene foco
- **explorer**: activos cuando file tree tiene foco
- **Ctrl+Shift+Space**: release focus (terminal → UI)

### Default Shortcuts
```
Global:
  Ctrl+Shift+P   → Command Palette
  Ctrl+P         → Quick Open
  Ctrl+`         → Toggle terminal
  Ctrl+Shift+`   → Nueva terminal
  Ctrl+W         → Cerrar tab
  Ctrl+Tab       → Siguiente tab
  Ctrl+Shift+Tab → Tab anterior
  Ctrl+1..9      → Ir a tab N
  Ctrl+B         → Toggle explorer
  Ctrl+,         → Settings

Terminal:
  Ctrl+Shift+C   → Copiar
  Ctrl+Shift+V   → Pegar
  Ctrl+\         → Split horizontal
  Ctrl+Shift+\   → Split vertical
  Ctrl+Shift+W   → Cerrar split
  Ctrl+D         → Duplicar tab

Editor:
  Ctrl+S         → Guardar
  Ctrl+F         → Buscar
  Ctrl+H         → Reemplazar
  Ctrl+D         → Seleccionar siguiente
  Ctrl+/         → Comentar línea
  Alt+↑/↓        → Mover línea
```

---

## 6. Configuración

### Global (~/.config/forge/config.json)
### Workspace (.config/workspace.forge.json por directorio)

```jsonc
{
  "theme": {
    "type": "catppuccin-mocha",
    "custom": {},
    "opacity": 0.95,
    "animations": { "enabled": true, "speed": 200 }
  },
  "terminal": {
    "defaultShell": "",  // auto-detect
    "fontFamily": "\"JetBrains Mono\", \"Cascadia Code\", monospace",
    "fontSize": 14,
    "cursorStyle": "bar",
    "cursorBlink": true,
    "scrollback": 10000
  },
  "explorer": {
    "position": "left",
    "width": 260,
    "showHiddenFiles": false,
    "autoReveal": true
  },
  "editor": {
    "fontSize": 14,
    "tabSize": 4,
    "wordWrap": "off",
    "lineNumbers": true,
    "bracketPairColorization": true
  },
  "layout": {
    "tabPosition": "top",
    "showStatusBar": true
  }
}
```

---

## 7. Persistencia de Workspace

```jsonc
{
  "version": 1,
  "tabs": [
    { "id": "uuid", "type": "terminal", "cwd": "...", "shell": "..." },
    { "id": "uuid", "type": "editor", "filePath": "...", "cursorPosition": {"line":42,"col":15} }
  ],
  "layout": {
    "explorer": { "visible": true, "width": 260, "pinnedPath": null },
    "activeTabId": "uuid"
  },
  "lastOpened": "2026-05-21T10:30:00Z"
}
```

---

## 8. Rust Backend

### PTY Manager
```rust
struct PtyManager {
    sessions: HashMap<String, PtySession>,
}
struct PtySession {
    id: String, shell: String, cwd: PathBuf,
    reader: Box<dyn Read + Send>,
    writer: Box<dyn Write + Send>,
    child: Box<dyn Child + Send>,
}
```

### Comandos Tauri
- `pty_spawn(id, shell, cwd, cols, rows)` → crea PTY
- `pty_write(id, data)` → escribe al PTY
- `pty_resize(id, cols, rows)` → redimensiona
- `pty_kill(id)` → mata proceso
- `fs_read_dir(path)` → lista directorio
- `fs_read_file(path)` → lee archivo
- `fs_write_file(path, content)` → escribe archivo
- `fs_stat(path)` → metadata
- `workspace_load(cwd)` → carga workspace
- `workspace_save(cwd, state)` → guarda workspace

### Eventos (Rust → JS)
- `pty:{id}:data` → datos del PTY
- `pty:{id}:exit` → proceso terminó
- `pty:{id}:error` → error

---

## 9. Tema Catppuccin Mocha

### Colores Base
- bg: #1e1e2e, bg-alt: #181825, fg: #cdd6f4
- red: #f38ba8, green: #a6e3a1, yellow: #f9e2af
- blue: #89b4fa, magenta: #f5c2e7, cyan: #94e2d5
- peach: #fab387, mauve: #cba6f7, teal: #94e2d5

### Syntax Highlighting (CodeMirror)
- keyword: #cba6f7 (mauve), string: #a6e3a1 (green)
- function: #89b4fa (blue), variable: #f9e2af (yellow)
- number: #fab387 (peach), comment: #6c7086 (overlay0)
- type: #f9e2af, operator: #89dceb, property: #94e2d5

---

## 10. Fases de Implementación

### Fase 1: Fundación (Días 1-3)
- [x] Inicializar proyecto Tauri 2.0 + React + TypeScript + Vite
- [x] Configurar Tailwind CSS 4 + shadcn/ui + Biome
- [x] Crear layout básico (MainLayout, TitleBar, PanelResizer)
- [x] Implementar sistema de temas (Catppuccin Mocha en CSS variables)
- [x] Crear store de configuración con Zustand (configStore)
- [x] Implementar carga/guardado de config global desde Rust
- [x] Detectar e implementar shell por defecto en Rust

### Fase 2: Terminal Core (Días 4-7)
- [x] Integrar xterm.js con React (TerminalInstance)
- [x] Configurar PTY en Rust (portable-pty + manager)
- [x] Conectar xterm.js ↔ PTY via Tauri IPC/events
- [x] Implementar resize (FitAddon + Tauri command)
- [x] Tema Catppuccin Mocha en xterm.js
- [x] Soporte WebGL renderer removido (canvas renderer por defecto)
- [x] Manejo de focus/blur (passthrough vs UI mode)

### Fase 3: Tabs & Multiplexer (Días 8-10)
- [x] Sistema de tabs (TabBar, tabStore)
- [x] Múltiples terminales simultáneas
- [x] Split terminal horizontal/vertical
- [x] Drag & drop de tabs
- [x] Sistema de sesiones

### Fase 4: Explorer (Días 11-14)
- [x] File tree con lazy loading + virtual scrolling (react-window)
- [x] Navegación por teclado (↑↓ → ← Enter Space F2 Delete)
- [x] Seguir ruta del terminal + PIN + contexto (cut, rename, delete)
- [x] Context menu + file operations (new file, new folder, rename, delete, refresh)

### Fase 5: Editor (Días 15-19)
- [ ] CodeMirror con tema Catppuccin
- [ ] Auto-detección lenguaje + syntax highlighting
- [ ] Autocompletado + search
- [ ] Guardar archivos

### Fase 6: ImageViewer & RawViewer (Días 20-21)
- [ ] Visor de imágenes
- [ ] Visor raw (hex/text)

### Fase 7: StatusBar & CommandPalette (Días 22-24)
- [x] CommandPalette funcional
- [x] StatusBar con información de terminal activa + PASSTHROUGH indicator

### Fase 8: Workspace & Sessions (Días 25-27)
- [ ] Guardar/cargar workspace
- [ ] Restaurar sesiones al iniciar

### Fase 9: Settings UI & Polish (Días 28-32)
- [ ] Modal de configuración
- [ ] Personalización de tema
- [ ] Editor de atajos

### Fase 10: Testing & Optimización (Días 33-35)
- [ ] Tests unitarios
- [ ] Tests de integración
- [ ] Optimización de bundles

---

## 11. Dependencias npm (Frontend)

```jsonc
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@xterm/xterm": "^6.0.0",
    "@xterm/addon-fit": "^6.0.0",
    "@xterm/addon-webgl": "^6.0.0",
    "@xterm/addon-search": "^6.0.0",
    "@uiw/react-codemirror": "^4.0.0",
    "@codemirror/lang-javascript": "^6.0.0",
    "@codemirror/lang-python": "^6.0.0",
    "@codemirror/lang-rust": "^6.0.0",
    "@codemirror/lang-json": "^6.0.0",
    "@codemirror/lang-html": "^6.0.0",
    "@codemirror/lang-css": "^6.0.0",
    "@codemirror/lang-markdown": "^6.0.0",
    "@codemirror/lang-xml": "^6.0.0",
    "@codemirror/lang-sql": "^6.0.0",
    "@codemirror/lang-cpp": "^6.0.0",
    "@codemirror/lang-java": "^6.0.0",
    "@codemirror/lang-php": "^6.0.0",
    "@codemirror/language-data": "^6.0.0",
    "@codemirror/autocomplete": "^6.0.0",
    "@codemirror/search": "^6.0.0",
    "@codemirror/state": "^6.0.0",
    "@codemirror/view": "^6.0.0",
    "zustand": "^5.0.0",
    "framer-motion": "^11.0.0",
    "lucide-react": "^0.400.0",
    "react-window": "^1.8.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0"
  }
}
```

## 12. Dependencias Cargo (Rust Backend)

```toml
[dependencies]
tauri = { version = "2", features = ["devtools"] }
tauri-plugin-shell = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tokio = { version = "1", features = ["full"] }
portable-pty = "0.9"
anyhow = "1"
log = "0.4"
uuid = { version = "1", features = ["v4"] }
```
