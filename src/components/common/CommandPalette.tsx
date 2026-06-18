import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";

export interface Command {
  id: string;
  name: string;
  description?: string;
  shortcut?: string;
  category: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: Command[];
}

export function CommandPalette({
  isOpen,
  onClose,
  commands,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const selectedIndexRef = useRef(0);
  const filteredRef = useRef<Command[]>([]);

  const filtered = query
    ? commands.filter((cmd) =>
        cmd.name.toLowerCase().includes(query.toLowerCase()) ||
        cmd.category.toLowerCase().includes(query.toLowerCase()),
      )
    : commands;

  useEffect(() => { filteredRef.current = filtered; }, [filtered]);
  useEffect(() => { selectedIndexRef.current = selectedIndex; }, [selectedIndex]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

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
      const currentItems = filteredRef.current;
      const currentIdx = selectedIndexRef.current;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          e.stopPropagation();
          setSelectedIndex((i) => (i + 1) % currentItems.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          e.stopPropagation();
          setSelectedIndex((i) => (i - 1 + currentItems.length) % currentItems.length);
          break;
        case "Home":
          e.preventDefault();
          e.stopPropagation();
          setSelectedIndex(0);
          break;
        case "End":
          e.preventDefault();
          e.stopPropagation();
          setSelectedIndex(currentItems.length - 1);
          break;
        case "Enter":
          e.preventDefault();
          e.stopPropagation();
          if (currentItems[currentIdx]) {
            currentItems[currentIdx].action();
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
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      data-overlay="true"
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] outline-none"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-[600px] max-w-[90vw] bg-bg-surface border border-surface1 rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-surface0">
          <Search size={16} className="text-fg-subtle flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command..."
            className="flex-1 bg-transparent border-none outline-none text-fg text-sm placeholder:text-fg-subtle"
          />
          <span className="text-[10px] text-fg-subtle bg-surface0 px-1.5 py-0.5 rounded">
            ESC
          </span>
        </div>

        <div ref={listRef} className="max-h-[400px] overflow-y-auto">
          {filtered.length === 0 && (
            <div className="px-4 py-6 text-center text-fg-subtle text-sm">
              No matching commands found
            </div>
          )}

          {filtered.map((cmd, idx) => (
            <div
              key={cmd.id}
              role="option"
              aria-selected={idx === selectedIndex}
              className={`flex items-center gap-3 px-4 py-2 cursor-pointer border-l-2 transition-colors ${
                idx === selectedIndex
                  ? "border-accent bg-surface1 text-fg font-medium"
                  : "border-transparent text-fg-alt hover:bg-surface1/50 hover:border-l-2 hover:border-surface1"
              }`}
              onClick={() => {
                cmd.action();
                onClose();
              }}
            >
              <span className="text-xs text-fg-subtle bg-surface0 px-1.5 py-0.5 rounded w-16 text-center flex-shrink-0">
                {cmd.category}
              </span>
              <span className="flex-1 text-sm truncate">{cmd.name}</span>
              {cmd.shortcut && (
                <span className="text-[10px] text-fg-subtle flex-shrink-0">
                  {cmd.shortcut}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
