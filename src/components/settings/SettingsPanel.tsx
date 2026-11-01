import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useConfigStore } from "@/stores/configStore";
import { useHistoryStore } from "@/stores/historyStore";
import { X, Minus, Plus, ChevronRight, Check } from "lucide-react";
import { installContextMenu, uninstallContextMenu, isContextMenuInstalled } from "@/lib/ipc";
import { writeClipboardText } from "@/lib/clipboard";
import { FORGE_VERSION } from "./version";

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
  description?: string;
  type: "text" | "number" | "select" | "toggle" | "action" | "shell" | "font" | "filepath" | "version";
  value?: unknown;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  actionLabel?: string;
  onChange?: (v: unknown) => void;
  action?: () => void;
};

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const config = useConfigStore((s) => s.config);
  const configPath = useConfigStore((s) => s.configPath);
  const {
    setTerminal,
    setSession,
    setLayout,
    setTheme,
    setShortcuts,
    setDeveloper,
    resetConfig,
    resetShortcuts,
    reloadConfig,
    clearPastPaths,
  } = useConfigStore();

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [contextMenuInstalled, setContextMenuInstalled] = useState(false);
  const [cmInstalling, setCmInstalling] = useState(false);
  const [copiedPath, setCopiedPath] = useState(false);
  const [reloadedConfig, setReloadedConfig] = useState(false);
  const [reloadMsg, setReloadMsg] = useState("");

  const listRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const selectedIndexRef = useRef(0);
  const itemsRef = useRef<SettingItem[]>([]);
  const animSpeed = config.theme.animations.enabled ? config.theme.animations.speed : 0;
  const prevOpenRef = useRef(false);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleCopyConfigPath = useCallback(() => {
    if (!configPath) return;
    writeClipboardText(configPath);
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 2000);
  }, [configPath]);

  const handleReloadConfig = useCallback(async () => {
    const res = await reloadConfig();
    setReloadedConfig(true);
    setReloadMsg(res.message);
    setTimeout(() => {
      setReloadedConfig(false);
      setReloadMsg("");
    }, 2500);
  }, [reloadConfig]);

  const createItems = useCallback((): SettingItem[] => [
    // Configuration File Section
    {
      section: "Configuration File",
      id: "configFilePath",
      label: "Config File Path",
      description: "Path to config.json for manual editing",
      type: "filepath" as const,
      value: configPath || "Searching path...",
      actionLabel: copiedPath ? "Copied!" : "Copy Path",
      action: handleCopyConfigPath,
    },
    {
      section: "Configuration File",
      id: "reloadConfig",
      label: "Reload Config from File",
      description: "Applies edits from config.json to the current session immediately",
      type: "action" as const,
      actionLabel: reloadedConfig ? "Reloaded!" : "Reload Now",
      action: handleReloadConfig,
    },

    // Terminal
    { section: "Terminal", id: "defaultShell", label: "Default Shell", type: "shell" as const, value: config.terminal.defaultShell, options: ["powershell.exe", "cmd.exe", "bash.exe", "custom"], onChange: (v: unknown) => setTerminal({ defaultShell: v as string }) },
    { section: "Terminal", id: "linkBehavior", label: "Ctrl+Click Link Behavior", type: "select" as const, value: config.terminal.linkBehavior, options: ["preview", "browser"], onChange: (v: unknown) => setTerminal({ linkBehavior: v as "preview" | "browser" }) },
    { section: "Terminal", id: "fontFamily", label: "Font Family", type: "font" as const, value: config.terminal.fontFamily, onChange: (v: unknown) => setTerminal({ fontFamily: v as string }) },
    { section: "Terminal", id: "fontSize", label: "Font Size", type: "number" as const, value: config.terminal.fontSize, min: 6, max: 72, step: 1, onChange: (v: unknown) => setTerminal({ fontSize: v as number }) },
    { section: "Terminal", id: "cursorStyle", label: "Cursor Style", type: "select" as const, value: config.terminal.cursorStyle, options: cursorOptions, onChange: (v: unknown) => setTerminal({ cursorStyle: v as "block" | "underline" | "bar" }) },
    { section: "Terminal", id: "cursorBlink", label: "Cursor Blink", type: "toggle" as const, value: config.terminal.cursorBlink, onChange: (v: unknown) => setTerminal({ cursorBlink: v as boolean }) },
    { section: "Terminal", id: "bellStyle", label: "Bell Style", type: "select" as const, value: config.terminal.bellStyle, options: bellOptions, onChange: (v: unknown) => setTerminal({ bellStyle: v as "none" | "sound" | "visual" }) },
    { section: "Terminal", id: "copyOnSelect", label: "Copy on Select", type: "toggle" as const, value: config.terminal.copyOnSelect, onChange: (v: unknown) => setTerminal({ copyOnSelect: v as boolean }) },
    { section: "Terminal", id: "rightClickPaste", label: "Right Click Paste", type: "toggle" as const, value: config.terminal.rightClickPaste, onChange: (v: unknown) => setTerminal({ rightClickPaste: v as boolean }) },
    { section: "Terminal", id: "scrollback", label: "Scrollback Lines", type: "number" as const, value: config.terminal.scrollback, min: 1000, max: 999999, step: 1000, onChange: (v: unknown) => setTerminal({ scrollback: v as number }) },

    // Shortcuts
    {
      section: "Shortcuts",
      id: "openShortcutsEditor",
      label: "Keyboard Shortcuts Editor",
      description: "Customize and record all application hotkeys",
      type: "action" as const,
      actionLabel: "Edit All",
      action: () => {
        document.dispatchEvent(new CustomEvent("open-shortcuts-editor"));
      },
    },
    {
      section: "Shortcuts",
      id: "commandKey",
      label: "Command Key (e.g. ` or m)",
      type: "text" as const,
      value: config.shortcuts.commandKey,
      onChange: (v: unknown) => {
        const val = (v as string).trim();
        if (val) setShortcuts({ commandKey: val.charAt(val.length - 1) });
      },
    },
    {
      section: "Shortcuts",
      id: "resetShortcuts",
      label: "Reset All Shortcuts",
      type: "action" as const,
      actionLabel: "Restore",
      action: () => {
        resetShortcuts();
      },
    },

    // Session
    { section: "Session", id: "sessionRestore", label: "Session Restoring", type: "toggle" as const, value: config.session.sessionRestore, onChange: (v: unknown) => setSession({ sessionRestore: v as boolean }) },
    { section: "Session", id: "ghostTextEnabled", label: "Command Suggestions (Ghost Text)", type: "toggle" as const, value: config.terminal.ghostTextEnabled, onChange: (v: unknown) => setTerminal({ ghostTextEnabled: v as boolean }) },
    { section: "Session", id: "clearPastSessions", label: "Clear Past Sessions", type: "action" as const, actionLabel: "Clear", action: () => { clearPastPaths(); } },
    { section: "Session", id: "clearCommandHistory", label: "Clear Command History", type: "action" as const, actionLabel: "Clear", action: () => { useHistoryStore.getState().clearHistory(); } },
    { section: "Session", id: "showTutorial", label: "Show Tutorial", type: "action" as const, actionLabel: "Open", action: () => { localStorage.removeItem("forge-tutorial-shown"); document.dispatchEvent(new CustomEvent("show-tutorial")); } },
    { section: "Session", id: contextMenuInstalled ? "uninstallContextMenu" : "installContextMenu", label: contextMenuInstalled ? "Uninstall Context Menu" : "Install Context Menu", type: "action" as const, actionLabel: contextMenuInstalled ? "Uninstall" : "Install", action: async () => { if (cmInstalling) return; setCmInstalling(true); try { if (contextMenuInstalled) { await uninstallContextMenu(); setContextMenuInstalled(false); } else { await installContextMenu(); setContextMenuInstalled(true); } } catch {} setCmInstalling(false); } },

    // Appearance
    { section: "Appearance", id: "animToggle", label: "Animations", type: "toggle" as const, value: config.theme.animations.enabled, onChange: (v: unknown) => setTheme({ animations: { ...config.theme.animations, enabled: v as boolean } }) },
    { section: "Appearance", id: "animSpeed", label: "Animation Speed (ms)", type: "number" as const, value: config.theme.animations.speed, min: 50, max: 1000, step: 50, onChange: (v: unknown) => setTheme({ animations: { ...config.theme.animations, speed: v as number } }) },
    { section: "Appearance", id: "splitTabAnimation", label: "Split Tab Transition Animation", type: "toggle" as const, value: config.theme.animations.splitTabAnimation, onChange: (v: unknown) => setTheme({ animations: { ...config.theme.animations, splitTabAnimation: v as boolean } }) },

    // Layout
    { section: "Layout", id: "showStatusBar", label: "Show Status Bar", type: "toggle" as const, value: config.layout.showStatusBar, onChange: (v: unknown) => setLayout({ showStatusBar: v as boolean }) },
    { section: "Layout", id: "previewPosition", label: "Preview Panel Position", type: "select" as const, value: config.layout.previewPosition || "right", options: ["left", "right"], onChange: (v: unknown) => setLayout({ previewPosition: v as "left" | "right" }) },

    // About Section
    {
      section: "About Forge",
      id: "forgeVersion",
      label: "Forge Version",
      description: "Current application release",
      type: "version" as const,
      value: `v${FORGE_VERSION}`,
    },

    // Developer
    { section: "Developer", id: "devMode", label: "Developer Mode", type: "toggle" as const, value: config.developer.enabled, onChange: (v: unknown) => setDeveloper({ enabled: v as boolean }) },
    ...(config.developer.enabled ? [
      { section: "Developer", id: "clearTutorial", label: "Reset Tutorial (show again)", type: "action" as const, actionLabel: "Clear", action: () => { localStorage.removeItem("forge-tutorial-shown"); document.dispatchEvent(new CustomEvent("clear-tutorial")); } },
      { section: "Developer", id: "resetConfig", label: "Restore All Defaults", type: "action" as const, actionLabel: "Restore", action: () => { resetConfig(); } },
    ] : []),
  ], [
    config,
    configPath,
    copiedPath,
    reloadedConfig,
    contextMenuInstalled,
    cmInstalling,
    handleCopyConfigPath,
    handleReloadConfig,
    setTerminal,
    setSession,
    setLayout,
    setTheme,
    setShortcuts,
    setDeveloper,
    resetConfig,
    resetShortcuts,
    clearPastPaths,
  ]);

  const items = useMemo(createItems, [createItems]);

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
      isContextMenuInstalled().then(setContextMenuInstalled).catch(() => {});
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

      // If editing a text input or select inside the panel, let all keys pass through except Escape
      const activeElement = document.activeElement;
      const isEditing = (activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'SELECT') && overlayRef.current?.contains(activeElement);
      if (isEditing) {
        if (e.key === 'Escape') {
          (activeElement as HTMLElement).blur();
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
              const sel = listRef.current?.querySelectorAll('[role="option"]')[currentIdx];
              (sel?.querySelector('select') as HTMLElement)?.focus();
            } else if (item.type === "action" || item.type === "filepath") {
              item.action?.();
            } else if (item.type === "text") {
              const sel = listRef.current?.querySelectorAll('[role="option"]')[currentIdx];
              (sel?.querySelector('input') as HTMLElement)?.focus();
            } else if (item.type === "shell" || item.type === "font") {
              const opts = item.options || ["JetBrains Mono", "Fira Code", "Cascadia Code", "Consolas"];
              let currentVal = item.value as string;
              if (!opts.includes(currentVal)) currentVal = "custom";
              if (currentVal === "custom") {
                const sel = listRef.current?.querySelectorAll('[role="option"]')[currentIdx];
                (sel?.querySelector('input') as HTMLElement)?.focus();
              } else {
                const sel = listRef.current?.querySelectorAll('[role="option"]')[currentIdx];
                (sel?.querySelector('select') as HTMLElement)?.focus();
              }
            }
            break;
          }
          case "left": {
            const item = currentItems[currentIdx];
            if (!item) break;
            if (item.type === "select" || item.type === "shell" || item.type === "font") {
              const opts = item.options || ["JetBrains Mono", "Fira Code", "Cascadia Code", "Consolas"];
              let currentVal = item.value as string;
              if ((item.type === "shell" || item.type === "font") && !opts.includes(currentVal)) currentVal = "custom";
              const idx = opts.indexOf(currentVal);
              const nextVal = opts[(idx - 1 + opts.length) % opts.length];
              if ((item.type === "shell" || item.type === "font") && nextVal === "custom") item.onChange?.("");
              else item.onChange?.(nextVal);
            } else if (item.type === "number") {
              item.onChange?.(Number(Math.max(item.min ?? 0, (item.value as number) - (item.step ?? 1)).toFixed(2)));
            }
            break;
          }
          case "right": {
            const item = currentItems[currentIdx];
            if (!item) break;
            if (item.type === "select" || item.type === "shell" || item.type === "font") {
              const opts = item.options || ["JetBrains Mono", "Fira Code", "Cascadia Code", "Consolas"];
              let currentVal = item.value as string;
              if ((item.type === "shell" || item.type === "font") && !opts.includes(currentVal)) currentVal = "custom";
              const idx = opts.indexOf(currentVal);
              const nextVal = opts[(idx + 1) % opts.length];
              if ((item.type === "shell" || item.type === "font") && nextVal === "custom") item.onChange?.("");
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
      className={`fixed inset-0 z-50 flex items-start justify-center pt-[8vh] outline-none ${isOpen ? "anim-overlay" : "anim-overlay-out"}`}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-[580px] max-w-[92vw] bg-bg-surface border border-surface1 rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-surface0 bg-surface0/30">
          <div className="flex items-center gap-2">
            <span className="text-[23px] font-semibold text-fg">Forge Settings</span>
            {reloadMsg && (
              <span className="text-xs text-accent bg-accent/10 px-2 py-0.5 rounded font-mono animate-fade-in">
                {reloadMsg}
              </span>
            )}
          </div>
          <button
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface0 text-fg-subtle hover:text-fg transition-colors"
            onClick={onClose}
          >
            <X size={15} />
          </button>
        </div>

        <div ref={listRef} className="max-h-[64vh] overflow-y-auto py-2">
          {items.map((item, idx) => {
            const showSection = item.section !== lastSection;
            lastSection = item.section;
            const isSelected = idx === selectedIndex;

            return (
              <div key={item.id}>
                {showSection && (
                  <div className="px-5 pt-4 pb-1 text-[11px] text-accent/90 font-bold uppercase tracking-wider flex items-center gap-2">
                    <span>{item.section}</span>
                    <div className="flex-1 h-px bg-surface0/60" />
                  </div>
                )}
                <div
                  role="option"
                  aria-selected={isSelected}
                  className={`flex items-center gap-3 px-5 py-2.5 cursor-pointer border-l-2 transition-colors ${
                    isSelected
                      ? "border-accent bg-surface1 text-fg font-medium"
                      : "border-transparent text-fg-alt hover:bg-surface1/40 hover:border-l-2 hover:border-surface1"
                  }`}
                  style={{ transitionDuration: "var(--anim-duration, 200ms)" }}
                  onClick={(e) => {
                    setSelectedIndex(idx);
                    if (item.type === "toggle") {
                      item.onChange?.(!item.value);
                    } else if (item.type === "select") {
                      const sel = e.currentTarget;
                      (sel.querySelector('select') as HTMLElement)?.focus();
                    } else if (item.type === "action" || item.type === "filepath") {
                      item.action?.();
                    }
                  }}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="text-sm truncate text-fg">{item.label}</div>
                    {item.description && (
                      <div className="text-[11px] text-fg-subtle truncate mt-0.5">{item.description}</div>
                    )}
                  </div>

                  {item.type === "filepath" && (
                    <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <span
                        className="text-[11px] font-mono text-fg-subtle bg-surface0 px-2 py-1 rounded border border-surface1 max-w-[200px] truncate select-all"
                        title={item.value as string}
                      >
                        {item.value as string}
                      </span>
                      <button
                        className="px-2.5 py-1 text-xs text-fg bg-surface0 hover:bg-surface1 rounded border border-surface1 hover:border-accent transition-colors flex items-center gap-1 font-mono"
                        onClick={(e) => {
                          e.stopPropagation();
                          item.action?.();
                        }}
                      >
                        {copiedPath && <Check size={12} className="text-green-400" />}
                        <span>{item.actionLabel || "Copy"}</span>
                      </button>
                    </div>
                  )}

                  {item.type === "version" && (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="px-2.5 py-0.5 text-xs font-mono font-semibold bg-accent/15 text-accent rounded border border-accent/30">
                        {item.value as string}
                      </span>
                    </div>
                  )}

                  {item.type === "toggle" && (
                    <div className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${item.value ? "bg-accent" : "bg-surface1"}`}
                      style={{ transitionDuration: "var(--anim-duration, 200ms)" }}>
                      <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${item.value ? "translate-x-4" : ""}`}
                        style={{ transitionDuration: "var(--anim-duration, 200ms)" }} />
                    </div>
                  )}

                  {item.type === "select" && (
                    <div className="flex items-center gap-1 text-xs text-fg-subtle bg-surface1 px-2.5 py-1 rounded flex-shrink-0 relative" onClick={(e) => e.stopPropagation()}>
                      <select
                        className="bg-transparent outline-none text-fg appearance-none pr-5 w-full cursor-pointer"
                        value={item.value as string}
                        onChange={(e) => item.onChange?.(e.target.value)}
                      >
                        {item.options?.map(opt => (
                          <option key={opt} value={opt} className="bg-bg-surface text-fg">{opt}</option>
                        ))}
                      </select>
                      <ChevronRight size={12} className="opacity-50 absolute right-2 pointer-events-none" />
                    </div>
                  )}

                  {item.type === "number" && (
                    <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-surface0 text-fg-subtle hover:text-fg transition-colors"
                        onClick={(e) => { e.stopPropagation(); item.onChange?.(Number(Math.max(item.min ?? 0, (item.value as number) - (item.step ?? 1)).toFixed(2))); }}
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-xs text-fg font-mono w-10 text-center">{item.value as number}</span>
                      <button
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-surface0 text-fg-subtle hover:text-fg transition-colors"
                        onClick={(e) => { e.stopPropagation(); item.onChange?.(Number(Math.min(item.max ?? 999, (item.value as number) + (item.step ?? 1)).toFixed(2))); }}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  )}

                  {item.type === "action" && (
                    <button
                      className="px-3 py-1 text-xs text-bg bg-accent rounded hover:opacity-90 font-medium transition-opacity flex-shrink-0"
                      style={{ transitionDuration: "var(--anim-duration, 200ms)" }}
                      onClick={(e) => { e.stopPropagation(); item.action?.(); }}
                    >
                      {item.actionLabel || (item.id === "showTutorial" ? "Open" : item.id === "clearTutorial" ? "Clear" : item.id === "resetConfig" ? "Restore" : "Run")}
                    </button>
                  )}

                  {item.type === "text" && (
                    <input
                      className="w-48 text-xs bg-surface0 text-fg px-2.5 py-1 rounded border border-surface1 focus:border-accent outline-none text-right flex-shrink-0 font-mono"
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

                  {item.type === "font" && (
                    <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <select
                        className="w-36 text-xs bg-surface0 text-fg px-2 py-1 rounded border border-surface1 focus:border-accent outline-none font-mono"
                        value={["JetBrains Mono", "Fira Code", "Cascadia Code", "Consolas"].includes((item.value as string)?.replace(/['"]/g, '').split(',')[0].trim()) ? (item.value as string)?.replace(/['"]/g, '').split(',')[0].trim() : "custom"}
                        onChange={(e) => {
                          if (e.target.value === "custom") {
                            item.onChange?.("");
                          } else {
                            item.onChange?.(e.target.value);
                          }
                        }}
                      >
                        <option value="JetBrains Mono">JetBrains Mono</option>
                        <option value="Fira Code">Fira Code</option>
                        <option value="Cascadia Code">Cascadia Code</option>
                        <option value="Consolas">Consolas</option>
                        <option value="custom">Custom...</option>
                      </select>
                      {!["JetBrains Mono", "Fira Code", "Cascadia Code", "Consolas"].includes((item.value as string)?.replace(/['"]/g, '').split(',')[0].trim()) && (
                        <input
                          className="w-28 text-xs bg-surface0 text-fg px-2 py-1 rounded border border-surface1 focus:border-accent outline-none font-mono"
                          value={item.value as string}
                          placeholder="Font name..."
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

        <div className="flex items-center justify-between px-5 py-2.5 border-t border-surface0 text-[11px] text-fg-subtle bg-surface0/40">
          <div className="flex items-center gap-2">
            <span className="bg-surface0 px-1.5 py-0.5 rounded font-mono border border-surface1">↑↓</span> Navigate
            <span className="bg-surface0 px-1.5 py-0.5 rounded font-mono border border-surface1 ml-1">Enter/Space</span> Select / Run
            <span className="bg-surface0 px-1.5 py-0.5 rounded font-mono border border-surface1 ml-1">←→</span> Adjust
          </div>
          <div>
            <span className="bg-surface0 px-1.5 py-0.5 rounded font-mono border border-surface1">Esc</span> Close
          </div>
        </div>
      </div>
    </div>
  );
}
