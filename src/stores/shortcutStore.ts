import { create } from "zustand";
import type { ShortcutsConfig } from "@/types/config";
export type ShortcutContext = "global" | "terminal" | "editor" | "explorer";
import { defaultShortcuts, matchShortcut } from "@/lib/shortcuts";

type ShortcutCommand = string;

interface ShortcutState {
  shortcuts: ShortcutsConfig;
  context: ShortcutContext;
  commands: Map<string, () => void>;
  setContext: (context: ShortcutContext) => void;
  registerCommand: (name: string, handler: () => void) => void;
  unregisterCommand: (name: string) => void;
  handleKeyEvent: (event: KeyboardEvent) => boolean;
  setShortcuts: (shortcuts: ShortcutsConfig) => void;
}

export const useShortcutStore = create<ShortcutState>((set, get) => ({
  shortcuts: defaultShortcuts,
  context: "global",
  commands: new Map(),

  setContext: (context) => set({ context }),

  registerCommand: (name, handler) =>
    set((state) => {
      const newCommands = new Map(state.commands);
      newCommands.set(name, handler);
      return { commands: newCommands };
    }),

  unregisterCommand: (name) =>
    set((state) => {
      const newCommands = new Map(state.commands);
      newCommands.delete(name);
      return { commands: newCommands };
    }),

  handleKeyEvent: (event) => {
    const state = get();
    const { shortcuts, context, commands } = state;

    const contextMap = shortcuts[context as keyof ShortcutsConfig] ?? {};
    const globalMap = shortcuts.global;

    const allShortcuts = { ...globalMap, ...contextMap };

    for (const [commandName, keys] of Object.entries(allShortcuts)) {
      for (const keyCombo of keys) {
        if (matchShortcut(event, keyCombo)) {
          const handler = commands.get(commandName);
          if (handler) {
            event.preventDefault();
            event.stopPropagation();
            handler();
            return true;
          }
        }
      }
    }

    return false;
  },

  setShortcuts: (shortcuts) => set({ shortcuts }),
}));
