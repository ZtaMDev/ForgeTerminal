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

  const filtered = query
    ? commands.filter((cmd) =>
        cmd.name.toLowerCase().includes(query.toLowerCase()) ||
        cmd.category.toLowerCase().includes(query.toLowerCase()),
      )
    : commands;

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const item = el.children[selectedIndex] as HTMLElement | undefined;
    if (item) {
      item.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  // Native DOM keyboard handler — works regardless of React event system quirks
  useEffect(() => {
    if (!isOpen) return;

    const handler = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          e.stopPropagation();
          setSelectedIndex((i) => (i + 1) % filtered.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          e.stopPropagation();
          setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length);
          break;
        case "Home":
          e.preventDefault();
          e.stopPropagation();
          setSelectedIndex(0);
          break;
        case "End":
          e.preventDefault();
          e.stopPropagation();
          setSelectedIndex(filtered.length - 1);
          break;
        case "Enter":
          e.preventDefault();
          e.stopPropagation();
          if (filtered[selectedIndex]) {
            filtered[selectedIndex].action();
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

    // Use capture phase to intercept before the app's own capture handler
    window.addEventListener("keydown", handler, { capture: true });
    return () => window.removeEventListener("keydown", handler, { capture: true });
  }, [isOpen, filtered, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      onClick={onClose}
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
              className={`flex items-center gap-3 px-4 py-2 cursor-pointer ${
                idx === selectedIndex
                  ? "bg-surface0 text-fg"
                  : "text-fg-alt hover:bg-surface0"
              }`}
              onClick={() => {
                cmd.action();
                onClose();
              }}
              onMouseEnter={() => setSelectedIndex(idx)}
            >
              <span className="text-xs text-fg-subtle bg-surface1 px-1.5 py-0.5 rounded w-16 text-center flex-shrink-0">
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
