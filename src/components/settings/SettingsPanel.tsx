import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useConfigStore } from "@/stores/configStore";
import { X, Minus, Plus, ChevronRight } from "lucide-react";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const cursorOptions = ["block", "underline", "bar"];
const bellOptions = ["none", "sound", "visual"];

type SettingItem = {
  section: string;
  id: string;
  label: string;
  type: "text" | "number" | "select" | "toggle" | "action" | "shell";
  value?: unknown;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  onChange?: (v: unknown) => void;
  action?: () => void;
};

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const config = useConfigStore((s) => s.config);
  const { setTerminal, setSession, setLayout, setTheme, setDeveloper, resetConfig, clearPastPaths } = useConfigStore();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const selectedIndexRef = useRef(0);
  const itemsRef = useRef<SettingItem[]>([]);
  const animSpeed = config.theme.animations.enabled ? config.theme.animations.speed : 0;
  const prevOpenRef = useRef(false);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const createItems = useCallback((): SettingItem[] => [
    { section: "Terminal", id: "defaultShell", label: "Default Shell", type: "shell" as const, value: config.terminal.defaultShell, options: ["powershell.exe", "cmd.exe", "bash.exe", "custom"], onChange: (v: unknown) => setTerminal({ defaultShell: v as string }) },
    { section: "Terminal", id: "fontFamily", label: "Font Family", type: "text" as const, value: config.terminal.fontFamily, onChange: (v: unknown) => setTerminal({ fontFamily: v as string }) },
    { section: "Terminal", id: "fontSize", label: "Font Size", type: "number" as const, value: config.terminal.fontSize, min: 6, max: 72, step: 1, onChange: (v: unknown) => setTerminal({ fontSize: v as number }) },
    { section: "Terminal", id: "lineHeight", label: "Line Height", type: "number" as const, value: config.terminal.lineHeight, min: 0.5, max: 3, step: 0.1, onChange: (v: unknown) => setTerminal({ lineHeight: v as number }) },
    { section: "Terminal", id: "cursorStyle", label: "Cursor Style", type: "select" as const, value: config.terminal.cursorStyle, options: cursorOptions, onChange: (v: unknown) => setTerminal({ cursorStyle: v as "block" | "underline" | "bar" }) },
    { section: "Terminal", id: "cursorBlink", label: "Cursor Blink", type: "toggle" as const, value: config.terminal.cursorBlink, onChange: (v: unknown) => setTerminal({ cursorBlink: v as boolean }) },
    { section: "Terminal", id: "bellStyle", label: "Bell Style", type: "select" as const, value: config.terminal.bellStyle, options: bellOptions, onChange: (v: unknown) => setTerminal({ bellStyle: v as "none" | "sound" | "visual" }) },
    { section: "Terminal", id: "copyOnSelect", label: "Copy on Select", type: "toggle" as const, value: config.terminal.copyOnSelect, onChange: (v: unknown) => setTerminal({ copyOnSelect: v as boolean }) },
    { section: "Terminal", id: "rightClickPaste", label: "Right Click Paste", type: "toggle" as const, value: config.terminal.rightClickPaste, onChange: (v: unknown) => setTerminal({ rightClickPaste: v as boolean }) },
    { section: "Terminal", id: "scrollback", label: "Scrollback Lines", type: "number" as const, value: config.terminal.scrollback, min: 1000, max: 999999, step: 1000, onChange: (v: unknown) => setTerminal({ scrollback: v as number }) },
    { section: "Session", id: "sessionRestore", label: "Session Restoring", type: "toggle" as const, value: config.session.sessionRestore, onChange: (v: unknown) => setSession({ sessionRestore: v as boolean }) },
    { section: "Session", id: "clearPastSessions", label: "Clear Past Sessions", type: "action" as const, action: () => { clearPastPaths(); } },
    { section: "Session", id: "showTutorial", label: "Show Tutorial", type: "action" as const, action: () => { localStorage.removeItem("forge-tutorial-shown"); document.dispatchEvent(new CustomEvent("show-tutorial")); } },
    { section: "Appearance", id: "animToggle", label: "Animations", type: "toggle" as const, value: config.theme.animations.enabled, onChange: (v: unknown) => setTheme({ animations: { ...config.theme.animations, enabled: v as boolean } }) },
    { section: "Appearance", id: "animSpeed", label: "Animation Speed (ms)", type: "number" as const, value: config.theme.animations.speed, min: 50, max: 1000, step: 50, onChange: (v: unknown) => setTheme({ animations: { ...config.theme.animations, speed: v as number } }) },
    { section: "Layout", id: "showStatusBar", label: "Show Status Bar", type: "toggle" as const, value: config.layout.showStatusBar, onChange: (v: unknown) => setLayout({ showStatusBar: v as boolean }) },
    { section: "Developer", id: "devMode", label: "Developer Mode", type: "toggle" as const, value: config.developer.enabled, onChange: (v: unknown) => setDeveloper({ enabled: v as boolean }) },
    ...(config.developer.enabled ? [
      { section: "Developer", id: "clearTutorial", label: "Reset Tutorial (show again)", type: "action" as const, action: () => { localStorage.removeItem("forge-tutorial-shown"); document.dispatchEvent(new CustomEvent("clear-tutorial")); } },
      { section: "Developer", id: "resetConfig", label: "Restore All Defaults", type: "action" as const, action: () => { resetConfig(); } },
    ] : []),
  ], [config, setTerminal, setSession, setLayout, setTheme, setDeveloper, resetConfig]);

  const items = useMemo(createItems, [config, setTerminal, setSession, setLayout, setTheme, setDeveloper, resetConfig, createItems]);

  useEffect(() => { itemsRef.current = items; }, [items]);
  useEffect(() => { selectedIndexRef.current = selectedIndex; }, [selectedIndex]);

  useEffect(() => {
    const wasOpen = prevOpenRef.current;
    prevOpenRef.current = isOpen;

    if (isOpen && !wasOpen) {
      clearTimeout(exitTimerRef.current);
      setSelectedIndex(0);
      setMounted(true);
      if (!document.querySelector('[data-tutorial="true"]')) {
        requestAnimationFrame(() => overlayRef.current?.focus());
      }
    } else if (!isOpen && wasOpen && mounted) {
      exitTimerRef.current = setTimeout(() => {
        setMounted(false);
        exitTimerRef.current = undefined;
      }, animSpeed);
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
      const currentItems = itemsRef.current;
      const currentIdx = selectedIndexRef.current;

      // If editing a text input inside the panel, let all keys pass through except Escape
      const activeInput = document.activeElement?.tagName === 'INPUT' && overlayRef.current?.contains(document.activeElement);
      if (activeInput) {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') return;
        if (e.key === 'Escape') {
          (document.activeElement as HTMLElement).blur();
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        return;
      }

      const handle = (action: string) => {
        switch (action) {
          case "down":
            setSelectedIndex((i) => Math.min(i + 1, currentItems.length - 1));
            break;
          case "up":
            setSelectedIndex((i) => Math.max(i - 1, 0));
            break;
          case "home":
            setSelectedIndex(0);
            break;
          case "end":
            setSelectedIndex(currentItems.length - 1);
            break;
          case "activate": {
            const item = currentItems[currentIdx];
            if (!item) break;
            if (item.type === "toggle") {
              item.onChange?.(!item.value);
            } else if (item.type === "select") {
              const opts = item.options!;
              const idx = opts.indexOf(item.value as string);
              item.onChange?.(opts[(idx + 1) % opts.length]);
            } else if (item.type === "action") {
              item.action?.();
            } else if (item.type === "text") {
              const sel = listRef.current?.querySelector('[role="option"][aria-selected="true"]');
              (sel?.querySelector('input') as HTMLElement)?.focus();
            } else if (item.type === "shell") {
              const opts = item.options!;
              let currentVal = item.value as string;
              if (!opts.includes(currentVal)) currentVal = "custom";
              if (currentVal === "custom") {
                const sel = listRef.current?.querySelector('[role="option"][aria-selected="true"]');
                (sel?.querySelector('input') as HTMLElement)?.focus();
              } else {
                const idx = opts.indexOf(currentVal);
                const nextVal = opts[(idx + 1) % opts.length];
                if (nextVal === "custom") item.onChange?.("");
                else item.onChange?.(nextVal);
              }
            }
            break;
          }
          case "left": {
            const item = currentItems[currentIdx];
            if (!item) break;
            if (item.type === "select" || item.type === "shell") {
              const opts = item.options!;
              let currentVal = item.value as string;
              if (item.type === "shell" && !opts.includes(currentVal)) currentVal = "custom";
              const idx = opts.indexOf(currentVal);
              const nextVal = opts[(idx - 1 + opts.length) % opts.length];
              if (item.type === "shell" && nextVal === "custom") item.onChange?.("");
              else item.onChange?.(nextVal);
            } else if (item.type === "number") {
              item.onChange?.(Number(Math.max(item.min ?? 0, (item.value as number) - (item.step ?? 1)).toFixed(2)));
            }
            break;
          }
          case "right": {
            const item = currentItems[currentIdx];
            if (!item) break;
            if (item.type === "select" || item.type === "shell") {
              const opts = item.options!;
              let currentVal = item.value as string;
              if (item.type === "shell" && !opts.includes(currentVal)) currentVal = "custom";
              const idx = opts.indexOf(currentVal);
              const nextVal = opts[(idx + 1) % opts.length];
              if (item.type === "shell" && nextVal === "custom") item.onChange?.("");
              else item.onChange?.(nextVal);
            } else if (item.type === "number") {
              item.onChange?.(Number(Math.min(item.max ?? 999, (item.value as number) + (item.step ?? 1)).toFixed(2)));
            }
            break;
          }
          case "close":
            onClose();
            break;
        }
      };

      switch (e.key) {
        case "ArrowDown": e.preventDefault(); e.stopPropagation(); handle("down"); break;
        case "ArrowUp": e.preventDefault(); e.stopPropagation(); handle("up"); break;
        case "Home": e.preventDefault(); e.stopPropagation(); handle("home"); break;
        case "End": e.preventDefault(); e.stopPropagation(); handle("end"); break;
        case "Enter":
        case " ": e.preventDefault(); e.stopPropagation(); handle("activate"); break;
        case "ArrowLeft": e.preventDefault(); e.stopPropagation(); handle("left"); break;
        case "ArrowRight": e.preventDefault(); e.stopPropagation(); handle("right"); break;
        case "Escape": e.preventDefault(); e.stopPropagation(); handle("close"); break;
      }
    };

    document.addEventListener("keydown", handler, true);
    return () => document.removeEventListener("keydown", handler, true);
  }, [isOpen, onClose]);

  if (!mounted && !isOpen) return null;

  let lastSection = "";

  return (
    <div
      ref={overlayRef}
      data-overlay="true"
      tabIndex={-1}
      className={`fixed inset-0 z-50 flex items-start justify-center pt-[10vh] outline-none ${isOpen ? "anim-overlay" : "anim-overlay-out"}`}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-[520px] max-w-[90vw] bg-bg-surface border border-surface1 rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface0">
          <span className="text-sm font-medium text-fg">Settings</span>
          <button
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-surface0 text-fg-subtle hover:text-fg transition-colors"
            onClick={onClose}
          >
            <X size={14} />
          </button>
        </div>

        <div ref={listRef} className="max-h-[60vh] overflow-y-auto py-1">
          {items.map((item, idx) => {
            const showSection = item.section !== lastSection;
            lastSection = item.section;
            const isSelected = idx === selectedIndex;

            return (
              <div key={item.id}>
                {showSection && (
                  <div className="px-4 pt-3 pb-1 text-[10px] text-fg-subtle font-semibold uppercase tracking-wider">
                    {item.section}
                  </div>
                )}
                <div
                  role="option"
                  aria-selected={isSelected}
                  className={`flex items-center gap-3 px-4 py-2 cursor-pointer border-l-2 transition-colors ${
                    isSelected
                      ? "border-accent bg-surface1 text-fg font-medium"
                      : "border-transparent text-fg-alt hover:bg-surface1/50 hover:border-l-2 hover:border-surface1"
                  }`}
                  style={{ transitionDuration: "var(--anim-duration, 200ms)" }}
                  onClick={() => {
                    setSelectedIndex(idx);
                    if (item.type === "toggle") {
                      item.onChange?.(!item.value);
                    } else if (item.type === "select") {
                      const opts = item.options!;
                      const i = opts.indexOf(item.value as string);
                      item.onChange?.(opts[(i + 1) % opts.length]);
                    }
                  }}
                >
                  <span className="flex-1 text-sm truncate">{item.label}</span>

                  {item.type === "toggle" && (
                    <div className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${item.value ? "bg-accent" : "bg-surface1"}`}
                      style={{ transitionDuration: "var(--anim-duration, 200ms)" }}>
                      <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${item.value ? "translate-x-4" : ""}`}
                        style={{ transitionDuration: "var(--anim-duration, 200ms)" }} />
                    </div>
                  )}

                  {item.type === "select" && (
                    <div className="flex items-center gap-1 text-xs text-fg-subtle bg-surface1 px-2 py-1 rounded flex-shrink-0">
                      {item.value as string}
                      <ChevronRight size={12} className="opacity-50" />
                    </div>
                  )}

                  {item.type === "number" && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-surface1 text-fg-subtle hover:text-fg transition-colors"
                        onClick={(e) => { e.stopPropagation(); item.onChange?.(Number(Math.max(item.min ?? 0, (item.value as number) - (item.step ?? 1)).toFixed(2))); }}
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-xs text-fg font-mono w-8 text-center">{item.value as number}</span>
                      <button
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-surface1 text-fg-subtle hover:text-fg transition-colors"
                        onClick={(e) => { e.stopPropagation(); item.onChange?.(Number(Math.min(item.max ?? 999, (item.value as number) + (item.step ?? 1)).toFixed(2))); }}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  )}

                  {item.type === "action" && (
                    <button
                      className="px-3 py-1 text-xs text-bg bg-accent rounded hover:opacity-90 transition-opacity flex-shrink-0"
                      style={{ transitionDuration: "var(--anim-duration, 200ms)" }}
                      onClick={(e) => { e.stopPropagation(); item.action?.(); }}
                    >
                      {item.id === "showTutorial" ? "Open" : item.id === "clearTutorial" ? "Clear" : item.id === "resetConfig" ? "Restore" : "Run"}
                    </button>
                  )}

                  {item.type === "text" && (
                    <input
                      className="w-48 text-xs bg-surface0 text-fg px-2 py-1 rounded border border-surface1 focus:border-accent outline-none text-right flex-shrink-0"
                      value={item.value as string}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => item.onChange?.(e.target.value)}
                    />
                  )}

                  {item.type === "shell" && (
                    <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <select
                        className="w-28 text-xs bg-surface0 text-fg px-2 py-1 rounded border border-surface1 focus:border-accent outline-none"
                        value={["powershell.exe", "cmd.exe", "bash.exe"].includes(item.value as string) ? (item.value as string) : "custom"}
                        onChange={(e) => {
                          if (e.target.value === "custom") {
                            item.onChange?.("");
                          } else {
                            item.onChange?.(e.target.value);
                          }
                        }}
                      >
                        <option value="powershell.exe">PowerShell</option>
                        <option value="cmd.exe">CMD</option>
                        <option value="bash.exe">Bash</option>
                        <option value="custom">Custom...</option>
                      </select>
                      {!["powershell.exe", "cmd.exe", "bash.exe"].includes(item.value as string) && (
                        <input
                          className="w-24 text-xs bg-surface0 text-fg px-2 py-1 rounded border border-surface1 focus:border-accent outline-none"
                          value={item.value as string}
                          placeholder="path/to/shell"
                          onChange={(e) => item.onChange?.(e.target.value)}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2 px-4 py-2 border-t border-surface0 text-[10px] text-fg-subtle">
          <span className="bg-surface0 px-1.5 py-0.5 rounded">↑↓</span> Navigate
          <span className="bg-surface0 px-1.5 py-0.5 rounded ml-1">Enter/Space</span> Toggle
          <span className="bg-surface0 px-1.5 py-0.5 rounded ml-1">←→</span> Adjust
          <span className="bg-surface0 px-1.5 py-0.5 rounded ml-1">Esc</span> Close
        </div>
      </div>
    </div>
  );
}
