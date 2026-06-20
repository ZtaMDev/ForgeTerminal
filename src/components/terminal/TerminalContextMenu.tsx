import { ContextMenu, type ContextMenuItem } from "@/components/common/ContextMenu";
import { useTabStore } from "@/stores/tabStore";
import { useTerminalStore } from "@/stores/terminalStore";
import type { Tab } from "@/types/terminal";
import { Columns2, Columns2Icon, X, Copy, SplitSquareHorizontal, SquareTerminal, Move } from "lucide-react";
import { getSessions } from "@/lib/splitUtils";

interface TerminalContextMenuProps {
  isOpen: boolean;
  x: number;
  y: number;
  tab: Tab;
  onClose: () => void;
}

export function TerminalContextMenu({ isOpen, x, y, tab, onClose }: TerminalContextMenuProps) {
  const isSplit = tab.type === "split" && tab.splitNode && getSessions(tab.splitNode).length > 1;
  const focusedId = useTerminalStore.getState().focusedSessionId;
  const isFocusedInSplit = isSplit && focusedId && getSessions(tab.splitNode!).includes(focusedId);

  const getParentSessionId = () => {
    if (isSplit && tab.splitNode) {
      const splits = getSessions(tab.splitNode);
      if (focusedId && splits.includes(focusedId)) {
        return focusedId;
      }
      return splits[0] ?? tab.id;
    }
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
      action: () => createSplitSession((id) => useTabStore.getState().splitHorizontal(id, focusedId || undefined)),
    },
    {
      id: "split-v",
      label: "Split Vertically",
      icon: <Columns2Icon size={14} />,
      shortcut: "Ctrl+Shift+\\",
      action: () => createSplitSession((id) => useTabStore.getState().splitVertical(id, focusedId || undefined)),
    },
    {
      id: "move-terminal",
      label: "Move Terminal",
      icon: <Move size={14} />,
      shortcut: "Drag Mode",
      action: () => {
        // We dispatch the event to trigger the drag mode overlay.
        // It requires a small delay to allow the context menu to close without eating the event or state.
        setTimeout(() => {
          const sessionId = focusedId || getParentSessionId();
          document.dispatchEvent(new CustomEvent("terminal-drag-start", { detail: { sessionId, x, y } }));
        }, 50);
      },
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
