import { create } from "zustand";
import type { Tab, TabType, SplitLayout } from "@/types/terminal";

interface TabState {
  tabs: Tab[];
  activeTabId: string | null;
  activeView: "terminal" | "editor" | "viewer";
  addTab: (tab: Tab) => void;
  removeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  setActiveView: (view: "terminal" | "editor" | "viewer") => void;
  reorderTabs: (fromIndex: number, toIndex: number) => void;
  updateTab: (id: string, partial: Partial<Tab>) => void;
  togglePinTab: (id: string) => void;
  duplicateTab: (id: string) => string;
  splitHorizontal: (tabId: string) => string | undefined;
  splitVertical: (tabId: string) => string | undefined;
  closeSplit: (tabId: string, sessionId: string) => void;
}

export const useTabStore = create<TabState>((set, get) => ({
  tabs: [],
  activeTabId: null,
  activeView: "terminal",

  addTab: (tab) =>
    set((state) => ({
      tabs: [...state.tabs, tab],
      activeTabId: tab.id,
      activeView: tab.type === "terminal" || tab.type === "split" ? "terminal" : "editor",
    })),

  removeTab: (id) =>
    set((state) => {
      const tab = state.tabs.find((t) => t.id === id);
      if (tab?.pinned) return state;

      const newTabs = state.tabs.filter((t) => t.id !== id);
      let newActiveId = state.activeTabId;
      let newActiveView = state.activeView;

      if (state.activeTabId === id) {
        const idx = state.tabs.findIndex((t) => t.id === id);
        if (newTabs.length > 0) {
          const nextIdx = Math.min(idx, newTabs.length - 1);
          newActiveId = newTabs[nextIdx].id;
          const activeTab = newTabs[nextIdx];
          newActiveView =
            activeTab.type === "editor"
              ? "editor"
              : "terminal";
        } else {
          newActiveId = null;
        }
      }

      return {
        tabs: newTabs,
        activeTabId: newActiveId,
        activeView: newActiveView,
      };
    }),

  setActiveTab: (id) =>
    set((state) => {
      const tab = state.tabs.find((t) => t.id === id);
      if (!tab) return state;
      return {
        activeTabId: id,
        activeView:
          tab.type === "editor"
            ? "editor"
            : "terminal",
      };
    }),

  setActiveView: (view) => set({ activeView: view }),

  reorderTabs: (fromIndex, toIndex) =>
    set((state) => {
      const newTabs = [...state.tabs];
      const [moved] = newTabs.splice(fromIndex, 1);
      newTabs.splice(toIndex, 0, moved);
      return { tabs: newTabs };
    }),

  updateTab: (id, partial) =>
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === id ? { ...t, ...partial } : t)),
    })),

  togglePinTab: (id) =>
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === id ? { ...t, pinned: !t.pinned } : t,
      ),
    })),

  duplicateTab: (id) => {
    const state = get();
    const tab = state.tabs.find((t) => t.id === id);
    if (!tab) return "";

    const newId = crypto.randomUUID();
    const newTab: Tab = {
      ...tab,
      id: newId,
      title: `${tab.title} (copy)`,
      pinned: false,
      createdAt: Date.now(),
    };

    set((s) => ({
      tabs: [...s.tabs, newTab],
      activeTabId: newId,
      activeView:
        newTab.type === "editor"
          ? "editor"
          : "terminal",
    }));

    return newId;
  },

  splitHorizontal: (tabId) => {
    const state = get();
    const tab = state.tabs.find((t) => t.id === tabId);
    if (!tab) return;

    const newSessionId = crypto.randomUUID();
    const existingSessions = tab.splitLayout?.splits ?? [tab.sessionId ?? tabId];

    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.id === tabId
          ? {
              ...t,
              type: "split" as TabType,
              sessionId: undefined,
              splitLayout: {
                direction: "horizontal",
                splits: [...existingSessions, newSessionId],
              },
            }
          : t,
      ),
    }));

    return newSessionId;
  },

  splitVertical: (tabId) => {
    const state = get();
    const tab = state.tabs.find((t) => t.id === tabId);
    if (!tab) return;

    const newSessionId = crypto.randomUUID();
    const existingSessions = tab.splitLayout?.splits ?? [tab.sessionId ?? tabId];

    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.id === tabId
          ? {
              ...t,
              type: "split" as TabType,
              sessionId: undefined,
              splitLayout: {
                direction: "vertical",
                splits: [...existingSessions, newSessionId],
              },
            }
          : t,
      ),
    }));

    return newSessionId;
  },

  closeSplit: (tabId, sessionId) => {
    const state = get();
    const tab = state.tabs.find((t) => t.id === tabId);
    if (!tab || !tab.splitLayout) return;

    const newSplits = tab.splitLayout.splits.filter((s) => s !== sessionId);

    if (newSplits.length <= 1) {
      set((s) => ({
        tabs: s.tabs.map((t) =>
          t.id === tabId
            ? {
                ...t,
                type: "terminal" as TabType,
                sessionId: newSplits[0] ?? tabId,
                splitLayout: undefined,
              }
            : t,
        ),
      }));
    } else {
      set((s) => ({
        tabs: s.tabs.map((t) =>
          t.id === tabId
            ? {
                ...t,
                splitLayout: {
                  ...t.splitLayout!,
                  splits: newSplits,
                },
              }
            : t,
        ),
      }));
    }

    // Focus the previous session in the split (or the last one if first was removed)
    if (newSplits.length > 0) {
      const removedIdx = tab.splitLayout.splits.indexOf(sessionId);
      const focusIdx = Math.max(0, Math.min(removedIdx, newSplits.length - 1));
      document.dispatchEvent(
        new CustomEvent("focus-terminal", { detail: { sessionId: newSplits[focusIdx] } }),
      );
    }
  },
}));
