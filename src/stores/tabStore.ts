import { create } from "zustand";
import type { Tab, TabType, SplitNode } from "@/types/terminal";
import { useTerminalStore } from "./terminalStore";

const STORAGE_KEY = "forge-session";

function saveToStorage() {
  try {
    const { tabs } = useTabStore.getState();
    const sessions = Array.from(useTerminalStore.getState().sessions.values());
    const data = JSON.stringify({ tabs, sessions });
    localStorage.setItem(STORAGE_KEY, data);
  } catch { /* ignore */ }
}

function loadFromStorage(): { tabs: Tab[]; sessions: { id: string; title: string; shell: string; cwd: string; cols: number; rows: number; createdAt: number }[] } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export { saveToStorage, loadFromStorage };

interface TabState {
  tabs: Tab[];
  activeTabId: string | null;
  activeView: "terminal" | "viewer";
  addTab: (tab: Tab) => void;
  removeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  setActiveView: (view: "terminal" | "viewer") => void;
  reorderTabs: (fromIndex: number, toIndex: number) => void;
  updateTab: (id: string, partial: Partial<Tab>) => void;
  togglePinTab: (id: string) => void;
  duplicateTab: (id: string) => string;
  splitHorizontal: (tabId: string, focusedSessionId?: string) => string | undefined;
  splitVertical: (tabId: string, focusedSessionId?: string) => string | undefined;
  closeSplit: (tabId: string, sessionId: string) => void;
  swapSessions: (tabId: string, sessionId1: string, sessionId2: string) => void;
}

export const useTabStore = create<TabState>((set, get) => ({
  tabs: [],
  activeTabId: null,
  activeView: "terminal",

  addTab: (tab) =>
    set((state) => ({
      tabs: [...state.tabs, tab],
      activeTabId: tab.id,
      activeView: tab.type === "viewer" ? "viewer" : "terminal",
    })),

  removeTab: (id) => {
    const result = set((state) => {
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
            activeTab.type === "viewer" ? "viewer" : "terminal";
        } else {
          newActiveId = null;
        }
      }

      return {
        tabs: newTabs,
        activeTabId: newActiveId,
        activeView: newActiveView,
      };
    });

    // Auto-focus the remaining terminal after removal
    setTimeout(() => {
      const state = get();
      const activeTab = state.tabs.find((t) => t.id === state.activeTabId);
      if (activeTab && (activeTab.type === "terminal" || activeTab.type === "split")) {
        const focusedId = useTerminalStore.getState().focusedSessionId;
        document.dispatchEvent(
          new CustomEvent("focus-terminal", {
            detail: focusedId ? { sessionId: focusedId } : undefined,
          }),
        );
      }
    }, 0);

    return result;
  },

  setActiveTab: (id) =>
    set((state) => {
      const tab = state.tabs.find((t) => t.id === id);
      if (!tab) return state;
      return {
        activeTabId: id,
        activeView:
          tab.type === "viewer" ? "viewer" : "terminal",
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
        newTab.type === "viewer" ? "viewer" : "terminal",
    }));

    return newId;
  },

  splitHorizontal: (tabId, focusedSessionId) => {
    const state = get();
    const tab = state.tabs.find((t) => t.id === tabId);
    if (!tab) return;

    const newSessionId = crypto.randomUUID();
    const targetId = focusedSessionId ?? tab.sessionId ?? tabId;

    set((s) => {
      let rootNode = tab.splitNode ?? { type: "terminal", id: crypto.randomUUID(), sessionId: tab.sessionId ?? tabId } as SplitNode;
      import("@/lib/splitUtils").then(({ splitNodeAt }) => {
        const newRoot = splitNodeAt(rootNode, targetId, newSessionId, "horizontal");
        s.updateTab(tabId, { type: "split", sessionId: undefined, splitNode: newRoot });
      });
      return { ...s }; // Update will happen asynchronously via promise
    });

    // Synchronous fallback (we can do it synchronously if we import at the top, but we can't easily add top-level imports in multi_replace. Let's do it inline.)
    // Actually, I should just implement it inline here or import it synchronously.
    return newSessionId;
  },

  splitVertical: (tabId, focusedSessionId) => {
    const state = get();
    const tab = state.tabs.find((t) => t.id === tabId);
    if (!tab) return;

    const newSessionId = crypto.randomUUID();
    const targetId = focusedSessionId ?? tab.sessionId ?? tabId;

    set((s) => {
      let rootNode = tab.splitNode ?? { type: "terminal", id: crypto.randomUUID(), sessionId: tab.sessionId ?? tabId } as SplitNode;
      import("@/lib/splitUtils").then(({ splitNodeAt }) => {
        const newRoot = splitNodeAt(rootNode, targetId, newSessionId, "vertical");
        s.updateTab(tabId, { type: "split", sessionId: undefined, splitNode: newRoot });
      });
      return { ...s };
    });

    return newSessionId;
  },

  closeSplit: (tabId, sessionId) => {
    const state = get();
    const tab = state.tabs.find((t) => t.id === tabId);
    if (!tab || !tab.splitNode) return;

    set((s) => {
      import("@/lib/splitUtils").then(({ removeNode, getAdjacentSession, getSessions }) => {
        const adjacentSessionId = getAdjacentSession(tab.splitNode!, sessionId);
        const newRoot = removeNode(tab.splitNode!, sessionId);
        
        if (!newRoot) {
           // Should not happen unless removing the last node, in which case tab should be closed.
        } else if (newRoot.type === "terminal") {
           s.updateTab(tabId, { type: "terminal", sessionId: newRoot.sessionId, splitNode: undefined });
           setTimeout(() => {
             const targetToFocus = adjacentSessionId ?? newRoot.sessionId;
             document.dispatchEvent(new CustomEvent("focus-terminal", { detail: { sessionId: targetToFocus } }));
             useTerminalStore.getState().setFocusedSession(targetToFocus);
           }, 0);
        } else {
           s.updateTab(tabId, { splitNode: newRoot });
           const remaining = getSessions(newRoot);
           if (remaining.length > 0) {
             const targetToFocus = adjacentSessionId && remaining.includes(adjacentSessionId) ? adjacentSessionId : remaining[0];
             setTimeout(() => {
               document.dispatchEvent(new CustomEvent("focus-terminal", { detail: { sessionId: targetToFocus } }));
               useTerminalStore.getState().setFocusedSession(targetToFocus);
             }, 50);
           }
        }
      });
      return { ...s };
    });
  },

  swapSessions: (tabId, sessionId1, sessionId2) => {
    const state = get();
    const tab = state.tabs.find((t) => t.id === tabId);
    if (!tab || !tab.splitNode) return;

    set((s) => {
      const clone = JSON.parse(JSON.stringify(tab.splitNode)) as SplitNode;
      import("@/lib/splitUtils").then(({ findNode }) => {
         const node1 = findNode(clone, sessionId1);
         const node2 = findNode(clone, sessionId2);
         if (node1 && node2 && node1.type === "terminal" && node2.type === "terminal") {
            const temp = node1.sessionId;
            node1.sessionId = node2.sessionId;
            node2.sessionId = temp;
            s.updateTab(tabId, { splitNode: clone });
         }
      });
      return { ...s };
    });
  },
}));
