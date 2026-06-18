import { create } from "zustand";
import type {
  ForgeConfig,
  ThemeConfig,
  TerminalConfig,
  LayoutConfig,
  ShortcutsConfig,
  SessionConfig,
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
  layout: {
    tabPosition: "top",
    showStatusBar: true,
    panelDirection: "horizontal",
  },
  shortcuts: defaultShortcuts,
  session: {
    sessionRestore: true,
  },
};

interface ConfigState {
  config: ForgeConfig;
  loaded: boolean;
  setConfig: (config: Partial<ForgeConfig>) => void;
  setTheme: (theme: Partial<ThemeConfig>) => void;
  setTerminal: (terminal: Partial<TerminalConfig>) => void;
  setLayout: (layout: Partial<LayoutConfig>) => void;
  setShortcuts: (shortcuts: Partial<ShortcutsConfig>) => void;
  setSession: (session: Partial<SessionConfig>) => void;
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

  setSession: (session) =>
    set((state) => ({
      config: { ...state.config, session: { ...state.config.session, ...session } },
    })),

  loadConfig: async () => {
    try {
      const { configLoad } = await import("@/lib/ipc");
      const raw = await configLoad();
      if (raw) {
        const parsed = JSON.parse(raw) as ForgeConfig;
        set({ config: { ...defaultConfig, ...parsed }, loaded: true });
        return;
      }
    } catch { /* IPC not available */ }

    try {
      const raw = localStorage.getItem("forge-config");
      if (raw) {
        const parsed = JSON.parse(raw) as ForgeConfig;
        set({ config: { ...defaultConfig, ...parsed }, loaded: true });
        return;
      }
    } catch { /* ignore */ }

    set({ loaded: true });
  },

  saveConfig: async () => {
    try {
      const { configSave } = await import("@/lib/ipc");
      await configSave(JSON.stringify(get().config, null, 2));
      return;
    } catch { /* IPC not available */ }

    try {
      localStorage.setItem("forge-config", JSON.stringify(get().config));
    } catch (e) {
      console.error("Failed to save config:", e);
    }
  },
}));
