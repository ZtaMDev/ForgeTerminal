import { ContextMenu, type ContextMenuItem } from "@/components/common/ContextMenu";
import { useTabStore } from "@/stores/tabStore";
import { useTerminalStore } from "@/stores/terminalStore";
import type { Tab } from "@/types/terminal";
import { Columns2, Columns2Icon, X, Copy, SplitSquareHorizontal, SquareTerminal } from "lucide-react";

interface TerminalContextMenuProps {
  isOpen: boolean;
  x: number;
  y: number;
  tab: Tab;
  onClose: () => void;
}

export function TerminalContextMenu({ isOpen, x, y, tab, onClose }: TerminalContextMenuProps) {
  const isSplit = tab.type === "split" && tab.splitLayout && tab.splitLayout.splits.length > 1;
  const focusedId = useTerminalStore.getState().focusedSessionId;
  const isFocusedInSplit = isSplit && focusedId && tab.splitLayout!.splits.includes(focusedId);

  const getParentSessionId = () => {
    if (isSplit && focusedId) return focusedId;
    return tab.sessionId ?? tab.id;
  };

  const createSplitSession = (splitFn: (tabId: string) => string | undefined) => {
    const tabStore = useTabStore.getState();
    const termStore = useTerminalStore.getState();
    const newId = splitFn(tab.id);
    if (newId) {
      const parentId = getParentSessionId();
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
  };

  const items: ContextMenuItem[] = [
    {
      id: "split-h",
      label: "Split Horizontally",
      icon: <Columns2 size={14} />,
      shortcut: "Ctrl+\\",
      action: () => createSplitSession((id) => useTabStore.getState().splitHorizontal(id)),
    },
    {
      id: "split-v",
      label: "Split Vertically",
      icon: <Columns2Icon size={14} />,
      shortcut: "Ctrl+Shift+\\",
      action: () => createSplitSession((id) => useTabStore.getState().splitVertical(id)),
    },
    {
      id: "sep1",
      label: "",
      separator: true,
      action: () => {},
    },
    ...(isSplit && isFocusedInSplit
      ? [
          {
            id: "close-pane",
            label: "Close This Terminal",
            icon: <SquareTerminal size={14} />,
            shortcut: "Ctrl+W",
            action: () => useTabStore.getState().closeSplit(tab.id, focusedId!),
          } as ContextMenuItem,
        ]
      : []),
    {
      id: "close-tab",
      label: isSplit ? "Close Entire Tab" : "Close Tab",
      icon: <X size={14} />,
      shortcut: isSplit ? "Ctrl+Shift+W" : "Ctrl+W",
      action: () => useTabStore.getState().removeTab(tab.id),
    },
    {
      id: "sep2",
      label: "",
      separator: true,
      action: () => {},
    },
    {
      id: "rename",
      label: "Rename Tab",
      icon: <Copy size={14} />,
      shortcut: "Ctrl+Shift+R",
      action: () => {
        document.dispatchEvent(
          new CustomEvent("open-rename-dialog", { detail: { tabId: tab.id, currentName: tab.title } }),
        );
      },
    },
    {
      id: "duplicate",
      label: "Duplicate Tab",
      icon: <Copy size={14} />,
      shortcut: "Ctrl+Shift+D",
      action: () => useTabStore.getState().duplicateTab(tab.id),
    },
  ];

  return <ContextMenu isOpen={isOpen} x={x} y={y} items={items} onClose={onClose} />;
}
