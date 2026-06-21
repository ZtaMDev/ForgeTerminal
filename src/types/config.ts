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
  linkBehavior: "preview" | "browser";
  environment: Record<string, string>;
  args: string[];
  ghostTextEnabled: boolean;
}

export interface LayoutConfig {
  tabPosition: "top" | "bottom";
  showStatusBar: boolean;
  panelDirection: "horizontal" | "vertical";
  previewPosition?: "left" | "right";
}

export interface ShortcutEntry {
  keys: string[];
  command: string;
  when?: string;
}

export interface ShortcutsConfig {
  commandKey: string;
  global: Record<string, string[]>;
  terminal: Record<string, string[]>;
}

export interface SessionConfig {
  sessionRestore: boolean;
  pastPaths: string[];
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
