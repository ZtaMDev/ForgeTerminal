import { useState, useEffect, useCallback, useRef } from "react";
import {
  Folder,
  FolderOpen,
  File,
  ArrowLeft,
  Check,
  X,
  ChevronRight,
  Home,
} from "lucide-react";
import { fsReadDir } from "@/lib/ipc";

interface FileEntry {
  name: string;
  path: string;
  is_dir: boolean;
}

interface PathPickerDialogProps {
  isOpen: boolean;
  title: string;
  confirmLabel: string;
  initialPath: string;
  onConfirm: (path: string) => void;
  onCancel: () => void;
}

export function PathPickerDialog({
  isOpen,
  title,
  confirmLabel,
  initialPath,
  onConfirm,
  onCancel,
}: PathPickerDialogProps) {
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [typedPath, setTypedPath] = useState(initialPath);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadDir = useCallback(async (path: string) => {
    setLoading(true);
    try {
      const raw = await fsReadDir(path);
      const dirs = raw
        .filter((e) => e.is_dir)
        .map((e) => ({ name: e.name, path: e.path, is_dir: true }))
        .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
      setEntries(dirs);
      setCurrentPath(path);
      setTypedPath(path);
    } catch {
      setEntries([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadDir(initialPath);
      setTypedPath(initialPath);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen, initialPath, loadDir]);

  const handleNavigate = useCallback(
    (entry: FileEntry) => {
      if (entry.is_dir) {
        loadDir(entry.path);
      }
    },
    [loadDir],
  );

  const handleGoUp = useCallback(() => {
    const parent = currentPath.split("\\").slice(0, -1).join("\\");
    if (parent && parent.length >= 3) {
      loadDir(parent);
    }
  }, [currentPath, loadDir]);

  const handleGoHome = useCallback(async () => {
    try {
      const { homeDir } = await import("@tauri-apps/api/path");
      const home = await homeDir();
      loadDir(home);
    } catch {
      // fallback
    }
  }, [loadDir]);

  const handleTypedPathSubmit = useCallback(() => {
    const trimmed = typedPath.trim();
    if (trimmed) {
      loadDir(trimmed);
    }
  }, [typedPath, loadDir]);

  const handleTypedPathKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleTypedPathSubmit();
      }
    },
    [handleTypedPathSubmit],
  );

  const handleConfirm = useCallback(() => {
    if (currentPath) {
      onConfirm(currentPath);
    }
  }, [currentPath, onConfirm]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="bg-bg-surface border border-surface1 rounded-xl shadow-2xl w-[520px] max-h-[600px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface0">
          <h2 className="text-sm font-semibold text-fg">{title}</h2>
          <button
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-surface0 text-fg-subtle hover:text-fg"
            onClick={onCancel}
          >
            <X size={14} />
          </button>
        </div>

        {/* Path input */}
        <div className="px-4 py-3 border-b border-surface0">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              className="flex-1 text-sm bg-surface0 text-fg px-3 py-1.5 rounded outline-none border border-surface1 focus:border-accent transition-colors font-mono"
              value={typedPath}
              onChange={(e) => setTypedPath(e.target.value)}
              onKeyDown={handleTypedPathKeyDown}
              placeholder="Enter a path..."
            />
            <button
              className="px-2.5 py-1.5 text-xs bg-surface0 text-fg-subtle rounded hover:text-fg hover:bg-surface1 transition-colors"
              onClick={handleTypedPathSubmit}
              title="Go to path"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Directory listing */}
        <div className="flex-1 overflow-y-auto min-h-0 px-2 py-2">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-xs text-fg-subtle">
              Loading...
            </div>
          ) : (
            <div className="space-y-0.5">
              {/* Parent directory */}
              <button
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-fg-subtle hover:text-fg hover:bg-surface0 transition-colors"
                onClick={handleGoUp}
              >
                <ArrowLeft size={14} />
                <span>..</span>
              </button>

              {/* Home button */}
              <button
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-fg-subtle hover:text-fg hover:bg-surface0 transition-colors"
                onClick={handleGoHome}
              >
                <Home size={14} />
                <span>Home</span>
              </button>

              <div className="h-[1px] bg-surface0 my-1" />

              {entries.length === 0 ? (
                <div className="py-4 text-xs text-fg-subtle text-center">
                  No subdirectories
                </div>
              ) : (
                entries.map((entry) => (
                  <button
                    key={entry.path}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-left transition-colors ${
                      currentPath === entry.path
                        ? "bg-surface0 text-fg"
                        : "text-fg-subtle hover:text-fg hover:bg-surface0"
                    }`}
                    onClick={() => handleNavigate(entry)}
                  >
                    <Folder size={14} className="text-sky flex-shrink-0" />
                    <span className="truncate">{entry.name}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-surface0">
          <span className="text-xs text-fg-subtle font-mono truncate max-w-[300px]">
            {currentPath}
          </span>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1.5 text-xs text-fg-subtle hover:text-fg rounded hover:bg-surface0 transition-colors"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              className="px-4 py-1.5 text-xs text-bg bg-accent rounded hover:opacity-90 transition-opacity flex items-center gap-1.5"
              onClick={handleConfirm}
            >
              <Check size={12} />
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
