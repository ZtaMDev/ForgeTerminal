import type { Command } from "@/components/common/CommandPalette";
import { useTabStore } from "@/stores/tabStore";
import { useTerminalStore } from "@/stores/terminalStore";
import { useConfigStore } from "@/stores/configStore";
import { getSessions } from "@/lib/splitUtils";

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
      id: "terminal.past-sessions",
      name: "View Past Sessions",
      shortcut: "Ctrl+Shift+O",
      category: "Terminal",
      action: () => {
        document.dispatchEvent(new CustomEvent("open-past-sessions-dialog"));
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
          shell: useConfigStore.getState().config.terminal.defaultShell || "powershell.exe",
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
          if (activeTab.splitNode) {
            const splits = getSessions(activeTab.splitNode);
            if (splits.length > 1) {
            const idx = focusedSessionId ? splits.indexOf(focusedSessionId) : -1;
            const next = (idx + 1) % splits.length;
            setFocusedSession(splits[next]);
            document.dispatchEvent(new CustomEvent("focus-terminal", { detail: { sessionId: splits[next] } }));
            } else {
              document.dispatchEvent(new CustomEvent("focus-terminal"));
            }
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
          const tabState = useTabStore.getState();
          const termState = useTerminalStore.getState();
          const activeTab = tabState.tabs.find((t) => t.id === activeTabId);
          const focusedId = termState.focusedSessionId;
          let parentSessionId = activeTab?.sessionId;
          if (activeTab?.type === "split" && activeTab.splitNode) {
            const splits = getSessions(activeTab.splitNode);
            if (focusedId && splits.includes(focusedId)) {
              parentSessionId = focusedId;
            } else {
              parentSessionId = splits[0];
            }
          }
          const parentSession = parentSessionId ? termState.sessions.get(parentSessionId) : undefined;

          const newId = tabState.splitHorizontal(activeTabId);
          if (newId) {
            termState.addSession({
              id: newId,
              title: "Terminal",
              shell: parentSession?.shell || useConfigStore.getState().config.terminal.defaultShell || "powershell.exe",
              cwd: parentSession?.cwd ?? "",
              cols: parentSession?.cols ?? 80,
              rows: parentSession?.rows ?? 24,
              processId: null,
              createdAt: Date.now(),
            });
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
          const tabState = useTabStore.getState();
          const termState = useTerminalStore.getState();
          const activeTab = tabState.tabs.find((t) => t.id === activeTabId);
          const focusedId = termState.focusedSessionId;
          let parentSessionId = activeTab?.sessionId;
          if (activeTab?.type === "split" && activeTab.splitNode) {
            const splits = getSessions(activeTab.splitNode);
            if (focusedId && splits.includes(focusedId)) {
              parentSessionId = focusedId;
            } else {
              parentSessionId = splits[0];
            }
          }
          const parentSession = parentSessionId ? termState.sessions.get(parentSessionId) : undefined;

          const newId = tabState.splitVertical(activeTabId);
          if (newId) {
            termState.addSession({
              id: newId,
              title: "Terminal",
              shell: parentSession?.shell || useConfigStore.getState().config.terminal.defaultShell || "powershell.exe",
              cwd: parentSession?.cwd ?? "",
              cols: parentSession?.cols ?? 80,
              rows: parentSession?.rows ?? 24,
              processId: null,
              createdAt: Date.now(),
            });
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
        if (!tab?.splitNode) return;
        const splits = getSessions(tab.splitNode);
        if (splits.length < 2) return;
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
        if (!tab?.splitNode) return;
        const splits = getSessions(tab.splitNode);
        if (splits.length < 2) return;
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
        let targetId: string | undefined | null;
        if (fId) {
          const tWith = tabState.tabs.find(
            (t) => t.sessionId === fId || (t.splitNode && getSessions(t.splitNode).includes(fId)),
          );
          targetId = tWith?.id;
        }
        if (!targetId) targetId = activeTabId;
        if (!targetId) return;
        const tab = tabState.tabs.find((t) => t.id === targetId);
        if (tab?.type === "split" && tab.splitNode && getSessions(tab.splitNode).includes(fId ?? "")) {
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
        let targetId: string | undefined | null;
        if (fId) {
          const tWith = tabState.tabs.find(
            (t) => t.sessionId === fId || (t.splitNode && getSessions(t.splitNode).includes(fId)),
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
      id: "view.toggle-preview",
      name: "Toggle Web Preview",
      shortcut: "Ctrl+Shift+Y",
      category: "View",
      action: () => {
        import("@/stores/previewStore").then((m) => m.usePreviewStore.getState().togglePreview());
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
    if (tab.type === "split" && tab.splitNode) {
      const splits = getSessions(tab.splitNode);
      if (splits.length > 1) {
        for (const sid of splits) {
        commands.push({
          id: `close-pane.${sid}`,
          name: `Close Pane in "${tab.title}"`,
          category: "Sessions",
          action: () => useTabStore.getState().closeSplit(tab.id, sid),
        });
        }
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

  // Past Sessions
  const pastPaths = useConfigStore.getState().config.session.pastPaths;
  if (pastPaths && pastPaths.length > 0) {
    for (const path of pastPaths) {
      commands.push({
        id: `terminal.past.${path}`,
        name: `Open Past Session: ${path}`,
        category: "Recent",
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
            shell: useConfigStore.getState().config.terminal.defaultShell || "powershell.exe",
            cwd: path,
            cols: 80,
            rows: 24,
            processId: null,
            createdAt: Date.now(),
          });
          useConfigStore.getState().addPastPath(path);
          setTimeout(() => document.dispatchEvent(new CustomEvent("focus-terminal")), 50);
        },
      });
    }
  }

  return commands;
}
