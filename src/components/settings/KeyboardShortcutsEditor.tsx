import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Search,
  Keyboard,
  RotateCcw,
  X,
  AlertTriangle,
  Trash2,
  Edit2,
  Check,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { useConfigStore } from "@/stores/configStore";
import {
  shortcutDefinitions,
  eventToShortcutString,
  splitShortcutParts,
  type ShortcutDefinition,
} from "@/lib/shortcuts";

interface KeyboardShortcutsEditorProps {
  isOpen: boolean;
  onClose: () => void;
}

// header = "Restore Defaults" button in top-right corner
type FocusZone = "header" | "search" | "tags" | "list";
type ActionButton = "record" | "reset" | "unbind";

export function KeyboardShortcutsEditor({ isOpen, onClose }: KeyboardShortcutsEditorProps) {
  const { config, setShortcutBinding, resetShortcuts, saveConfig } = useConfigStore();
  const commandKey = config.shortcuts.commandKey || "`";

  const [query, setQuery] = useState("");
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);
  const [focusZone, setFocusZone] = useState<FocusZone>("list");
  const [isTypingSearch, setIsTypingSearch] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [focusedButton, setFocusedButton] = useState<ActionButton>("record");
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [heldModifiers, setHeldModifiers] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [resetFeedback, setResetFeedback] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tagsRef = useRef<HTMLDivElement>(null);
  const animSpeed = config.theme.animations.enabled ? config.theme.animations.speed : 0;

  const groups = useMemo(() => {
    const set = new Set<string>();
    shortcutDefinitions.forEach((d) => set.add(d.group));
    return ["All", ...Array.from(set)];
  }, []);

  const selectedGroup = groups[selectedGroupIndex] || "All";

  const filteredDefinitions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return shortcutDefinitions.filter((def) => {
      if (selectedGroup !== "All" && def.group !== selectedGroup) return false;
      if (!q) return true;
      const currentKeys =
        def.category === "global"
          ? config.shortcuts.global[def.id] || []
          : config.shortcuts.terminal[def.id] || [];
      const keysStr = currentKeys.join(" ").toLowerCase();
      return (
        def.name.toLowerCase().includes(q) ||
        def.description.toLowerCase().includes(q) ||
        def.id.toLowerCase().includes(q) ||
        def.group.toLowerCase().includes(q) ||
        keysStr.includes(q)
      );
    });
  }, [query, selectedGroup, config.shortcuts]);

  const conflictMap = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const def of shortcutDefinitions) {
      const keys =
        def.category === "global"
          ? config.shortcuts.global[def.id] || []
          : config.shortcuts.terminal[def.id] || [];
      for (const k of keys) {
        const normalized = k.trim().toLowerCase();
        if (!normalized) continue;
        const existing = map.get(normalized) || [];
        existing.push(def.name);
        map.set(normalized, existing);
      }
    }
    return map;
  }, [config.shortcuts]);

  const getAvailableButtons = useCallback(
    (def: ShortcutDefinition | undefined): ActionButton[] => {
      if (!def) return ["record"];
      const currentKeys =
        def.category === "global"
          ? config.shortcuts.global[def.id] || []
          : config.shortcuts.terminal[def.id] || [];
      const isModified =
        currentKeys.length !== def.defaultKeys.length ||
        !currentKeys.every((k, i) => k === def.defaultKeys[i]);
      const hasBinding = currentKeys.length > 0;
      const btns: ActionButton[] = ["record"];
      if (isModified) btns.push("reset");
      if (hasBinding) btns.push("unbind");
      return btns;
    },
    [config.shortcuts]
  );

  // Initialize on open
  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      setRecordingId(null);
      setFocusZone("list");
      setIsTypingSearch(false);
      setSelectedIndex(0);
      setFocusedButton("record");
      setConfirmingReset(false);
    } else if (mounted) {
      const t = setTimeout(() => setMounted(false), animSpeed);
      return () => clearTimeout(t);
    }
  }, [isOpen, animSpeed]);

  // Keep index in bounds when filter changes
  useEffect(() => {
    if (selectedIndex >= filteredDefinitions.length) {
      setSelectedIndex(Math.max(0, filteredDefinitions.length - 1));
    }
  }, [filteredDefinitions.length, selectedIndex]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current || focusZone !== "list") return;
    const items = listRef.current.querySelectorAll('[role="row"]');
    const item = items[selectedIndex] as HTMLElement | undefined;
    if (item) {
      const ir = item.getBoundingClientRect();
      const cr = listRef.current.getBoundingClientRect();
      if (ir.top < cr.top) {
        listRef.current.scrollTop += ir.top - cr.top - 8;
      } else if (ir.bottom > cr.bottom) {
        listRef.current.scrollTop += ir.bottom - cr.bottom + 8;
      }
    }
  }, [selectedIndex, focusZone]);

  // Scroll focused tag into view when navigating
  useEffect(() => {
    if (!tagsRef.current || focusZone !== "tags") return;
    const tags = tagsRef.current.querySelectorAll("button");
    const tag = tags[selectedGroupIndex] as HTMLElement | undefined;
    if (tag) {
      tag.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  }, [selectedGroupIndex, focusZone]);

  // ─────────────────────────────────────────────
  // KEY RECORDING
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!recordingId || !isOpen) {
      setHeldModifiers([]);
      return;
    }
    const targetDef = shortcutDefinitions.find((d) => d.id === recordingId);
    if (!targetDef) return;

    const onDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === "Escape") {
        setRecordingId(null);
        setHeldModifiers([]);
        setFocusZone("list");
        setFocusedButton("record");
        return;
      }
      const mods: string[] = [];
      if (e.ctrlKey || e.metaKey) mods.push("Ctrl");
      if (e.altKey) mods.push("Alt");
      if (e.shiftKey) mods.push("Shift");
      setHeldModifiers(mods);
      const combo = eventToShortcutString(e, commandKey);
      if (combo) {
        setShortcutBinding(targetDef.category, targetDef.id, [combo]);
        saveConfig();
        setRecordingId(null);
        setHeldModifiers([]);
        setFocusZone("list");
        setFocusedButton("record");
      }
    };
    const onUp = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const mods: string[] = [];
      if (e.ctrlKey || e.metaKey) mods.push("Ctrl");
      if (e.altKey) mods.push("Alt");
      if (e.shiftKey) mods.push("Shift");
      setHeldModifiers(mods);
    };
    window.addEventListener("keydown", onDown, true);
    window.addEventListener("keyup", onUp, true);
    return () => {
      window.removeEventListener("keydown", onDown, true);
      window.removeEventListener("keyup", onUp, true);
    };
  }, [recordingId, isOpen, commandKey, setShortcutBinding, saveConfig]);

  // ─────────────────────────────────────────────
  // KEYBOARD NAVIGATION (4 zones: header, search, tags, list)
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || recordingId) return;

    const onKey = (e: KeyboardEvent) => {
      // ── ZONE: HEADER (Restore Defaults button) ──
      if (focusZone === "header") {
        if (e.key === "Escape" || e.key === "ArrowDown") {
          e.preventDefault(); e.stopPropagation();
          setConfirmingReset(false);
          setFocusZone("search");
          return;
        }
        if (confirmingReset) {
          // Arrow left/right to toggle between Yes/No
          if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            e.preventDefault(); e.stopPropagation();
            // Toggle: confirmingReset is just a flag; Enter will execute, Escape cancels
            return;
          }
          // Enter when confirming = do the reset
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault(); e.stopPropagation();
            resetShortcuts();
            saveConfig();
            setConfirmingReset(false);
            setResetFeedback(true);
            setTimeout(() => setResetFeedback(false), 2000);
            setFocusZone("list");
            return;
          }
          // 'n' or another key = cancel reset
          if (e.key.toLowerCase() === "n") {
            e.preventDefault(); e.stopPropagation();
            setConfirmingReset(false);
            return;
          }
        } else {
          // Enter/Space opens the confirmation
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault(); e.stopPropagation();
            setConfirmingReset(true);
            return;
          }
        }
        return;
      }

      // ── ZONE: SEARCH ──
      if (focusZone === "search") {
        if (isTypingSearch) {
          if (e.key === "Escape") {
            e.preventDefault(); e.stopPropagation();
            searchInputRef.current?.blur();
            setIsTypingSearch(false);
            return;
          }
          if (e.key === "ArrowDown") {
            e.preventDefault(); e.stopPropagation();
            searchInputRef.current?.blur();
            setIsTypingSearch(false);
            setFocusZone("tags");
            return;
          }
          if (e.key === "ArrowUp") {
            e.preventDefault(); e.stopPropagation();
            searchInputRef.current?.blur();
            setIsTypingSearch(false);
            setFocusZone("header");
            return;
          }
          if (e.key === "Enter") {
            e.preventDefault(); e.stopPropagation();
            searchInputRef.current?.blur();
            setIsTypingSearch(false);
            setFocusZone("list");
            setSelectedIndex(0);
            setFocusedButton("record");
            return;
          }
          return; // typing — let input handle the key
        } else {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault(); e.stopPropagation();
            setIsTypingSearch(true);
            searchInputRef.current?.focus();
            return;
          }
          if (e.key === "ArrowDown") {
            e.preventDefault(); e.stopPropagation();
            setFocusZone("tags");
            return;
          }
          if (e.key === "ArrowUp") {
            e.preventDefault(); e.stopPropagation();
            setFocusZone("header");
            return;
          }
          if (e.key === "Escape") {
            e.preventDefault(); e.stopPropagation();
            if (query) { setQuery(""); } else { setFocusZone("list"); }
            return;
          }
          if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
            setIsTypingSearch(true);
            searchInputRef.current?.focus();
            return;
          }
        }
      }

      // ── ZONE: TAGS ──
      if (focusZone === "tags") {
        if (e.key === "ArrowLeft") {
          e.preventDefault(); e.stopPropagation();
          setSelectedGroupIndex((p) => Math.max(0, p - 1));
          setSelectedIndex(0);
          return;
        }
        if (e.key === "ArrowRight") {
          e.preventDefault(); e.stopPropagation();
          setSelectedGroupIndex((p) => Math.min(groups.length - 1, p + 1));
          setSelectedIndex(0);
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault(); e.stopPropagation();
          setFocusZone("search");
          setIsTypingSearch(false);
          return;
        }
        if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
          e.preventDefault(); e.stopPropagation();
          setFocusZone("list");
          setSelectedIndex(0);
          setFocusedButton("record");
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault(); e.stopPropagation();
          setFocusZone("list");
          return;
        }
      }

      // ── ZONE: LIST ──
      if (focusZone === "list") {
        const currentDef = filteredDefinitions[selectedIndex];
        const availBtns = getAvailableButtons(currentDef);

        if (e.key === "Escape") {
          e.preventDefault(); e.stopPropagation();
          if (query) {
            setQuery("");
            setFocusZone("search");
            setIsTypingSearch(false);
          } else {
            onClose();
          }
          return;
        }
        if (e.key === "/") {
          e.preventDefault(); e.stopPropagation();
          setFocusZone("search");
          setIsTypingSearch(true);
          requestAnimationFrame(() => searchInputRef.current?.focus());
          return;
        }
        if (e.key === "ArrowDown") {
          e.preventDefault(); e.stopPropagation();
          setSelectedIndex((prev) => {
            const next = Math.min(prev + 1, Math.max(0, filteredDefinitions.length - 1));
            const nextBtns = getAvailableButtons(filteredDefinitions[next]);
            if (!nextBtns.includes(focusedButton)) setFocusedButton("record");
            return next;
          });
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault(); e.stopPropagation();
          if (selectedIndex === 0) {
            setFocusZone("tags");
            return;
          }
          setSelectedIndex((prev) => {
            const next = Math.max(prev - 1, 0);
            const nextBtns = getAvailableButtons(filteredDefinitions[next]);
            if (!nextBtns.includes(focusedButton)) setFocusedButton("record");
            return next;
          });
          return;
        }
        if (e.key === "ArrowRight") {
          e.preventDefault(); e.stopPropagation();
          const ci = availBtns.indexOf(focusedButton);
          if (ci !== -1 && ci < availBtns.length - 1) setFocusedButton(availBtns[ci + 1]);
          return;
        }
        if (e.key === "ArrowLeft") {
          e.preventDefault(); e.stopPropagation();
          const ci = availBtns.indexOf(focusedButton);
          if (ci > 0) setFocusedButton(availBtns[ci - 1]);
          return;
        }
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault(); e.stopPropagation();
          if (!currentDef) return;
          if (focusedButton === "record") { setRecordingId(currentDef.id); return; }
          if (focusedButton === "reset") {
            setShortcutBinding(currentDef.category, currentDef.id, [...currentDef.defaultKeys]);
            saveConfig(); setFocusedButton("record"); return;
          }
          if (focusedButton === "unbind") {
            setShortcutBinding(currentDef.category, currentDef.id, []);
            saveConfig(); setFocusedButton("record"); return;
          }
          return;
        }
        if (e.key === "Delete" || e.key === "Backspace") {
          e.preventDefault(); e.stopPropagation();
          if (currentDef) {
            setShortcutBinding(currentDef.category, currentDef.id, []);
            saveConfig(); setFocusedButton("record");
          }
          return;
        }
        if ((e.ctrlKey || e.altKey) && e.key.toLowerCase() === "r") {
          e.preventDefault(); e.stopPropagation();
          if (currentDef) {
            setShortcutBinding(currentDef.category, currentDef.id, [...currentDef.defaultKeys]);
            saveConfig();
          }
          return;
        }
      }
    };

    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [
    isOpen, recordingId, focusZone, isTypingSearch, selectedIndex, focusedButton,
    filteredDefinitions, groups.length, query, confirmingReset, onClose,
    getAvailableButtons, setShortcutBinding, saveConfig, resetShortcuts,
  ]);

  if (!mounted && !isOpen) return null;

  return (
    <div
      ref={containerRef}
      data-overlay="true"
      data-shortcuts-editor="true"
      data-recording={recordingId ? "true" : undefined}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm outline-none select-none ${
        isOpen ? "anim-overlay" : "anim-overlay-out"
      }`}
      onMouseDown={(e) => { if (e.target === e.currentTarget && !recordingId) onClose(); }}
    >
      <div
        className="w-[840px] max-w-[96vw] h-[86vh] max-h-[760px] bg-bg-surface border border-surface1 rounded-xl shadow-2xl flex flex-col overflow-hidden text-fg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-3 border-b border-surface0 bg-surface0/40 select-none transition-all ${
          focusZone === "header" ? "ring-1 ring-accent/40" : ""
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center">
              <Keyboard size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-fg">Keyboard Shortcuts Editor</h2>
                <span className="text-[11px] bg-surface1 px-2 py-0.5 rounded-full text-fg-subtle font-mono">
                  {filteredDefinitions.length} actions
                </span>
              </div>
              <p className="text-xs text-fg-subtle flex items-center gap-1.5 mt-0.5">
                <span>Keyboard First:</span>
                <kbd className="bg-surface1 px-1 rounded font-mono text-[10px] text-fg">↑↓</kbd>
                <span>navigate rows / zones</span>
                <span className="text-surface2">•</span>
                <kbd className="bg-surface1 px-1 rounded font-mono text-[10px] text-fg">←→</kbd>
                <span>select buttons</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Restore Defaults — keyboard-focusable from header zone */}
            {confirmingReset && focusZone === "header" ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-amber-400/60 bg-amber-400/10">
                <ShieldAlert size={13} className="text-amber-400 flex-shrink-0" />
                <span className="text-xs text-amber-400 font-medium">Reset all shortcuts?</span>
                <button
                  onClick={() => {
                    resetShortcuts(); saveConfig();
                    setConfirmingReset(false);
                    setResetFeedback(true);
                    setTimeout(() => setResetFeedback(false), 2000);
                    setFocusZone("list");
                  }}
                  className="px-2 py-0.5 rounded bg-amber-400 text-bg text-xs font-bold hover:bg-amber-300 transition-colors"
                >
                  Yes, reset
                </button>
                <button
                  onClick={() => setConfirmingReset(false)}
                  className="px-2 py-0.5 rounded bg-surface1 text-fg-subtle text-xs hover:text-fg transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmingReset(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all border ${
                  focusZone === "header"
                    ? "ring-2 ring-accent bg-surface0 border-accent text-fg shadow-md"
                    : "bg-surface1 hover:bg-surface0 text-fg-subtle hover:text-fg border-surface1"
                }`}
                title="Reset all shortcuts to defaults (navigate here with ↑ from search)"
              >
                {resetFeedback ? (
                  <>
                    <Check size={13} className="text-green-400" />
                    <span className="text-green-400">Reset Done!</span>
                  </>
                ) : (
                  <>
                    <RotateCcw size={13} />
                    <span>Restore Defaults</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface1 text-fg-subtle hover:text-fg transition-colors"
              title="Close (Esc)"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Zone 0: Search */}
        <div className="px-4 pt-3 pb-2 border-b border-surface0/80 flex flex-col gap-2 bg-bg/40 select-none">
          <div
            className={`relative flex items-center rounded-lg border transition-all ${
              focusZone === "search"
                ? "border-accent ring-2 ring-accent/40 bg-surface0 shadow-md"
                : "border-surface1 bg-surface0/80 hover:border-surface2"
            }`}
            onClick={() => {
              setFocusZone("search");
              setIsTypingSearch(true);
              searchInputRef.current?.focus();
            }}
          >
            <Search size={15} className="absolute left-3 text-fg-subtle pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search shortcuts by action name, key combo, or ID  (press / to search)..."
              value={query}
              onFocus={() => { setFocusZone("search"); setIsTypingSearch(true); }}
              onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
              className="w-full pl-9 pr-36 py-2 text-sm bg-transparent text-fg placeholder:text-fg-subtle/60 outline-none font-sans"
            />
            <div className="absolute right-3 flex items-center gap-1.5 pointer-events-none">
              {focusZone === "search" && !isTypingSearch && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent/20 text-accent font-semibold border border-accent/40 animate-pulse">
                  Enter to type · ↓ tags · ↑ header
                </span>
              )}
              {isTypingSearch && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface1 text-fg-subtle border border-surface1">
                  Esc to exit
                </span>
              )}
              {query && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setQuery(""); searchInputRef.current?.focus(); }}
                  className="pointer-events-auto w-5 h-5 flex items-center justify-center rounded text-fg-subtle hover:text-fg"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Zone 1: Tags — NO overflow scrollbar; scrolls on demand but hides scrollbar */}
          <div className="flex items-center gap-1.5">
            <div
              ref={tagsRef}
              className={`flex items-center gap-1.5 min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden rounded transition-all ${
                focusZone === "tags" ? "ring-1 ring-accent/30" : ""
              }`}
            >
              {groups.map((group, idx) => {
                const isActive = selectedGroup === group;
                const isTagFocused = focusZone === "tags" && selectedGroupIndex === idx;
                return (
                  <button
                    key={group}
                    onClick={() => { setFocusZone("tags"); setSelectedGroupIndex(idx); setSelectedIndex(0); }}
                    className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all border flex-shrink-0 ${
                      isTagFocused
                        ? "ring-2 ring-accent border-accent bg-accent text-bg font-bold shadow-md scale-105"
                        : isActive
                        ? "bg-accent/20 text-accent border-accent/50 font-semibold"
                        : "bg-surface0 text-fg-subtle border-transparent hover:text-fg hover:bg-surface1"
                    }`}
                  >
                    {group}
                  </button>
                );
              })}
            </div>
            {focusZone === "tags" && (
              <span className="text-[10px] text-accent font-mono whitespace-nowrap flex-shrink-0 flex items-center gap-1 pl-2">
                [←→] tag · [↓] list · [↑] search
              </span>
            )}
          </div>
        </div>

        {/* Zone 2: Shortcuts List */}
        <div ref={listRef} className="flex-1 overflow-y-auto divide-y divide-surface0/60 outline-none">
          {filteredDefinitions.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-fg-subtle gap-2 select-none">
              <Keyboard size={32} className="opacity-40" />
              <p className="text-sm font-medium">No shortcuts match &quot;{query}&quot;</p>
              <button
                onClick={() => { setQuery(""); setSelectedGroupIndex(0); }}
                className="mt-2 text-xs text-accent hover:underline"
              >
                Clear search filters
              </button>
            </div>
          ) : (
            filteredDefinitions.map((def, idx) => {
              const isSelected = focusZone === "list" && idx === selectedIndex;
              const isRecordingThis = recordingId === def.id;

              const currentKeys =
                def.category === "global"
                  ? config.shortcuts.global[def.id] || []
                  : config.shortcuts.terminal[def.id] || [];

              const hasBinding = currentKeys.length > 0;
              const isModified =
                currentKeys.length !== def.defaultKeys.length ||
                !currentKeys.every((k, i) => k === def.defaultKeys[i]);

              let conflictWarning = "";
              if (hasBinding) {
                for (const k of currentKeys) {
                  const matches = conflictMap.get(k.trim().toLowerCase()) || [];
                  const others = matches.filter((m) => m !== def.name);
                  if (others.length > 0) {
                    conflictWarning = `Conflicts with: ${others.join(", ")}`;
                    break;
                  }
                }
              }

              return (
                <div
                  key={def.id}
                  role="row"
                  aria-selected={isSelected}
                  onClick={() => { setFocusZone("list"); setSelectedIndex(idx); }}
                  className={`flex items-center justify-between px-4 py-2.5 transition-colors border-l-4 cursor-pointer select-none ${
                    isSelected
                      ? "bg-surface1/95 border-accent text-fg shadow-inner ring-1 ring-accent/25"
                      : "border-transparent hover:bg-surface0/50 text-fg/90"
                  } ${isRecordingThis ? "ring-2 ring-accent bg-accent/15 border-accent" : ""}`}
                >
                  {/* Left: info */}
                  <div className="flex-1 min-w-0 pr-4 flex items-center gap-2">
                    <div className="w-5 flex items-center justify-center flex-shrink-0">
                      {isSelected ? (
                        <ChevronRight size={16} className="text-accent" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-surface2/40" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm truncate ${isSelected ? "font-semibold text-fg" : "text-fg/90"}`}>
                          {def.name}
                        </span>
                        <span className="text-[10px] bg-surface0 px-2 py-0.5 rounded text-fg-subtle font-mono flex-shrink-0 border border-surface1">
                          {def.group}
                        </span>
                        {isModified && (
                          <span className="text-[10px] text-accent border border-accent/40 bg-accent/10 px-1.5 py-0.2 rounded font-mono font-medium">
                            Custom
                          </span>
                        )}
                        {conflictWarning && (
                          <span
                            className="flex items-center gap-1 text-[11px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded"
                            title={conflictWarning}
                          >
                            <AlertTriangle size={11} />
                            <span className="truncate max-w-[140px]">{conflictWarning}</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-fg-subtle truncate mt-0.5">{def.description}</p>
                    </div>
                  </div>

                  {/* Right: keybinding + action buttons */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {isRecordingThis ? (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/20 border-2 border-accent text-accent animate-pulse">
                        <Keyboard size={14} />
                        <span className="text-xs font-mono font-semibold">
                          {heldModifiers.length > 0
                            ? `${heldModifiers.join(" + ")} + ...`
                            : "Press keys now (Esc to cancel)..."}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        {hasBinding ? (
                          currentKeys.map((keyCombo, kIdx) => {
                            const parts = splitShortcutParts(keyCombo, commandKey);
                            return (
                              <div key={kIdx} className="flex items-center gap-0.5">
                                {parts.map((p, pIdx) => (
                                  <span
                                    key={pIdx}
                                    className="px-2 py-1 text-xs font-mono font-semibold rounded bg-surface0 text-fg border border-surface1 shadow-sm"
                                  >
                                    {p}
                                  </span>
                                ))}
                              </div>
                            );
                          })
                        ) : (
                          <span className="text-xs text-fg-subtle italic bg-surface0/60 px-2.5 py-1 rounded border border-surface0 font-mono">
                            Unbound
                          </span>
                        )}
                      </div>
                    )}

                    {/* Row action buttons */}
                    <div className="flex items-center gap-1.5 pl-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFocusZone("list"); setSelectedIndex(idx);
                          setFocusedButton("record"); setRecordingId(def.id);
                        }}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                          isSelected && focusedButton === "record"
                            ? "ring-2 ring-accent bg-accent text-bg font-bold shadow-md scale-105"
                            : isRecordingThis
                            ? "bg-accent text-bg"
                            : "bg-surface0/70 hover:bg-surface0 text-fg-subtle hover:text-fg border border-surface1"
                        }`}
                        title="Record new key combination (Enter)"
                      >
                        <Edit2 size={12} />
                        <span>{isRecordingThis ? "Recording..." : "Record"}</span>
                      </button>

                      {isModified && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFocusZone("list"); setSelectedIndex(idx);
                            setShortcutBinding(def.category, def.id, [...def.defaultKeys]);
                            saveConfig();
                          }}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                            isSelected && focusedButton === "reset"
                              ? "ring-2 ring-accent bg-accent text-bg font-bold shadow-md scale-105"
                              : "bg-surface0/70 hover:bg-surface0 text-fg-subtle hover:text-accent border border-surface1"
                          }`}
                          title="Restore default shortcut"
                        >
                          <RotateCcw size={12} />
                          <span>Reset</span>
                        </button>
                      )}

                      {hasBinding && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFocusZone("list"); setSelectedIndex(idx);
                            setShortcutBinding(def.category, def.id, []);
                            saveConfig(); setFocusedButton("record");
                          }}
                          className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                            isSelected && focusedButton === "unbind"
                              ? "ring-2 ring-red-400 bg-red-400 text-bg font-bold shadow-md scale-105"
                              : "bg-surface0/70 hover:bg-surface0 text-fg-subtle hover:text-red-400 border border-surface1"
                          }`}
                          title="Unbind shortcut (Del)"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-2.5 border-t border-surface0 bg-surface0/50 text-[11px] text-fg-subtle select-none">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="bg-surface1 px-1.5 py-0.5 rounded font-mono text-[10px] border border-surface1 text-fg">↑↓</kbd>
              Rows / Zones
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-surface1 px-1.5 py-0.5 rounded font-mono text-[10px] border border-surface1 text-fg">←→</kbd>
              Buttons
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-surface1 px-1.5 py-0.5 rounded font-mono text-[10px] border border-surface1 text-fg">Enter</kbd>
              Execute / Record
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-surface1 px-1.5 py-0.5 rounded font-mono text-[10px] border border-surface1 text-fg">Del</kbd>
              Unbind
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-surface1 px-1.5 py-0.5 rounded font-mono text-[10px] border border-surface1 text-fg">/</kbd>
              Search
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span>Zone:</span>
            <span className="bg-accent/15 text-accent border border-accent/30 px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase">
              {focusZone}
            </span>
            <span className="ml-2">Esc to exit / close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
