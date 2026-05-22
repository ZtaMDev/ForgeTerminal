import { create } from "zustand";
import type {
  ForgeConfig,
  ThemeConfig,
  TerminalConfig,
  ExplorerConfig,
  EditorConfig,
  LayoutConfig,
  ShortcutsConfig,
} from "@/types/config";
import { defaultShortcuts } from "@/lib/shortcuts";

const defaultConfig: ForgeConfig = {
  theme: {
    type: "catppuccin-mocha",
    custom: {},
    opacity: 0.95,
    animations: {
      enabled: true,
      speed: 200,
    },
  },
  terminal: {
    defaultShell: "",
    fontFamily: '"JetBrains Mono", "Cascadia Code", monospace',
    fontSize: 14,
    lineHeight: 1.2,
    cursorStyle: "block",
    cursorBlink: false,
    scrollback: 100000,
    bellStyle: "none",
    copyOnSelect: true,
    rightClickPaste: true,
    environment: {},
    args: [],
  },
  explorer: {
    position: "left",
    width: 260,
    showHiddenFiles: false,
    autoReveal: true,
    compactFolders: true,
  },
  editor: {
    fontSize: 14,
    fontFamily: '"JetBrains Mono", monospace',
    tabSize: 4,
    wordWrap: "off",
    minimap: false,
    lineNumbers: true,
    bracketPairColorization: true,
    formatOnSave: false,
    autoClosingBrackets: true,
    smoothScrolling: true,
    cursorWidth: 2,
  },
  layout: {
    tabPosition: "top",
    showStatusBar: true,
    explorerHidden: false,
    panelDirection: "horizontal",
  },
  shortcuts: defaultShortcuts,
};

interface ConfigState {
  config: ForgeConfig;
  loaded: boolean;
  setConfig: (config: Partial<ForgeConfig>) => void;
  setTheme: (theme: Partial<ThemeConfig>) => void;
  setTerminal: (terminal: Partial<TerminalConfig>) => void;
  setExplorer: (explorer: Partial<ExplorerConfig>) => void;
  setEditor: (editor: Partial<EditorConfig>) => void;
  setLayout: (layout: Partial<LayoutConfig>) => void;
  setShortcuts: (shortcuts: Partial<ShortcutsConfig>) => void;
  loadConfig: () => Promise<void>;
  saveConfig: () => Promise<void>;
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  config: defaultConfig,
  loaded: false,

  setConfig: (partial) =>
    set((state) => ({
      config: { ...state.config, ...partial },
    })),

  setTheme: (theme) =>
    set((state) => ({
      config: {
        ...state.config,
        theme: { ...state.config.theme, ...theme },
      },
    })),

  setTerminal: (terminal) =>
    set((state) => ({
      config: {
        ...state.config,
        terminal: { ...state.config.terminal, ...terminal },
      },
    })),

  setExplorer: (explorer) =>
    set((state) => ({
      config: {
        ...state.config,
        explorer: { ...state.config.explorer, ...explorer },
      },
    })),

  setEditor: (editor) =>
    set((state) => ({
      config: {
        ...state.config,
        editor: { ...state.config.editor, ...editor },
      },
    })),

  setLayout: (layout) =>
    set((state) => ({
      config: {
        ...state.config,
        layout: { ...state.config.layout, ...layout },
      },
    })),

  setShortcuts: (shortcuts) =>
    set((state) => ({
      config: {
        ...state.config,
        shortcuts: { ...state.config.shortcuts, ...shortcuts },
      },
    })),

  loadConfig: async () => {
    try {
      const { configLoad } = await import("@/lib/ipc");
      const raw = await configLoad();
      if (raw) {
        const parsed = JSON.parse(raw) as ForgeConfig;
        set({ config: { ...defaultConfig, ...parsed }, loaded: true });
      } else {
        set({ loaded: true });
      }
    } catch {
      set({ loaded: true });
    }
  },

  saveConfig: async () => {
    try {
      const { configSave } = await import("@/lib/ipc");
      await configSave(JSON.stringify(get().config, null, 2));
    } catch (e) {
      console.error("Failed to save config:", e);
    }
  },
}));
