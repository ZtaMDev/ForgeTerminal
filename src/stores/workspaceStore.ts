import { create } from "zustand";
import type { WorkspaceState, WorkspaceTabData, WorkspaceLayout } from "@/types/workspace";

interface WorkspaceStore {
  state: WorkspaceState | null;
  loaded: boolean;
  createWorkspace: (cwd: string) => void;
  loadWorkspace: (cwd: string) => Promise<void>;
  saveWorkspace: (cwd: string) => Promise<void>;
  updateLayout: (layout: Partial<WorkspaceLayout>) => void;
  updateTabs: (tabs: WorkspaceTabData[]) => void;
}

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  state: null,
  loaded: false,

  createWorkspace: (cwd) =>
    set({
      state: {
        version: 1,
        tabs: [],
        layout: {
          activeTabId: null,
          activeView: "terminal",
        },
        lastOpened: new Date().toISOString(),
      },
      loaded: true,
    }),

  loadWorkspace: async (cwd) => {
    try {
      const { workspaceLoad } = await import("@/lib/ipc");
      const raw = await workspaceLoad(cwd);
      if (raw) {
        const parsed = JSON.parse(raw) as WorkspaceState;
        set({ state: parsed, loaded: true });
      } else {
        set({ loaded: true });
      }
    } catch {
      set({ loaded: true });
    }
  },

  saveWorkspace: async (cwd) => {
    const state = get().state;
    if (!state) return;
    try {
      const { workspaceSave } = await import("@/lib/ipc");
      await workspaceSave(cwd, JSON.stringify(state, null, 2));
    } catch (e) {
      console.error("Failed to save workspace:", e);
    }
  },

  updateLayout: (layout) =>
    set((state) => {
      if (!state.state) return state;
      return {
        state: {
          ...state.state,
          layout: { ...state.state.layout, ...layout },
          lastOpened: new Date().toISOString(),
        },
      };
    }),

  updateTabs: (tabs) =>
    set((state) => {
      if (!state.state) return state;
      return {
        state: {
          ...state.state,
          tabs,
          lastOpened: new Date().toISOString(),
        },
      };
    }),
}));
