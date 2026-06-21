import { create } from "zustand";
import { persist } from "zustand/middleware";

interface HistoryState {
  history: string[];
  addCommand: (cmd: string) => void;
  clearHistory: () => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      history: [
        "npm run tauri dev",
        "bun run tauri dev",
        "git status",
        "git commit -m \"\"",
        "npm install",
        "bun install"
      ], // Some sensible defaults for the first run
      addCommand: (cmd) => set((state) => {
        const trimmed = cmd.trim();
        if (!trimmed) return state;
        // Don't add if it's the same as the last command
        if (state.history[0] === trimmed) return state;
        // Add to front, remove duplicates, keep last 100
        const newHistory = [trimmed, ...state.history.filter(h => h !== trimmed)].slice(0, 100);
        return { history: newHistory };
      }),
      clearHistory: () => set({ history: [] })
    }),
    {
      name: 'forge-history-storage', // name of the item in the storage (must be unique)
    }
  )
);
