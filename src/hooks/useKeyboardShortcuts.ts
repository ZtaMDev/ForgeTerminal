import { useEffect } from "react";
import { useTabStore } from "@/stores/tabStore";
import { useTerminalStore } from "@/stores/terminalStore";
import { useConfigStore } from "@/stores/configStore";
import { matchShortcut, type ShortcutContext } from "@/lib/shortcuts";
import { isPrefixActive, activatePrefix, deactivatePrefix } from "@/lib/prefixMode";
import { showConfirm } from "@/stores/confirmStore";

function preventBrowserDefaults(e: KeyboardEvent) {
  if (e.ctrlKey && (e.code === "KeyP" || e.code === "KeyS" || e.code === "KeyF" || e.code === "KeyB" || e.code === "KeyD" || e.code === "KeyR" || e.code === "KeyO" || e.code === "Comma")) {
    e.preventDefault();
    e.stopPropagation();
  }
}

function focusIfTerminal(tabType: string) {
  if (tabType === "terminal" || tabType === "split") {
    setTimeout(() => {
      document.dispatchEvent(new CustomEvent("focus-terminal"));
    }, 50);
  }
}

export function useKeyboardShortcuts() {
  const config = useConfigStore((s) => s.config);

  useEffect(() => {
    // ── Capture-phase handler: shortcuts ──
    const handler = (e: KeyboardEvent) => {
      const { shortcuts } = config;
      const focused = document.activeElement;
      const isTerminalFocused = focused?.closest(".xterm") !== null;
      const isEditorFocused = focused?.closest(".cm-editor") !== null;
      const isInputFocused = focused?.tagName === "INPUT" || focused?.tagName === "TEXTAREA" || focused?.getAttribute("contenteditable") === "true";
      const isExplorerFocused = focused?.closest('[data-explorer="true"]') !== null;

      let context: ShortcutContext = "global";
      if (isTerminalFocused) context = "terminal";
      else if (isEditorFocused) context = "editor";
      else if (isExplorerFocused) context = "explorer";
      else if (isInputFocused) context = "global";

      // ─── PASSTHROUGH MODE: shortcuts intercept, everything else passthrough ──
      // When the indicator is visible, shortcuts work regardless of DOM focus.
      // Arrow keys cycle split focus. Non-shortcut keys reach xterm normally.
      if (isPrefixActive()) {
        // Ctrl+` always exits passthrough (focuses active session, hides indicator)
        if (e.code === "Backquote" && e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) {
          e.preventDefault();
          e.stopPropagation();
          const focusedId = useTerminalStore.getState().focusedSessionId;
          document.dispatchEvent(
            new CustomEvent("focus-terminal", {
              detail: focusedId ? { sessionId: focusedId } : undefined,
            }),
          );
          deactivatePrefix();
          return;
        }

        // Arrow key split cycling: update store + dispatch focus-terminal for visual feedback
        const tabState = useTabStore.getState();
        const activeTab = tabState.tabs.find((t) => t.id === tabState.activeTabId);
        if (activeTab?.splitLayout && activeTab.splitLayout.splits.length > 1) {
          const splits = activeTab.splitLayout.splits;
          const focusedId = useTerminalStore.getState().focusedSessionId;
          const idx = focusedId ? splits.indexOf(focusedId) : -1;
          switch (e.code) {
            case "ArrowUp":
            case "ArrowLeft": {
              const prev = (idx - 1 + splits.length) % splits.length;
              const prevSession = splits[prev];
              if (prevSession && prev !== idx) {
                e.preventDefault();
                useTerminalStore.getState().setFocusedSession(prevSession);
                document.dispatchEvent(new CustomEvent("focus-terminal", { detail: { sessionId: prevSession } }));
                return;
              }
              break;
            }
            case "ArrowDown":
            case "ArrowRight": {
              const next = (idx + 1) % splits.length;
              const nextSession = splits[next];
              if (nextSession && next !== idx) {
                e.preventDefault();
                useTerminalStore.getState().setFocusedSession(nextSession);
                document.dispatchEvent(new CustomEvent("focus-terminal", { detail: { sessionId: nextSession } }));
                return;
              }
              break;
            }
          }
        }

        // Global shortcuts work in passthrough mode (close split, split, etc.)
        const globalBinding = findBinding(shortcuts.global, e);
        if (globalBinding) {
          e.preventDefault();
          e.stopPropagation();
          handleAction(globalBinding, context);
          return;
        }

        // No shortcut matched → passthrough to the focused element (xterm, etc.)
        // Don't preventDefault — let xterm or the focused element handle it.
        return;
      }

      // Ctrl+` toggles passthrough mode (indicator on/off)
      // Only reached when NOT in passthrough mode.
      // IMPORTANT: do NOT blur xterm — that would clear focusedSessionId.
      // Passthrough mode intercepts shortcuts in capture phase; non-shortcut
      // keys naturally reach the focused terminal (or fall through otherwise).
      if (e.code === "Backquote" && e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        if (isTerminalFocused) {
          activatePrefix();
        } else {
          document.dispatchEvent(new CustomEvent("focus-terminal"));
          activatePrefix();
        }
        return;
      }

      // ─── TERMINAL HAS DOM FOCUS ───────────────────────────
      // Let EVERYTHING through to xterm. DON'T call
      // preventDefault here — xterm checks e.defaultPrevented
      // and will skip processing if we do.
      if (isTerminalFocused) {
        return;
      }

      // ─── NON-TERMINAL (xterm blurred) ────────────────────
      preventBrowserDefaults(e);

      // Editor shortcuts
      if (context === "editor") {
        const editorBinding = findBinding(shortcuts.editor, e);
        if (editorBinding) {
          e.preventDefault();
          e.stopPropagation();
          handleAction(editorBinding, context);
          return;
        }
      }

      // Explorer shortcuts
      if (context === "explorer") {
        const explorerBinding = findBinding(shortcuts.explorer, e);
        if (explorerBinding) {
          e.preventDefault();
          e.stopPropagation();
          handleExplorerAction(explorerBinding);
          return;
        }
      }

      // Global shortcuts
      const globalBinding = findBinding(shortcuts.global, e);
      if (globalBinding) {
        e.preventDefault();
        e.stopPropagation();
        handleAction(globalBinding, context);
      }
    };

    document.addEventListener("keydown", handler, { capture: true });

    // ── Bubble-phase handler: prevent browser defaults that xterm missed ──
    // xterm calls preventDefault for keys it processes. This handler catches
    // keys that xterm doesn't handle (e.g. Ctrl+Shift+P) and prevents the
    // browser default (print dialog) without blocking xterm's processing.
    const bubbleHandler = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return; // xterm already handled it
      const isTerminalFocused = document.activeElement?.closest(".xterm") !== null;
      if (isTerminalFocused) {
        if (e.ctrlKey && (e.code === "KeyP" || e.code === "KeyS" || e.code === "KeyF" || e.code === "KeyB" || e.code === "KeyD" || e.code === "KeyR" || e.code === "KeyO" || e.code === "Comma")) {
          e.preventDefault();
        }
      }
    };
    document.addEventListener("keydown", bubbleHandler);
    return () => {
      document.removeEventListener("keydown", handler, { capture: true });
      document.removeEventListener("keydown", bubbleHandler);
    };
  }, [config]);

  function findBinding(
    bindings: Record<string, string[]>,
    e: KeyboardEvent,
  ): string | null {
    for (const [command, keys] of Object.entries(bindings)) {
      if (keys.some((k) => matchShortcut(e, k))) {
        return command;
      }
    }
    return null;
  }

  function cycleTerminalSession() {
    const tabState = useTabStore.getState();
    const termState = useTerminalStore.getState();
    const { tabs, activeTabId } = tabState;
    const activeTab = tabs.find((t) => t.id === activeTabId);
    if (!activeTab || (activeTab.type !== "terminal" && activeTab.type !== "split")) return;

    if (activeTab.type === "split" && activeTab.splitLayout && activeTab.splitLayout.splits.length > 1) {
      const splits = activeTab.splitLayout.splits;
      const focusedId = termState.focusedSessionId;
      const currentIdx = focusedId ? splits.indexOf(focusedId) : -1;
      const nextIdx = (currentIdx + 1) % splits.length;
      const nextSession = splits[nextIdx];
      if (nextSession) {
        document.dispatchEvent(
          new CustomEvent("focus-terminal", { detail: { sessionId: nextSession } }),
        );
        return;
      }
    }

    document.dispatchEvent(new CustomEvent("focus-terminal"));
  }

  function handleExplorerAction(command: string) {
    switch (command) {
      case "focus-explorer": {
        const el = document.querySelector('[data-explorer="true"]') as HTMLElement | null;
        el?.focus();
        break;
      }
      case "new-file":
      case "new-folder":
      case "rename":
      case "delete":
      case "refresh": {
        break;
      }
    }
  }

  function handleAction(command: string, _context: ShortcutContext) {
    const tabState = useTabStore.getState();
    const termState = useTerminalStore.getState();
    const { tabs, activeTabId } = tabState;

    switch (command) {
      case "new-terminal": {
        const id = crypto.randomUUID();
        tabState.addTab({
          id,
          type: "terminal",
          title: "Terminal",
          sessionId: id,
          pinned: false,
          createdAt: Date.now(),
        });
        termState.addSession({
          id,
          title: "Terminal",
          shell: "",
          cwd: "",
          cols: 80,
          rows: 24,
          processId: null,
          createdAt: Date.now(),
        });
        setTimeout(() => {
          document.dispatchEvent(new CustomEvent("focus-terminal"));
        }, 100);
        break;
      }
      case "close-tab": {
        if (!activeTabId) break;
        const tab = tabs.find((t) => t.id === activeTabId);
        if (!tab || tab.pinned) break;

        if (tab.type === "split" && tab.splitLayout && tab.splitLayout.splits.length > 1) {
          const focusedId = termState.focusedSessionId;
          if (focusedId && tab.splitLayout.splits.includes(focusedId)) {
            tabState.closeSplit(activeTabId, focusedId);
            break;
          }
          // No focused session — warn before closing entire tab
          showConfirm("No terminal selected. Close the entire tab?").then((ok) => {
            if (ok) tabState.removeTab(activeTabId);
          });
          break;
        }
        tabState.removeTab(activeTabId);
        break;
      }
      case "close-split": {
        if (activeTabId) {
          const tab = tabs.find((t) => t.id === activeTabId);
          if (tab && !tab.pinned) {
            tabState.removeTab(activeTabId);
          }
        }
        break;
      }
      case "next-tab": {
        if (tabs.length === 0) break;
        const idx = tabs.findIndex((t) => t.id === activeTabId);
        const next = (idx + 1) % tabs.length;
        tabState.setActiveTab(tabs[next].id);
        focusIfTerminal(tabs[next].type);
        break;
      }
      case "prev-tab": {
        if (tabs.length === 0) break;
        const idx = tabs.findIndex((t) => t.id === activeTabId);
        const prev = (idx - 1 + tabs.length) % tabs.length;
        tabState.setActiveTab(tabs[prev].id);
        focusIfTerminal(tabs[prev].type);
        break;
      }
      case "split-horizontal": {
        if (activeTabId) {
          const newId = tabState.splitHorizontal(activeTabId);
          if (newId) {
            const parentSession = termState.sessions.get(activeTabId);
            termState.addSession({
              id: newId,
              title: "Terminal",
              shell: parentSession?.shell ?? "",
              cwd: parentSession?.cwd ?? "",
              cols: parentSession?.cols ?? 80,
              rows: parentSession?.rows ?? 24,
              processId: null,
              createdAt: Date.now(),
            });
          }
        }
        break;
      }
      case "split-vertical": {
        if (activeTabId) {
          const newId = tabState.splitVertical(activeTabId);
          if (newId) {
            const parentSession = termState.sessions.get(activeTabId);
            termState.addSession({
              id: newId,
              title: "Terminal",
              shell: parentSession?.shell ?? "",
              cwd: parentSession?.cwd ?? "",
              cols: parentSession?.cols ?? 80,
              rows: parentSession?.rows ?? 24,
              processId: null,
              createdAt: Date.now(),
            });
          }
        }
        break;
      }
      case "command-palette": {
        document.dispatchEvent(new CustomEvent("toggle-command-palette"));
        break;
      }
      case "toggle-explorer": {
        const cfg = useConfigStore.getState();
        cfg.setLayout({ explorerHidden: !cfg.config.layout.explorerHidden });
        break;
      }
      case "duplicate-tab": {
        if (activeTabId) {
          const newTabId = tabState.duplicateTab(activeTabId);
          const dupSourceTab = tabState.tabs.find((t) => t.id === activeTabId);
          if (newTabId && (dupSourceTab?.type === "terminal" || dupSourceTab?.type === "split")) {
            const parentSession = termState.sessions.get(activeTabId);
            termState.addSession({
              id: newTabId,
              title: "Terminal",
              shell: parentSession?.shell ?? "",
              cwd: parentSession?.cwd ?? "",
              cols: parentSession?.cols ?? 80,
              rows: parentSession?.rows ?? 24,
              processId: null,
              createdAt: Date.now(),
            });
          }
        }
        break;
      }
      case "rename-tab": {
        const tab = tabs.find((t) => t.id === activeTabId);
        if (tab) {
          document.dispatchEvent(
            new CustomEvent("open-rename-dialog", { detail: { tabId: tab.id, currentName: tab.title } }),
          );
        }
        break;
      }
      case "new-terminal-at": {
        document.dispatchEvent(new CustomEvent("open-terminal-location-picker"));
        break;
      }
      case "change-explorer-root": {
        document.dispatchEvent(new CustomEvent("open-explorer-root-picker"));
        break;
      }
      case "toggle-terminal": {
        const activeTab = tabs.find((t) => t.id === activeTabId);
        if (activeTab && (activeTab.type === "terminal" || activeTab.type === "split")) {
          cycleTerminalSession();
        } else {
          const termTab = tabs.find((t) => t.type === "terminal" || t.type === "split");
          if (termTab) {
            tabState.setActiveTab(termTab.id);
            setTimeout(() => {
              document.dispatchEvent(new CustomEvent("focus-terminal"));
            }, 50);
          }
        }
        break;
      }
      case "tab-1":
      case "tab-2":
      case "tab-3":
      case "tab-4":
      case "tab-5":
      case "tab-6":
      case "tab-7":
      case "tab-8":
      case "tab-9": {
        const n = parseInt(command.split("-")[1], 10);
        const tab = tabs[n - 1];
        if (tab) {
          tabState.setActiveTab(tab.id);
          focusIfTerminal(tab.type);
        }
        break;
      }
      default:
        break;
    }
  }
}
