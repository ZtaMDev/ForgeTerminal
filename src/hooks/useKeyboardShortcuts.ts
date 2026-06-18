import { useEffect } from "react";
import { useTabStore } from "@/stores/tabStore";
import { useTerminalStore } from "@/stores/terminalStore";
import { useConfigStore } from "@/stores/configStore";
import { matchShortcut, type ShortcutContext } from "@/lib/shortcuts";
import { isPrefixActive, activatePrefix, deactivatePrefix } from "@/lib/prefixMode";

function preventBrowserDefaults(e: KeyboardEvent) {
  if (e.ctrlKey && (e.code === "KeyP" || e.code === "KeyS" || e.code === "KeyF" || e.code === "KeyB" || e.code === "KeyD" || e.code === "KeyR" || e.code === "KeyO" || e.code === "Comma" || e.code === "KeyJ" || e.code === "KeyU")) {
    e.preventDefault();
    e.stopPropagation();
  }
}

function focusTabContent(tabType: string) {
  setTimeout(() => {
    if (tabType === "terminal" || tabType === "split") {
      document.dispatchEvent(new CustomEvent("focus-terminal"));
    }
  }, 50);
}

export function useKeyboardShortcuts() {
  const config = useConfigStore((s) => s.config);

  useEffect(() => {
    // ── Capture-phase handler: shortcuts ──
    const handler = (e: KeyboardEvent) => {
      if (document.querySelector('[data-tutorial="true"]')) {
        return;
      }

      if (document.querySelector('[data-overlay="true"]')) {
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter", " ", "Escape", "Home", "End"].includes(e.key)) {
          return;
        }
      }

      const { shortcuts } = config;
      const focused = document.activeElement;
      const isTerminalFocused = focused?.closest(".xterm") !== null;

      // Passthrough mode is ON by default.
      // - Shortcuts ALWAYS intercept when passthrough is ON
      // - Non-shortcut keys pass through to xterm
      // - Ctrl+` toggles passthrough OFF (terminal-only mode)
      //   so you can send shortcut combos directly to the terminal

      // ─── PASSTHROUGH MODE: ON (default) ──────────────────
      if (isPrefixActive()) {
        // Ctrl+`:
        // - If terminal is focused: toggle passthrough OFF (deactivate)
        // - If terminal is NOT focused: just focus it, don't change passthrough
        if (e.code === "Backquote" && e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) {
          e.preventDefault();
          e.stopPropagation();
          if (isTerminalFocused) {
            const focusedId = useTerminalStore.getState().focusedSessionId;
            document.dispatchEvent(
              new CustomEvent("focus-terminal", {
                detail: focusedId ? { sessionId: focusedId } : undefined,
              }),
            );
            deactivatePrefix();
          } else {
            document.dispatchEvent(new CustomEvent("focus-terminal"));
          }
          return;
        }

        // Ctrl+Shift+ArrowLeft/Right cycle splits (only when passthrough is ON)
        if (e.ctrlKey && e.shiftKey && (e.code === "ArrowLeft" || e.code === "ArrowRight")) {
          const tabState = useTabStore.getState();
          const activeTab = tabState.tabs.find((t) => t.id === tabState.activeTabId);
          if (activeTab?.splitLayout && activeTab.splitLayout.splits.length > 1) {
            const splits = activeTab.splitLayout.splits;
            const focusedId = useTerminalStore.getState().focusedSessionId;
            const idx = focusedId ? splits.indexOf(focusedId) : -1;
            if (e.code === "ArrowLeft") {
              const prev = (idx - 1 + splits.length) % splits.length;
              const prevSession = splits[prev];
              if (prevSession && prev !== idx) {
                e.preventDefault();
                e.stopPropagation();
                useTerminalStore.getState().setFocusedSession(prevSession);
                document.dispatchEvent(new CustomEvent("focus-terminal", { detail: { sessionId: prevSession } }));
                return;
              }
            } else {
              const next = (idx + 1) % splits.length;
              const nextSession = splits[next];
              if (nextSession && next !== idx) {
                e.preventDefault();
                e.stopPropagation();
                useTerminalStore.getState().setFocusedSession(nextSession);
                document.dispatchEvent(new CustomEvent("focus-terminal", { detail: { sessionId: nextSession } }));
                return;
              }
            }
          }
        }

        // Check all shortcuts (global + terminal)
        const allBindings: [string, Record<string, string[]>][] = [
          ["global", shortcuts.global],
          ["terminal", shortcuts.terminal],
        ];
        for (const [category, bindings] of allBindings) {
          const binding = findBinding(bindings, e);
          if (binding) {
            e.preventDefault();
            e.stopPropagation();
            handleAction(binding, category as ShortcutContext);
            return;
          }
        }

        // No shortcut matched → passthrough to the focused element (xterm, etc.)
        return;
      }

      // ─── PASSTHROUGH MODE: OFF (terminal-only) ───────────
      // All keys go directly to the terminal. Ctrl+` reactivates passthrough.
      if (e.code === "Backquote" && e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        if (isTerminalFocused) {
          activatePrefix();
        } else {
          document.dispatchEvent(new CustomEvent("focus-terminal"));
        }
        return;
      }

      // All keys pass through to terminal without interception
      if (isTerminalFocused) {
        return;
      }

      // Non-terminal focus: only prevent browser defaults
      preventBrowserDefaults(e);
    };

    document.addEventListener("keydown", handler, { capture: true });

    // ── Listen for external toggle requests (from command palette) ──
    const togglePassthrough = () => {
      if (isPrefixActive()) {
        deactivatePrefix();
      } else {
        const focusedId = useTerminalStore.getState().focusedSessionId;
        if (!focusedId) {
          const termTab = useTabStore.getState().tabs.find(
            (t) => t.type === "terminal" || t.type === "split",
          );
          if (termTab) {
            document.dispatchEvent(new CustomEvent("focus-terminal"));
          }
        }
        activatePrefix();
      }
    };
    document.addEventListener("toggle-passthrough", togglePassthrough);

    // ── Bubble-phase handler: prevent browser defaults that xterm missed ──
    const bubbleHandler = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      const isTerminalFocused = document.activeElement?.closest(".xterm") !== null;
      if (e.ctrlKey && (e.code === "KeyP" || e.code === "KeyS" || e.code === "KeyF" || e.code === "KeyB" || e.code === "KeyD" || e.code === "KeyR" || e.code === "KeyO" || e.code === "Comma" || e.code === "KeyJ" || e.code === "KeyU")) {
        e.preventDefault();
      }
    };
    document.addEventListener("keydown", bubbleHandler);
    return () => {
      document.removeEventListener("keydown", handler, { capture: true });
      document.removeEventListener("keydown", bubbleHandler);
      document.removeEventListener("toggle-passthrough", togglePassthrough);
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
          tabState.removeTab(activeTabId);
          break;
        }
        tabState.removeTab(activeTabId);
        break;
      }
      case "close-entire-tab": {
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
        focusTabContent(tabs[next].type);
        break;
      }
      case "prev-tab": {
        if (tabs.length === 0) break;
        const idx = tabs.findIndex((t) => t.id === activeTabId);
        const prev = (idx - 1 + tabs.length) % tabs.length;
        tabState.setActiveTab(tabs[prev].id);
        focusTabContent(tabs[prev].type);
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
            setTimeout(() => {
              document.dispatchEvent(new CustomEvent("focus-terminal", { detail: { sessionId: newId } }));
            }, 100);
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
            setTimeout(() => {
              document.dispatchEvent(new CustomEvent("focus-terminal", { detail: { sessionId: newId } }));
            }, 100);
          }
        }
        break;
      }
      case "command-palette": {
        document.dispatchEvent(new CustomEvent("toggle-command-palette"));
        break;
      }
      case "open-settings": {
        document.dispatchEvent(new CustomEvent("toggle-settings-panel"));
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
      case "focus-terminal": {
        const termTab = tabs.find((t) => t.type === "terminal" || t.type === "split");
        if (termTab) {
          tabState.setActiveTab(termTab.id);
          setTimeout(() => {
            document.dispatchEvent(new CustomEvent("focus-terminal"));
          }, 50);
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
          focusTabContent(tab.type);
        }
        break;
      }
      case "new-terminal-at": {
        document.dispatchEvent(new CustomEvent("open-path-input"));
        break;
      }
      case "font-increase": {
        const cur = config.terminal.fontSize;
        useConfigStore.getState().setTerminal({ fontSize: Math.min(72, cur + 1) });
        break;
      }
      case "font-decrease": {
        const cur = config.terminal.fontSize;
        useConfigStore.getState().setTerminal({ fontSize: Math.max(6, cur - 1) });
        break;
      }
      default:
        break;
    }
  }
}
