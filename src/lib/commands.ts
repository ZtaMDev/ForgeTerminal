import type { Command } from "@/components/common/CommandPalette";
import { useTabStore } from "@/stores/tabStore";
import { useTerminalStore } from "@/stores/terminalStore";
import { useConfigStore } from "@/stores/configStore";

export function getAllCommands(): Command[] {
  const commands: Command[] = [];
  const { tabs, activeTabId } = useTabStore.getState();
  const focusedId = useTerminalStore.getState().focusedSessionId;

  commands.push(
    {
      id: "terminal.new-at",
      name: "New Terminal at Path...",
      shortcut: "Ctrl+Alt+`",
      category: "Terminal",
      action: () => {
        document.dispatchEvent(new CustomEvent("open-path-input"));
      },
    },
    {
      id: "terminal.new",
      name: "New Terminal",
      shortcut: "Ctrl+Shift+`",
      category: "Terminal",
      action: () => {
        const id = crypto.randomUUID();
        useTabStore.getState().addTab({
          id,
          type: "terminal",
          title: "Terminal",
          sessionId: id,
          pinned: false,
          createdAt: Date.now(),
        });
        useTerminalStore.getState().addSession({
          id,
          title: "Terminal",
          shell: "",
          cwd: "",
          cols: 80,
          rows: 24,
          processId: null,
          createdAt: Date.now(),
        });
      },
    },
    {
      id: "terminal.toggle",
      name: "Cycle Terminal Sessions",
      category: "Terminal",
      action: () => {
        const { tabs: allTabs, activeTabId: activeId, setActiveTab } = useTabStore.getState();
        const activeTab = allTabs.find((t) => t.id === activeId);
        if (activeTab && (activeTab.type === "terminal" || activeTab.type === "split")) {
          const { focusedSessionId, setFocusedSession } = useTerminalStore.getState();
          if (activeTab.splitLayout && activeTab.splitLayout.splits.length > 1) {
            const splits = activeTab.splitLayout.splits;
            const idx = focusedSessionId ? splits.indexOf(focusedSessionId) : -1;
            const next = (idx + 1) % splits.length;
            setFocusedSession(splits[next]);
            document.dispatchEvent(new CustomEvent("focus-terminal", { detail: { sessionId: splits[next] } }));
          } else {
            document.dispatchEvent(new CustomEvent("focus-terminal"));
          }
        } else {
          const termTab = allTabs.find((t) => t.type === "terminal" || t.type === "split");
          if (termTab) {
            setActiveTab(termTab.id);
            setTimeout(() => document.dispatchEvent(new CustomEvent("focus-terminal")), 50);
          }
        }
      },
    },
    {
      id: "terminal.split-horizontal",
      name: "Split Terminal Horizontally",
      shortcut: "Ctrl+\\",
      category: "Terminal",
      action: () => {
        if (activeTabId) {
          const newId = useTabStore.getState().splitHorizontal(activeTabId);
          if (newId) {
            setTimeout(() => document.dispatchEvent(new CustomEvent("focus-terminal", { detail: { sessionId: newId } })), 100);
          }
        }
      },
    },
    {
      id: "terminal.split-vertical",
      name: "Split Terminal Vertically",
      shortcut: "Ctrl+Shift+\\",
      category: "Terminal",
      action: () => {
        if (activeTabId) {
          const newId = useTabStore.getState().splitVertical(activeTabId);
          if (newId) {
            setTimeout(() => document.dispatchEvent(new CustomEvent("focus-terminal", { detail: { sessionId: newId } })), 100);
          }
        }
      },
    },
    {
      id: "terminal.next-split",
      name: "Next Split",
      shortcut: "Ctrl+Shift+ArrowRight",
      category: "Terminal",
      action: () => {
        if (!activeTabId) return;
        const tab = tabs.find((t) => t.id === activeTabId);
        if (!tab?.splitLayout || tab.splitLayout.splits.length < 2) return;
        const splits = tab.splitLayout.splits;
        const idx = focusedId ? splits.indexOf(focusedId) : -1;
        const next = (idx + 1) % splits.length;
        useTerminalStore.getState().setFocusedSession(splits[next]);
        document.dispatchEvent(new CustomEvent("focus-terminal", { detail: { sessionId: splits[next] } }));
      },
    },
    {
      id: "terminal.prev-split",
      name: "Previous Split",
      shortcut: "Ctrl+Shift+ArrowLeft",
      category: "Terminal",
      action: () => {
        if (!activeTabId) return;
        const tab = tabs.find((t) => t.id === activeTabId);
        if (!tab?.splitLayout || tab.splitLayout.splits.length < 2) return;
        const splits = tab.splitLayout.splits;
        const idx = focusedId ? splits.indexOf(focusedId) : -1;
        const prev = (idx - 1 + splits.length) % splits.length;
        useTerminalStore.getState().setFocusedSession(splits[prev]);
        document.dispatchEvent(new CustomEvent("focus-terminal", { detail: { sessionId: splits[prev] } }));
      },
    },
    {
      id: "terminal.copy",
      name: "Copy",
      shortcut: "Ctrl+Shift+C",
      category: "Terminal",
      action: () => {
        document.execCommand("copy");
      },
    },
    {
      id: "terminal.paste",
      name: "Paste",
      shortcut: "Ctrl+Shift+V",
      category: "Terminal",
      action: () => {
        navigator.clipboard.readText().then(async (text) => {
          const id = useTerminalStore.getState().focusedSessionId;
          if (id) {
            const { ptyWrite } = await import("@/lib/ipc");
            ptyWrite(id, text);
          }
        });
      },
    },
    {
      id: "terminal.search",
      name: "Search Terminal",
      shortcut: "Ctrl+Shift+F",
      category: "Terminal",
      action: () => {
        const el = document.querySelector(".xterm")?.parentElement;
        if (el) {
          const searchEl = el.querySelector('[role="search"]') as HTMLElement;
          searchEl?.focus();
        }
      },
    },
    {
      id: "terminal.close-pane",
      name: "Close This Terminal",
      shortcut: "Ctrl+W",
      category: "Terminal",
      action: () => {
        const fId = useTerminalStore.getState().focusedSessionId;
        const tabState = useTabStore.getState();
        let targetId: string | undefined;
        if (fId) {
          const tWith = tabState.tabs.find(
            (t) => t.sessionId === fId || (t.splitLayout && t.splitLayout.splits.includes(fId)),
          );
          targetId = tWith?.id;
        }
        if (!targetId) targetId = activeTabId;
        if (!targetId) return;
        const tab = tabState.tabs.find((t) => t.id === targetId);
        if (tab?.type === "split" && tab.splitLayout?.splits.includes(fId ?? "")) {
          tabState.closeSplit(targetId, fId!);
        } else {
          tabState.removeTab(targetId);
        }
      },
    },
    {
      id: "tab.close-entire",
      name: "Close Entire Tab",
      shortcut: "Ctrl+Shift+W",
      category: "Tab",
      action: () => {
        const fId = useTerminalStore.getState().focusedSessionId;
        const tabState = useTabStore.getState();
        let targetId: string | undefined;
        if (fId) {
          const tWith = tabState.tabs.find(
            (t) => t.sessionId === fId || (t.splitLayout && t.splitLayout.splits.includes(fId)),
          );
          targetId = tWith?.id;
        }
        if (!targetId) targetId = activeTabId;
        if (targetId) tabState.removeTab(targetId);
      },
    },
    {
      id: "terminal.rename",
      name: "Rename Tab",
      shortcut: "Ctrl+Shift+R",
      category: "Terminal",
      action: () => {
        const tab = tabs.find((t) => t.id === activeTabId);
        if (tab) {
          document.dispatchEvent(
            new CustomEvent("open-rename-dialog", { detail: { tabId: tab.id, currentName: tab.title } }),
          );
        }
      },
    },
    {
      id: "tab.next",
      name: "Next Tab",
      shortcut: "Ctrl+Tab",
      category: "Tab",
      action: () => {
        const { tabs: allTabs, activeTabId: activeId, setActiveTab } = useTabStore.getState();
        if (allTabs.length === 0) return;
        const idx = allTabs.findIndex((t) => t.id === activeId);
        const next = (idx + 1) % allTabs.length;
        setActiveTab(allTabs[next].id);
      },
    },
    {
      id: "tab.prev",
      name: "Previous Tab",
      shortcut: "Ctrl+Shift+Tab",
      category: "Tab",
      action: () => {
        const { tabs: allTabs, activeTabId: activeId, setActiveTab } = useTabStore.getState();
        if (allTabs.length === 0) return;
        const idx = allTabs.findIndex((t) => t.id === activeId);
        const prev = (idx - 1 + allTabs.length) % allTabs.length;
        setActiveTab(allTabs[prev].id);
      },
    },
    {
      id: "tab.duplicate",
      name: "Duplicate Tab",
      shortcut: "Ctrl+Shift+D",
      category: "Tab",
      action: () => {
        if (activeTabId) useTabStore.getState().duplicateTab(activeTabId);
      },
    },
    {
      id: "tab.toggle-pin",
      name: "Toggle Pin Tab",
      category: "Tab",
      action: () => {
        if (activeTabId) useTabStore.getState().togglePinTab(activeTabId);
      },
    },
    {
      id: "tab.move-up",
      name: "Move Tab Up",
      shortcut: "Alt+ArrowUp",
      category: "Tab",
      action: () => {
        const { tabs: allTabs, activeTabId: activeId, setActiveTab } = useTabStore.getState();
        const idx = allTabs.findIndex((t) => t.id === activeId);
        if (idx > 0) {
          useTabStore.getState().reorderTabs(idx, idx - 1);
        }
      },
    },
    {
      id: "tab.move-down",
      name: "Move Tab Down",
      shortcut: "Alt+ArrowDown",
      category: "Tab",
      action: () => {
        const { tabs: allTabs, activeTabId: activeId, setActiveTab } = useTabStore.getState();
        const idx = allTabs.findIndex((t) => t.id === activeId);
        if (idx < allTabs.length - 1) {
          useTabStore.getState().reorderTabs(idx, idx + 1);
        }
      },
    },
    ...[1,2,3,4,5,6,7,8,9].map((n) => ({
      id: `tab.go-${n}`,
      name: `Go to Tab ${n}`,
      shortcut: `Ctrl+${n}`,
      category: "Tab",
      action: () => {
        const { tabs: allTabs, setActiveTab } = useTabStore.getState();
        const tab = allTabs[n - 1];
        if (tab) {
          setActiveTab(tab.id);
          setTimeout(() => {
            if (tab.type === "terminal" || tab.type === "split") {
              document.dispatchEvent(new CustomEvent("focus-terminal"));
            }
          }, 50);
        }
      },
    })),
    {
      id: "view.command-palette",
      name: "Command Palette",
      shortcut: "Ctrl+Shift+P",
      category: "View",
      action: () => {},
    },
    {
      id: "view.release-focus",
      name: "Release Focus",
      shortcut: "Ctrl+Shift+Space",
      category: "View",
      action: () => {
        (document.activeElement as HTMLElement)?.blur();
      },
    },
    {
      id: "view.open-settings",
      name: "Open Settings",
      shortcut: "Ctrl+,",
      category: "View",
      action: () => {
        document.dispatchEvent(new CustomEvent("toggle-settings-panel"));
      },
    },
    {
      id: "focus.terminal",
      name: "Focus Terminal",
      shortcut: "Ctrl+Shift+T",
      category: "Focus",
      action: () => {
        const { tabs, activeTabId, setActiveTab } = useTabStore.getState();
        const termTab = tabs.find((t) => t.type === "terminal" || t.type === "split");
        if (termTab) {
          setActiveTab(termTab.id);
          setTimeout(() => document.dispatchEvent(new CustomEvent("focus-terminal")), 50);
        }
      },
    },
  );

  // Developer commands
  if (useConfigStore.getState().config.developer.enabled) {
    commands.push(
      {
        id: "dev.clear-tutorial",
        name: "Reset Tutorial Flag (show again)",
        category: "Developer",
        action: () => {
          localStorage.removeItem("forge-tutorial-shown");
          document.dispatchEvent(new CustomEvent("clear-tutorial"));
        },
      },
      {
        id: "dev.reset-config",
        name: "Restore All Defaults",
        category: "Developer",
        action: () => {
          useConfigStore.getState().resetConfig();
        },
      },
      {
        id: "dev.reopen-tutorial",
        name: "Reopen Tutorial",
        category: "Developer",
        action: () => {
          document.dispatchEvent(new CustomEvent("show-tutorial"));
        },
      },
    );
  }

  // Per-tab commands
  for (const tab of tabs) {
    if (tab.type === "split" && tab.splitLayout && tab.splitLayout.splits.length > 1) {
      for (const sid of tab.splitLayout.splits) {
        commands.push({
          id: `close-pane.${sid}`,
          name: `Close Pane in "${tab.title}"`,
          category: "Sessions",
          action: () => useTabStore.getState().closeSplit(tab.id, sid),
        });
      }
    }
    if (tab.type === "terminal" || tab.type === "split") {
      commands.push({
        id: `close-tab.${tab.id}`,
        name: `Close Tab "${tab.title}"`,
        category: "Tabs",
        action: () => useTabStore.getState().removeTab(tab.id),
      });
    }
  }

  return commands;
}
