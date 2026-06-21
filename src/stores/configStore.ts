import { create } from "zustand";
import type {
  ForgeConfig,
  ThemeConfig,
  TerminalConfig,
  LayoutConfig,
  ShortcutsConfig,
  SessionConfig,
  DeveloperConfig,
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
    defaultShell: "powershell.exe",
    fontFamily: '"JetBrains Mono", "Cascadia Code", monospace',
    fontSize: 14,
    lineHeight: 1,
    cursorStyle: "block",
    cursorBlink: false,
    scrollback: 100000,
    bellStyle: "none",
    copyOnSelect: true,
    rightClickPaste: true,
    linkBehavior: "preview",
    environment: {},
    args: [],
    ghostTextEnabled: true,
  },
  layout: {
    tabPosition: "top",
    showStatusBar: true,
    panelDirection: "horizontal",
    previewPosition: "right",
  },
  shortcuts: {
    ...defaultShortcuts,
    commandKey: "`",
  },
  session: {
    sessionRestore: true,
    pastPaths: [],
  },
  developer: {
    enabled: false,
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
  setDeveloper: (developer: Partial<DeveloperConfig>) => void;
  addPastPath: (path: string) => void;
  clearPastPaths: () => void;
  resetConfig: () => void;
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

  setDeveloper: (developer) =>
    set((state) => ({
      config: { ...state.config, developer: { ...state.config.developer, ...developer } },
    })),

  addPastPath: (path) =>
    set((state) => {
      const paths = state.config.session.pastPaths || [];
      const newPaths = [path, ...paths.filter((p) => p !== path)].slice(0, 10);
      return {
        config: {
          ...state.config,
          session: { ...state.config.session, pastPaths: newPaths },
        },
      };
    }),

  clearPastPaths: () =>
    set((state) => ({
      config: {
        ...state.config,
        session: { ...state.config.session, pastPaths: [] },
      },
    })),

  resetConfig: () =>
    set({ config: { ...defaultConfig } }),

  loadConfig: async () => {
    const mergeConfig = (parsed: Partial<ForgeConfig>): ForgeConfig => {
      // Migrate old shortcuts to use <cmd>
      if (parsed.shortcuts?.global) {
        for (const [key, val] of Object.entries(parsed.shortcuts.global)) {
          if (Array.isArray(val)) {
            parsed.shortcuts.global[key] = val.map(v => 
              v.replace("Ctrl+`", "Ctrl+<cmd>")
               .replace("Ctrl+Shift+`", "Ctrl+Shift+<cmd>")
               .replace("Ctrl+Alt+`", "Ctrl+Alt+<cmd>")
            );
          }
        }
      }

      return {
        ...defaultConfig,
        ...parsed,
        theme: {
          ...defaultConfig.theme,
          ...(parsed.theme || {}),
          animations: {
            ...defaultConfig.theme.animations,
            ...(parsed.theme?.animations || {}),
          },
        },
        terminal: { ...defaultConfig.terminal, ...(parsed.terminal || {}) },
        layout: { ...defaultConfig.layout, ...(parsed.layout || {}) },
        shortcuts: {
          commandKey: parsed.shortcuts?.commandKey || defaultConfig.shortcuts.commandKey,
          global: { ...defaultConfig.shortcuts.global, ...(parsed.shortcuts?.global || {}) },
          terminal: { ...defaultConfig.shortcuts.terminal, ...(parsed.shortcuts?.terminal || {}) },
        },
        session: { ...defaultConfig.session, ...(parsed.session || {}) },
        developer: { ...defaultConfig.developer, ...(parsed.developer || {}) },
      };
    };

    try {
      const { configLoad } = await import("@/lib/ipc");
      const raw = await configLoad();
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<ForgeConfig>;
        set({ config: mergeConfig(parsed), loaded: true });
        return;
      }
    } catch { /* IPC not available */ }

    try {
      const raw = localStorage.getItem("forge-config");
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<ForgeConfig>;
        set({ config: mergeConfig(parsed), loaded: true });
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
