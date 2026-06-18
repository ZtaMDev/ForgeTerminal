import { useState, useRef, useCallback } from "react";
import { Terminal, Image, Columns2, X, Pin } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTabStore } from "@/stores/tabStore";
import { TabContextMenu } from "./TabContextMenu";
import type { Tab as TabType } from "@/types/terminal";

interface TabProps {
  tab: TabType;
  isActive: boolean;
  onSelect: () => void;
  onClose: () => void;
}

const tabIcons: Record<string, typeof Terminal> = {
  terminal: Terminal,
  viewer: Image,
  split: Columns2,
};

const tabColors: Record<string, string> = {
  terminal: "text-green",
  viewer: "text-peach",
  split: "text-cyan",
};

export function Tab({ tab, isActive, onSelect, onClose }: TabProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(tab.title);
  const [ctx, setCtx] = useState<{ x: number; y: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tab.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleDoubleClick = useCallback(() => {
    setEditValue(tab.title);
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }, [tab.title]);

  const handleRename = useCallback(() => {
    setEditing(false);
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== tab.title) {
      useTabStore.getState().updateTab(tab.id, { title: trimmed });
    }
  }, [editValue, tab.id, tab.title]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleRename();
      } else if (e.key === "Escape") {
        setEditing(false);
      }
    },
    [handleRename],
  );

  const handleMiddleClick = (e: React.MouseEvent) => {
    if (e.button === 1) {
      e.preventDefault();
      onClose();
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setCtx({ x: e.clientX, y: e.clientY });
  };

  const Icon = tabIcons[tab.type] ?? Terminal;

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`group flex items-center gap-1.5 px-3 py-1.5 cursor-pointer border-r border-surface0 min-w-0 max-w-[200px] transition-colors duration-100 ${
          isActive
            ? "bg-bg text-fg border-b-2 border-b-accent"
            : "bg-bg-alt text-fg-subtle hover-bg hover:text-fg"
        }`}
        onClick={onSelect}
        onMouseDown={handleMiddleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        title={tab.title}
      >
        <Icon size={14} className={`flex-shrink-0 ${tabColors[tab.type] ?? ""}`} />

        {editing ? (
          <input
            ref={inputRef}
            className="text-xs bg-surface0 text-fg px-1 py-0.5 rounded outline-none border border-accent min-w-0 flex-1"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleRename}
            onKeyDown={handleKeyDown}
          />
        ) : (
          <span className="text-xs truncate flex-1 min-w-0">{tab.title}</span>
        )}

        {tab.pinned && <Pin size={12} className="flex-shrink-0 text-fg-subtle rotate-45" />}

        {!tab.pinned && (
          <button
            className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-100 p-0.5 rounded hover:bg-surface0 text-fg-subtle hover:text-fg"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label="Close tab"
          >
            <X size={12} />
          </button>
        )}
      </div>

      <TabContextMenu
        isOpen={ctx !== null}
        x={ctx?.x ?? 0}
        y={ctx?.y ?? 0}
        tab={tab}
        onClose={() => setCtx(null)}
      />
    </>
  );
}
