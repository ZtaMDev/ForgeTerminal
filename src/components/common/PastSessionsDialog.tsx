import { useState, useEffect, useRef } from "react";
import { Folder, Trash2, X } from "lucide-react";
import { useConfigStore } from "@/stores/configStore";

interface PastSessionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (path: string) => void;
}

export function PastSessionsDialog({
  isOpen,
  onClose,
  onSelect,
}: PastSessionsDialogProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const selectedIndexRef = useRef(0);
  
  const config = useConfigStore((s) => s.config);
  const clearPastPaths = useConfigStore((s) => s.clearPastPaths);
  const pastPaths = config.session.pastPaths || [];
  
  const animSpeed = config.theme.animations.enabled ? config.theme.animations.speed : 0;

  useEffect(() => { selectedIndexRef.current = selectedIndex; }, [selectedIndex]);

  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0);
      setMounted(true);
      if (!document.querySelector('[data-tutorial="true"]')) {
        setTimeout(() => overlayRef.current?.focus(), 50);
      }
    } else if (mounted) {
      const t = setTimeout(() => setMounted(false), animSpeed);
      return () => clearTimeout(t);
    }
  }, [isOpen, animSpeed]);

  useEffect(() => {
    if (!listRef.current) return;
    const list = listRef.current;
    const options = list.querySelectorAll('[role="option"]');
    const child = options[selectedIndex] as HTMLElement | undefined;
    if (child) {
      const itemRect = child.getBoundingClientRect();
      const containerRect = list.getBoundingClientRect();
      const relTop = itemRect.top - containerRect.top;
      const relBottom = itemRect.bottom - containerRect.top;
      if (relTop < 0) {
        list.scrollTop += relTop;
      } else if (relBottom > list.clientHeight) {
        list.scrollTop += relBottom - list.clientHeight;
      }
    }
  }, [selectedIndex]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (document.querySelector('[data-tutorial="true"]')) return;
      const currentIdx = selectedIndexRef.current;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          e.stopPropagation();
          setSelectedIndex((i) => (i + 1) % pastPaths.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          e.stopPropagation();
          setSelectedIndex((i) => (i - 1 + pastPaths.length) % pastPaths.length);
          break;
        case "Home":
          e.preventDefault();
          e.stopPropagation();
          setSelectedIndex(0);
          break;
        case "End":
          e.preventDefault();
          e.stopPropagation();
          setSelectedIndex(pastPaths.length - 1);
          break;
        case "Enter":
          e.preventDefault();
          e.stopPropagation();
          if (pastPaths[currentIdx]) {
            onSelect(pastPaths[currentIdx]);
            onClose();
          }
          break;
        case "Escape":
          e.preventDefault();
          e.stopPropagation();
          onClose();
          break;
      }
    };

    document.addEventListener("keydown", handler, true);
    return () => document.removeEventListener("keydown", handler, true);
  }, [isOpen, onClose, pastPaths, onSelect]);

  if (!mounted && !isOpen) return null;

  return (
    <div
      ref={overlayRef}
      data-overlay="true"
      tabIndex={-1}
      className={`fixed inset-0 z-50 flex items-start justify-center pt-[15vh] outline-none ${isOpen ? "anim-overlay" : "anim-overlay-out"}`}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-[500px] max-w-[90vw] bg-bg-surface border border-surface1 rounded-lg shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface0">
          <div className="flex items-center gap-2 text-fg">
            <Folder size={16} className="text-accent" />
            <span className="text-sm font-medium">Past Sessions</span>
          </div>
          <button
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-surface0 text-fg-subtle hover:text-fg transition-colors"
            onClick={onClose}
          >
            <X size={14} />
          </button>
        </div>

        <div ref={listRef} className="max-h-[300px] overflow-y-auto py-2">
          {pastPaths.length === 0 && (
            <div className="px-4 py-6 text-center text-fg-subtle text-sm">
              No past sessions found.
            </div>
          )}

          {pastPaths.map((path, idx) => (
            <div
              key={path}
              role="option"
              aria-selected={idx === selectedIndex}
              className={`flex items-center gap-3 px-4 py-2 cursor-pointer border-l-2 transition-colors ${
                idx === selectedIndex
                  ? "border-accent bg-surface1 text-fg font-medium"
                  : "border-transparent text-fg-alt hover:bg-surface1/50 hover:border-l-2 hover:border-surface1"
              }`}
              onMouseEnter={() => setSelectedIndex(idx)}
              onClick={() => {
                onSelect(path);
                onClose();
              }}
            >
              <span className="flex-1 text-sm font-mono truncate" title={path}>{path}</span>
            </div>
          ))}
        </div>

        {pastPaths.length > 0 && (
          <div className="border-t border-surface0 p-2 flex justify-end">
            <button
              onClick={() => clearPastPaths()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-400 hover:bg-red-400/10 hover:text-red-300 rounded transition-colors"
            >
              <Trash2 size={12} />
              Clear History
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
