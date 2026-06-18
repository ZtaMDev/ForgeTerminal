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

export interface LayoutConfig {
  tabPosition: "top" | "bottom";
  showStatusBar: boolean;
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
}

export interface SessionConfig {
  sessionRestore: boolean;
}

export interface DeveloperConfig {
  enabled: boolean;
}

export interface ForgeConfig {
  theme: ThemeConfig;
  terminal: TerminalConfig;
  layout: LayoutConfig;
  shortcuts: ShortcutsConfig;
  session: SessionConfig;
  developer: DeveloperConfig;
}
