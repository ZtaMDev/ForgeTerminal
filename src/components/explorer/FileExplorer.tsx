import { useEffect, useCallback, useState, useRef } from "react";
import {
  Pin,
  PinOff,
  FolderOpen,
  RefreshCw,
  FolderInput,
} from "lucide-react";
import { useExplorerStore } from "@/stores/explorerStore";
import { useConfigStore } from "@/stores/configStore";
import { useShortcutStore } from "@/stores/shortcutStore";
import {
  fsReadDir,
  fsCreateDir,
  fsWriteFile,
  fsRemove,
  fsRename,
} from "@/lib/ipc";
import { FileTree } from "./FileTree";
import { ExplorerContextMenu } from "./ExplorerContextMenu";
import { NewItemDialog } from "./NewItemDialog";
import type { ExplorerNode } from "@/stores/explorerStore";

interface FileExplorerProps {
  width: number;
}

export function FileExplorer({ width }: FileExplorerProps) {
  const config = useConfigStore((s) => s.config);
  const {
    root,
    currentPath,
    isPinned,
    pinnedPath,
    expandedPaths,
    togglePin,
    setCurrentPath,
    setRoot,
    setChildren,
    updateNode,
    selectedPath,
    setSelectedPath,
  } = useExplorerStore();

  const [focusedIndex, setFocusedIndex] = useState(0);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    node: ExplorerNode;
  } | null>(null);
  const [newItemDialog, setNewItemDialog] = useState<{
    parentPath: string;
    type: "file" | "folder";
  } | null>(null);
  const [renameNode, setRenameNode] = useState<ExplorerNode | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const showHiddenFiles = config.explorer.showHiddenFiles;

  const loadDirectory = useCallback(
    async (path: string, parentPath?: string) => {
      try {
        const entries = await fsReadDir(path);
        const nodes = entries.map((entry) => ({
          name: entry.name,
          path: entry.path,
          is_dir: entry.is_dir,
          size: entry.size,
          modified_at: entry.modified_at,
          expanded: false,
          loading: false,
          depth: 0,
        }));

        if (parentPath) {
          setChildren(parentPath, nodes);
        } else {
          setRoot({
            name: path.split("\\").pop() || path,
            path,
            is_dir: true,
            size: 0,
            modified_at: "",
            children: nodes,
            expanded: true,
            loading: false,
            depth: 0,
          });
        }
      } catch (e) {
        console.error("Failed to load directory:", e);
      }
    },
    [setRoot, setChildren],
  );

  useEffect(() => {
    const targetPath = isPinned
      ? pinnedPath
      : currentPath || "";
    if (targetPath) {
      loadDirectory(targetPath);
    }
  }, [currentPath, isPinned, pinnedPath, loadDirectory]);

  // Auto-load children for expanded folders (e.g. after restoring per-tab state)
  const loadedPathsRef = useRef<Set<string>>(new Set());
  const prevRootPath = useRef<string | null>(null);
  useEffect(() => {
    // Reset loadedPaths when root path changes (tab switch loads a different directory)
    if (root?.path !== prevRootPath.current) {
      prevRootPath.current = root?.path ?? null;
      loadedPathsRef.current = new Set();
    }
    const currentRoot = useExplorerStore.getState().root;
    if (!currentRoot) return;

    function findMissing(node: ExplorerNode) {
      if (node.is_dir && expandedPaths.has(node.path) && !node.children && !node.loading && !loadedPathsRef.current.has(node.path)) {
        loadedPathsRef.current.add(node.path);
        updateNode(node.path, { loading: true });
        loadDirectory(node.path, node.path);
      }
      if (node.children) {
        node.children.forEach(findMissing);
      }
    }
    findMissing(currentRoot);
  }, [expandedPaths, root?.path]);

  const handleRefresh = useCallback(() => {
    const path = isPinned ? pinnedPath : currentPath;
    if (path) {
      const currentRoot = useExplorerStore.getState().root;
      if (currentRoot) {
        useExplorerStore.getState().toggleExpanded(currentRoot.path);
        useExplorerStore.getState().toggleExpanded(currentRoot.path);
      }
      loadDirectory(path);
    }
  }, [isPinned, pinnedPath, currentPath, loadDirectory]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, node: ExplorerNode) => {
      e.preventDefault();
      setSelectedPath(node.path);
      setContextMenu({ x: e.clientX, y: e.clientY, node });

      setFocusedIndex(0);
      useShortcutStore.getState().setContext("explorer");
    },
    [setSelectedPath],
  );

  const getContextNode = useCallback(() => {
    if (contextMenu) return contextMenu.node;
    if (selectedPath && root) {
      const flat = flattenTreeForSearch(root, useExplorerStore.getState().expandedPaths, showHiddenFiles);
      const found = flat.find((f) => f.node.path === selectedPath);
      if (found) return found.node;
    }
    return root ?? null;
  }, [contextMenu, selectedPath, root, showHiddenFiles]);

  const handleNewFile = useCallback(async () => {
    const parent = getContextNode();
    const parentPath = parent?.is_dir ? parent.path : parent?.path.split("\\").slice(0, -1).join("\\");
    if (parentPath) {
      setNewItemDialog({ parentPath, type: "file" });
    }
  }, [getContextNode]);

  const handleNewFolder = useCallback(async () => {
    const parent = getContextNode();
    const parentPath = parent?.is_dir ? parent.path : parent?.path.split("\\").slice(0, -1).join("\\");
    if (parentPath) {
      setNewItemDialog({ parentPath, type: "folder" });
    }
  }, [getContextNode]);

  const handleNewItemConfirm = useCallback(
    async (name: string) => {
      if (!newItemDialog) return;

      const fullPath = `${newItemDialog.parentPath}\\${name}`;
      try {
        if (newItemDialog.type === "folder") {
          await fsCreateDir(fullPath);
        } else {
          await fsWriteFile(fullPath, "");
        }
        await loadDirectory(newItemDialog.parentPath, newItemDialog.parentPath);
      } catch (e) {
        console.error("Failed to create item:", e);
      }
      setNewItemDialog(null);
    },
    [newItemDialog, loadDirectory],
  );

  const handleRename = useCallback(() => {
    const node = getContextNode();
    if (node) {
      setRenameNode(node);
      setRenameValue(node.name);
    }
  }, [getContextNode]);

  const handleRenameConfirm = useCallback(
    async (name: string) => {
      if (!renameNode) return;
      const parentPath = renameNode.path.split("\\").slice(0, -1).join("\\");
      const newPath = `${parentPath}\\${name}`;
      try {
        await fsRename(renameNode.path, newPath);
        await loadDirectory(parentPath, parentPath);
      } catch (e) {
        console.error("Failed to rename:", e);
      }
      setRenameNode(null);
    },
    [renameNode, loadDirectory],
  );

  const handleDelete = useCallback(async () => {
    const node = getContextNode();
    if (!node) return;

    const confirmMsg = node.is_dir
      ? `Delete folder "${node.name}" and all its contents?`
      : `Delete file "${node.name}"?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await fsRemove(node.path);
      const parentPath = node.path.split("\\").slice(0, -1).join("\\");
      await loadDirectory(parentPath, parentPath);
      setSelectedPath(null);
    } catch (e) {
      console.error("Failed to delete:", e);
    }
  }, [getContextNode, loadDirectory, setSelectedPath]);

  const handleReveal = useCallback(async () => {
    const node = getContextNode();
    if (!node) return;
    try {
      const { Command } = await import("@tauri-apps/plugin-shell");
      const targetPath = node.is_dir ? node.path : node.path;
      await Command.create("explorer", ["/select,", targetPath]).execute();
    } catch (e) {
      console.error("Failed to reveal in explorer:", e);
    }
  }, [getContextNode]);

  return (
    <div
      className="panel-bg border-r border-surface0 flex flex-col flex-shrink-0 overflow-hidden"
      style={{ width }}
    >
      <div className="h-9 flex items-center justify-between px-3 border-b border-surface0 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <FolderOpen size={14} className="text-peach" />
          <span className="text-xs text-fg font-medium">Explorer</span>
        </div>

        <div className="flex items-center gap-0.5">
          <button
            className="w-6 h-6 flex items-center justify-center rounded hover-bg text-fg-subtle"
            onClick={() => document.dispatchEvent(new CustomEvent("open-explorer-root-picker"))}
            title="Change Explorer Root (Ctrl+Shift+O)"
          >
            <FolderInput size={12} />
          </button>
          <button
            className={`w-6 h-6 flex items-center justify-center rounded hover-bg ${
              isPinned ? "text-accent" : "text-fg-subtle"
            }`}
            onClick={togglePin}
            title="Pin Explorer (keep current path)"
          >
            {isPinned ? <PinOff size={12} /> : <Pin size={12} />}
          </button>
          <button
            className="w-6 h-6 flex items-center justify-center rounded hover-bg text-fg-subtle"
            onClick={handleRefresh}
            title="Refresh"
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 relative flex flex-col">
        {root ? (
          <FileTree
            root={root}
            onLoadDirectory={loadDirectory}
            showHiddenFiles={showHiddenFiles}
            focusedIndex={focusedIndex}
            onFocusChange={setFocusedIndex}
            onContextMenu={handleContextMenu}
            onRenameRequest={(node) => {
              setRenameNode(node);
              setRenameValue(node.name);
            }}
            onDeleteRequest={handleDelete}
          />
        ) : (
          <div className="p-4 text-xs text-fg-subtle text-center">
            No directory selected
          </div>
        )}
      </div>

      <ExplorerContextMenu
        isOpen={contextMenu !== null}
        x={contextMenu?.x ?? 0}
        y={contextMenu?.y ?? 0}
        isDir={contextMenu?.node?.is_dir ?? false}
        isRoot={contextMenu?.node?.path === root?.path}
        onClose={() => setContextMenu(null)}
        onNewFile={handleNewFile}
        onNewFolder={handleNewFolder}
        onRename={handleRename}
        onDelete={handleDelete}
        onRefresh={handleRefresh}
        onReveal={handleReveal}
      />

      <NewItemDialog
        isOpen={newItemDialog !== null}
        itemType={newItemDialog?.type ?? "file"}
        onConfirm={handleNewItemConfirm}
        onCancel={() => setNewItemDialog(null)}
      />

      {renameNode && (
        <RenameOverlay
          currentName={renameValue}
          onConfirm={handleRenameConfirm}
          onCancel={() => setRenameNode(null)}
        />
      )}
    </div>
  );
}

function RenameOverlay({
  currentName,
  onConfirm,
  onCancel,
}: {
  currentName: string;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(currentName);
  const inputRef = useCallback((el: HTMLInputElement | null) => {
    if (el) {
      el.select();
      el.focus();
    }
  }, []);

  const handleConfirm = () => {
    const trimmed = value.trim();
    if (trimmed) {
      onConfirm(trimmed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleConfirm();
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="bg-bg-surface border border-surface1 rounded-lg shadow-xl p-4 min-w-[280px]">
        <label className="block text-xs text-fg-subtle mb-2">Rename</label>
        <input
          ref={inputRef}
          className="w-full text-sm bg-surface0 text-fg px-3 py-2 rounded outline-none border border-surface1 focus:border-accent transition-colors"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="flex justify-end gap-2 mt-3">
          <button
            className="px-3 py-1.5 text-xs text-fg-subtle hover:text-fg rounded hover:bg-surface0 transition-colors"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="px-3 py-1.5 text-xs text-bg bg-accent rounded hover:opacity-90 transition-opacity"
            onClick={handleConfirm}
          >
            Rename
          </button>
        </div>
      </div>
    </div>
  );
}

function flattenTreeForSearch(
  node: ExplorerNode,
  expandedPaths: Set<string>,
  showHidden: boolean,
): Array<{ node: ExplorerNode; depth: number }> {
  const items: Array<{ node: ExplorerNode; depth: number }> = [];

  function walk(n: ExplorerNode, depth: number) {
    if (depth > 0 && !showHidden && n.name.startsWith(".")) return;
    items.push({ node: n, depth });
    if (n.is_dir && expandedPaths.has(n.path) && n.children) {
      for (const child of n.children) {
        walk(child, depth + 1);
      }
    }
  }

  walk(node, 0);
  return items;
}
