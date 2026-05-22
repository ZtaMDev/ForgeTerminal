import { useMemo, useCallback, useRef, useEffect, useState } from "react";
import { FixedSizeList as List } from "react-window";
import {
  File,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  FileCode,
  FileImage,
  FileJson,
  FileText,
} from "lucide-react";
import { Loader2 } from "lucide-react";
import type { ExplorerNode } from "@/stores/explorerStore";
import { useExplorerStore } from "@/stores/explorerStore";
import { useTabStore } from "@/stores/tabStore";
import { useShortcutStore } from "@/stores/shortcutStore";

interface FileTreeProps {
  root: ExplorerNode;
  onLoadDirectory: (path: string, parentPath?: string) => void;
  showHiddenFiles: boolean;
  focusedIndex: number;
  onFocusChange: (index: number) => void;
  onContextMenu: (e: React.MouseEvent, node: ExplorerNode) => void;
  onRenameRequest: (node: ExplorerNode) => void;
  onDeleteRequest: (node: ExplorerNode) => void;
}

interface FlatItem {
  node: ExplorerNode;
  depth: number;
  isPlaceholder?: boolean;
}

const ROW_HEIGHT = 24;

const fileIcons: Record<string, typeof File> = {
  js: FileCode,
  jsx: FileCode,
  ts: FileCode,
  tsx: FileCode,
  rs: FileCode,
  py: FileCode,
  json: FileJson,
  jsonc: FileJson,
  md: FileText,
  txt: FileText,
  png: FileImage,
  jpg: FileImage,
  jpeg: FileImage,
  gif: FileImage,
  svg: FileImage,
  ico: FileImage,
};

function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return fileIcons[ext] ?? File;
}

function flattenTree(
  node: ExplorerNode,
  expandedPaths: Set<string>,
  showHidden: boolean,
): FlatItem[] {
  const items: FlatItem[] = [];

  function walk(n: ExplorerNode, depth: number) {
    if (depth > 0 && !showHidden && n.name.startsWith(".")) return;

    items.push({ node: n, depth });

    if (n.is_dir && expandedPaths.has(n.path)) {
      if (n.children) {
        for (const child of n.children) {
          walk(child, depth + 1);
        }
      } else if (n.loading) {
        // Loading placeholder shown as a child item
        items.push({ node: n, depth: depth + 1, isPlaceholder: true });
      }
    }
  }

  walk(node, 0);
  return items;
}

function openFileInEditor(node: ExplorerNode) {
  const id = crypto.randomUUID();
  useTabStore.getState().addTab({
    id,
    type: "editor",
    title: node.name,
    filePath: node.path,
    pinned: false,
    createdAt: Date.now(),
  });
}

export function FileTree({
  root,
  onLoadDirectory,
  showHiddenFiles,
  focusedIndex,
  onFocusChange,
  onContextMenu,
  onRenameRequest,
  onDeleteRequest,
}: FileTreeProps) {
  const expandedPaths = useExplorerStore((s) => s.expandedPaths);
  const selectedPath = useExplorerStore((s) => s.selectedPath);
  const toggleExpanded = useExplorerStore((s) => s.toggleExpanded);
  const setSelectedPath = useExplorerStore((s) => s.setSelectedPath);
  const listRef = useRef<List>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(300);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setHeight(entry.contentRect.height);
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const flatItems = useMemo(
    () => flattenTree(root, expandedPaths, showHiddenFiles),
    [root, expandedPaths, showHiddenFiles],
  );

  const prevLengthRef = useRef(flatItems.length);
  useEffect(() => {
    if (focusedIndex >= 0 && focusedIndex < flatItems.length) {
      // Only auto-scroll when focusedIndex changes (arrow keys), not when list grows/shrinks
      if (flatItems.length !== prevLengthRef.current) {
        prevLengthRef.current = flatItems.length;
        return;
      }
      listRef.current?.scrollToItem(focusedIndex, "smart");
    }
  }, [focusedIndex]);

  const updateNode = useExplorerStore((s) => s.updateNode);

  const handleRowClick = useCallback(
    (item: FlatItem) => {
      const { node } = item;
      setSelectedPath(node.path);

      if (node.is_dir) {
        if (!expandedPaths.has(node.path)) {
          // Mark as loading before async load so spinner appears
          if (!node.children) {
            updateNode(node.path, { loading: true });
          }
          toggleExpanded(node.path);
          if (!node.children) {
            onLoadDirectory(node.path, node.path);
          }
        } else {
          toggleExpanded(node.path);
        }
      }
    },
    [setSelectedPath, toggleExpanded, expandedPaths, onLoadDirectory, updateNode],
  );

  const handleRowDoubleClick = useCallback(
    (item: FlatItem) => {
      const { node } = item;
      setSelectedPath(node.path);
      if (node.is_dir) {
        if (expandedPaths.has(node.path)) {
          toggleExpanded(node.path);
        } else {
          toggleExpanded(node.path);
          if (!node.children) {
            onLoadDirectory(node.path, node.path);
          }
        }
      } else {
        openFileInEditor(node);
      }
    },
    [setSelectedPath, toggleExpanded, expandedPaths, onLoadDirectory],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const item = flatItems[focusedIndex];
      if (!item) return;

      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          const next = Math.min(focusedIndex + 1, flatItems.length - 1);
          onFocusChange(next);
          setSelectedPath(flatItems[next].node.path);
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          const prev = Math.max(focusedIndex - 1, 0);
          onFocusChange(prev);
          setSelectedPath(flatItems[prev].node.path);
          break;
        }
        case "ArrowRight": {
          e.preventDefault();
          if (item.node.is_dir && !expandedPaths.has(item.node.path)) {
            toggleExpanded(item.node.path);
            if (!item.node.children) {
              onLoadDirectory(item.node.path, item.node.path);
            }
          }
          break;
        }
        case "ArrowLeft": {
          e.preventDefault();
          if (item.node.is_dir && expandedPaths.has(item.node.path)) {
            toggleExpanded(item.node.path);
          }
          break;
        }
        case "Enter": {
          e.preventDefault();
          if (item.node.is_dir) {
            if (expandedPaths.has(item.node.path)) {
              toggleExpanded(item.node.path);
            } else {
              toggleExpanded(item.node.path);
              if (!item.node.children) {
                onLoadDirectory(item.node.path, item.node.path);
              }
            }
          } else {
            openFileInEditor(item.node);
          }
          break;
        }
        case " ": {
          e.preventDefault();
          if (item.node.is_dir) {
            if (!expandedPaths.has(item.node.path)) {
              toggleExpanded(item.node.path);
              if (!item.node.children) {
                onLoadDirectory(item.node.path, item.node.path);
              }
            }
          }
          break;
        }
        case "F2": {
          e.preventDefault();
          onRenameRequest(item.node);
          break;
        }
        case "Delete": {
          e.preventDefault();
          onDeleteRequest(item.node);
          break;
        }
      }
    },
    [flatItems, focusedIndex, onFocusChange, setSelectedPath, toggleExpanded, expandedPaths, onLoadDirectory, onRenameRequest, onDeleteRequest],
  );

  const Row = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const item = flatItems[index];
      if (!item) return null;

      const { node, depth, isPlaceholder } = item;

      // Loading placeholder row
      if (isPlaceholder) {
        return (
          <div
            style={style}
            className="flex items-center gap-2 text-fg-subtle text-xs"
          >
            <span
              className="flex-shrink-0"
              style={{ width: `${12 + depth * 16}px` }}
            />
            <Loader2 size={12} className="animate-spin text-fg-subtle" />
            <span>loading...</span>
          </div>
        );
      }

      const isSelected = selectedPath === node.path;
      const isExpanded = expandedPaths.has(node.path);
      const Icon = node.is_dir
        ? isExpanded
          ? FolderOpen
          : Folder
        : getFileIcon(node.name);
      const iconColor = node.is_dir ? "text-sky" : "text-fg-subtle";

      return (
        <div
          style={style}
          className={`flex items-center gap-1 pr-2 cursor-pointer text-xs hover-bg group ${
            isSelected ? "active-bg" : ""
          } ${focusedIndex === index ? "ring-1 ring-accent/40" : ""}`}
          onClick={() => handleRowClick(item)}
          onDoubleClick={() => handleRowDoubleClick(item)}
          onContextMenu={(e) => onContextMenu(e, node)}
        >
          <span
            className="flex items-center flex-shrink-0"
            style={{ width: `${12 + depth * 16}px` }}
          >
            {node.is_dir && (
              <span className="w-4 h-4 flex items-center justify-center">
                {isExpanded ? (
                  <ChevronDown size={12} className="text-fg-subtle" />
                ) : (
                  <ChevronRight size={12} className="text-fg-subtle" />
                )}
              </span>
            )}
          </span>

          <Icon size={14} className={`flex-shrink-0 ${iconColor}`} />

          <span className="truncate text-fg group-hover:text-fg transition-colors duration-100">
            {node.name}
          </span>
        </div>
      );
    },
    [flatItems, selectedPath, expandedPaths, focusedIndex, handleRowClick, handleRowDoubleClick, onContextMenu],
  );

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      data-explorer="true"
      className="flex-1 min-h-0 outline-none"
      onFocus={() => useShortcutStore.getState().setContext("explorer")}
      onKeyDown={handleKeyDown}
    >
      <List
        ref={listRef}
        height={height}
        itemCount={flatItems.length}
        itemSize={ROW_HEIGHT}
        width="100%"
        overscanCount={20}
      >
        {Row}
      </List>
    </div>
  );
}
