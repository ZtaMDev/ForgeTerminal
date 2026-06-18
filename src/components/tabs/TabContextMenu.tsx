import { ContextMenu, type ContextMenuItem } from "@/components/common/ContextMenu";
import { useTabStore } from "@/stores/tabStore";
import { useTerminalStore } from "@/stores/terminalStore";
import type { Tab } from "@/types/terminal";
import { X, Copy, Pin, PinOff, Columns2, Columns2Icon, SquareTerminal } from "lucide-react";

interface TabContextMenuProps {
  isOpen: boolean;
  x: number;
  y: number;
  tab: Tab;
  onClose: () => void;
}

export function TabContextMenu({ isOpen, x, y, tab, onClose }: TabContextMenuProps) {
  const store = useTabStore;
  const isSplit = tab.type === "split" && tab.splitLayout && tab.splitLayout.splits.length > 1;
  const focusedId = useTerminalStore.getState().focusedSessionId;

  const items: ContextMenuItem[] = [
    ...(isSplit && focusedId && tab.splitLayout!.splits.includes(focusedId)
      ? [
          {
            id: "close-pane",
            label: "Close This Terminal",
            icon: <SquareTerminal size={14} />,
            shortcut: "Ctrl+W",
            action: () => store.getState().closeSplit(tab.id, focusedId),
          } as ContextMenuItem,
        ]
      : []),
    {
      id: "close",
      label: isSplit ? "Close Entire Tab" : "Close Tab",
      icon: <X size={14} />,
      shortcut: isSplit ? "Ctrl+Shift+W" : "Ctrl+W",
      action: () => store.getState().removeTab(tab.id),
    },
    {
      id: "close-others",
      label: "Close Others",
      icon: <X size={14} />,
      action: () => {
        const { tabs, removeTab } = store.getState();
        tabs.forEach((t) => {
          if (t.id !== tab.id && !t.pinned) removeTab(t.id);
        });
      },
    },
    {
      id: "close-all",
      label: "Close All",
      icon: <X size={14} />,
      action: () => {
        const { tabs, removeTab } = store.getState();
        tabs.forEach((t) => {
          if (!t.pinned) removeTab(t.id);
        });
      },
    },
    {
      id: "sep1",
      label: "",
      separator: true,
      action: () => {},
    },
    {
      id: "rename",
      label: "Rename",
      icon: <Copy size={14} />,
      action: () => {
        document.dispatchEvent(
          new CustomEvent("open-rename-dialog", { detail: { tabId: tab.id, currentName: tab.title } }),
        );
      },
    },
    {
      id: "duplicate",
      label: "Duplicate",
      icon: <Copy size={14} />,
      shortcut: "Ctrl+Shift+D",
      action: () => {
        const tabStore = useTabStore.getState();
        const termStore = useTerminalStore.getState();
        const newId = tabStore.duplicateTab(tab.id);
        if (newId && (tab.type === "terminal" || tab.type === "split")) {
          const parentId = tab.sessionId ?? tab.id;
          const parentSession = termStore.sessions.get(parentId);
          termStore.addSession({
            id: newId,
            title: "Terminal",
            shell: parentSession?.shell ?? "",
            cwd: parentSession?.cwd ?? "",
            cols: parentSession?.cols ?? 80,
            rows: parentSession?.rows ?? 24,
            processId: null,
            createdAt: Date.now(),
          });
        }
      },
    },
    {
      id: "toggle-pin",
      label: tab.pinned ? "Unpin" : "Pin",
      icon: tab.pinned ? <PinOff size={14} /> : <Pin size={14} />,
      action: () => store.getState().togglePinTab(tab.id),
    },
    ...(tab.type === "terminal" || tab.type === "split"
      ? [
          {
            id: "sep2",
            label: "",
            separator: true,
            action: () => {},
          } as ContextMenuItem,
          {
            id: "split-h",
            label: "Split Horizontally",
            icon: <Columns2 size={14} />,
            shortcut: "Ctrl+\\",
            action: () => {
              const tabStore = useTabStore.getState();
              const termStore = useTerminalStore.getState();
              const newId = tabStore.splitHorizontal(tab.id);
              if (newId) {
                const parentId = tab.sessionId ?? tab.id;
                const parentSession = termStore.sessions.get(parentId);
                termStore.addSession({
                  id: newId,
                  title: "Terminal",
                  shell: parentSession?.shell ?? "",
                  cwd: parentSession?.cwd ?? "",
                  cols: parentSession?.cols ?? 80,
                  rows: parentSession?.rows ?? 24,
                  processId: null,
                  createdAt: Date.now(),
                });
              }
            },
          } as ContextMenuItem,
          {
            id: "split-v",
            label: "Split Vertically",
            icon: <Columns2Icon size={14} />,
            shortcut: "Ctrl+Shift+\\",
            action: () => {
              const tabStore = useTabStore.getState();
              const termStore = useTerminalStore.getState();
              const newId = tabStore.splitVertical(tab.id);
              if (newId) {
                const parentId = tab.sessionId ?? tab.id;
                const parentSession = termStore.sessions.get(parentId);
                termStore.addSession({
                  id: newId,
                  title: "Terminal",
                  shell: parentSession?.shell ?? "",
                  cwd: parentSession?.cwd ?? "",
                  cols: parentSession?.cols ?? 80,
                  rows: parentSession?.rows ?? 24,
                  processId: null,
                  createdAt: Date.now(),
                });
              }
            },
          } as ContextMenuItem,
        ]
      : []),
  ];

  return <ContextMenu isOpen={isOpen} x={x} y={y} items={items} onClose={onClose} />;
}
