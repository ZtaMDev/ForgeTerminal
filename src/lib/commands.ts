import type { Command } from "@/components/common/CommandPalette";
import { useTabStore } from "@/stores/tabStore";
import { useTerminalStore } from "@/stores/terminalStore";

export function getAllCommands(): Command[] {
  const commands: Command[] = [];
  const { tabs, activeTabId } = useTabStore.getState();
  const focusedId = useTerminalStore.getState().focusedSessionId;

  commands.push(
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
      id: "terminal.split-horizontal",
      name: "Split Terminal Horizontally",
      shortcut: "Ctrl+\\",
      category: "Terminal",
      action: () => {
        if (activeTabId) useTabStore.getState().splitHorizontal(activeTabId);
      },
    },
    {
      id: "terminal.split-vertical",
      name: "Split Terminal Vertically",
      shortcut: "Ctrl+Shift+\\",
      category: "Terminal",
      action: () => {
        if (activeTabId) useTabStore.getState().splitVertical(activeTabId);
      },
    },
    {
      id: "terminal.close-pane",
      name: "Close This Terminal",
      shortcut: "Ctrl+W",
      category: "Terminal",
      action: () => {
        if (activeTabId && focusedId) {
          const tab = tabs.find((t) => t.id === activeTabId);
          if (tab?.type === "split" && tab.splitLayout?.splits.includes(focusedId)) {
            useTabStore.getState().closeSplit(activeTabId, focusedId);
          } else {
            useTabStore.getState().removeTab(activeTabId);
          }
        } else if (activeTabId) {
          useTabStore.getState().removeTab(activeTabId);
        }
      },
    },
    {
      id: "tab.close",
      name: "Close Entire Tab",
      shortcut: "Ctrl+Shift+W",
      category: "Tab",
      action: () => {
        if (activeTabId) useTabStore.getState().removeTab(activeTabId);
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
      shortcut: "Ctrl+D",
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
      id: "terminal.new-at",
      name: "New Terminal at Location...",
      shortcut: "Ctrl+Alt+`",
      category: "Terminal",
      action: () => {
        document.dispatchEvent(new CustomEvent("open-terminal-location-picker"));
      },
    },
    {
      id: "view.toggle-explorer",
      name: "Toggle Explorer",
      shortcut: "Ctrl+B",
      category: "View",
      action: () => {},
    },
    {
      id: "view.change-explorer-root",
      name: "Change Explorer Root...",
      shortcut: "Ctrl+Shift+O",
      category: "View",
      action: () => {
        document.dispatchEvent(new CustomEvent("open-explorer-root-picker"));
      },
    },
    {
      id: "view.command-palette",
      name: "Command Palette",
      shortcut: "Ctrl+Shift+P",
      category: "View",
      action: () => {},
    },
    {
      id: "view.quick-open",
      name: "Quick Open",
      shortcut: "Ctrl+P",
      category: "View",
      action: () => {},
    },
  );

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
