export interface ThemeConfig {
  type: string;
  custom: Record<string, string>;
  opacity: number;
  animations: {
    enabled: boolean;
    speed: number;
  };
}

export interface TerminalConfig {
  defaultShell: string;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  cursorStyle: "block" | "underline" | "bar";
  cursorBlink: boolean;
  scrollback: number;
  bellStyle: "none" | "sound" | "visual";
  copyOnSelect: boolean;
  rightClickPaste: boolean;
  environment: Record<string, string>;
  args: string[];
}

export interface ExplorerConfig {
  position: "left" | "right";
  width: number;
  showHiddenFiles: boolean;
  autoReveal: boolean;
  compactFolders: boolean;
}

export interface EditorConfig {
  fontSize: number;
  fontFamily: string;
  tabSize: number;
  wordWrap: "off" | "on" | "wordWrapColumn";
  minimap: boolean;
  lineNumbers: boolean;
  bracketPairColorization: boolean;
  formatOnSave: boolean;
  autoClosingBrackets: boolean;
  smoothScrolling: boolean;
  cursorWidth: number;
}

export interface LayoutConfig {
  tabPosition: "top" | "bottom";
  showStatusBar: boolean;
  explorerHidden: boolean;
  panelDirection: "horizontal" | "vertical";
}

export interface ShortcutEntry {
  keys: string[];
  command: string;
  when?: string;
}

export interface ShortcutsConfig {
  global: Record<string, string[]>;
  terminal: Record<string, string[]>;
  editor: Record<string, string[]>;
  explorer: Record<string, string[]>;
}

export interface ForgeConfig {
  theme: ThemeConfig;
  terminal: TerminalConfig;
  explorer: ExplorerConfig;
  editor: EditorConfig;
  layout: LayoutConfig;
  shortcuts: ShortcutsConfig;
}
