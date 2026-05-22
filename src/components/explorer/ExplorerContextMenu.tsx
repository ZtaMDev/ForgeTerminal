import { useEffect, useRef } from "react";
import {
  FilePlus,
  FolderPlus,
  Pencil,
  Trash2,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

interface ExplorerContextMenuProps {
  isOpen: boolean;
  x: number;
  y: number;
  isDir: boolean;
  isRoot: boolean;
  onClose: () => void;
  onNewFile: () => void;
  onNewFolder: () => void;
  onRename: () => void;
  onDelete: () => void;
  onRefresh: () => void;
  onReveal: () => void;
}

export function ExplorerContextMenu({
  isOpen,
  x,
  y,
  isDir,
  isRoot,
  onClose,
  onNewFile,
  onNewFolder,
  onRename,
  onDelete,
  onRefresh,
  onReveal,
}: ExplorerContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const adjustedX = Math.min(x, window.innerWidth - 200);
  const adjustedY = Math.min(y, window.innerHeight - 280);

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-bg-surface border border-surface1 rounded-lg shadow-xl py-1 min-w-[180px]"
      style={{ left: adjustedX, top: adjustedY }}
    >
      {isDir && (
        <>
          <button
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-fg hover:bg-surface0"
            onClick={() => { onNewFile(); onClose(); }}
          >
            <FilePlus size={14} className="text-fg-subtle" />
            <span>New File</span>
          </button>
          <button
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-fg hover:bg-surface0"
            onClick={() => { onNewFolder(); onClose(); }}
          >
            <FolderPlus size={14} className="text-fg-subtle" />
            <span>New Folder</span>
          </button>
          <div className="h-[1px] bg-surface0 my-1" />
        </>
      )}

      {!isRoot && (
        <>
          <button
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-fg hover:bg-surface0"
            onClick={() => { onRename(); onClose(); }}
          >
            <Pencil size={14} className="text-fg-subtle" />
            <span>Rename</span>
            <span className="ml-auto text-fg-subtle">F2</span>
          </button>
          <button
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red hover:bg-surface0"
            onClick={() => { onDelete(); onClose(); }}
          >
            <Trash2 size={14} />
            <span>Delete</span>
            <span className="ml-auto text-fg-subtle">Del</span>
          </button>
          <div className="h-[1px] bg-surface0 my-1" />
        </>
      )}

      <button
        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-fg hover:bg-surface0"
        onClick={() => { onRefresh(); onClose(); }}
      >
        <RefreshCw size={14} className="text-fg-subtle" />
        <span>Refresh</span>
      </button>

      <button
        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-fg hover:bg-surface0"
        onClick={() => { onReveal(); onClose(); }}
      >
        <ExternalLink size={14} className="text-fg-subtle" />
        <span>Reveal in File Explorer</span>
      </button>
    </div>
  );
}
