import { useEffect, useRef, useCallback } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { SearchAddon } from "@xterm/addon-search";
import { useTerminalStore } from "@/stores/terminalStore";
import { useConfigStore } from "@/stores/configStore";
import { getTheme } from "@/lib/themes";
import {
  ptySpawn,
  ptyWrite,
  ptyResize,
  onPTYData,
  onPTYExit,
  onPTYError,
} from "@/lib/ipc";
import "@xterm/xterm/css/xterm.css";

interface TerminalInstanceProps {
  sessionId: string;
  shell?: string;
  cwd?: string;
  tabId?: string;
}

export function TerminalInstance({
  sessionId,
  shell,
  cwd,
  tabId: _tabId,
}: TerminalInstanceProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const searchAddonRef = useRef<SearchAddon | null>(null);
  const unlistenRef = useRef<(() => void)[]>([]);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const isSpawnedRef = useRef(false);

  const config = useConfigStore((s) => s.config);
  const { updateSession, removeSession } = useTerminalStore();
  const theme = getTheme(config.theme.type);

  const spawnPTY = useCallback(
    async (cols: number, rows: number) => {
      if (isSpawnedRef.current) return;

      // Check if session already has a process running (for tab reconnection)
      const existingSession = useTerminalStore.getState().sessions.get(sessionId);
      if (existingSession?.processId != null) {
        // PTY already running, just resize to current dimensions
        isSpawnedRef.current = true;
        try {
          await ptyResize(sessionId, cols, rows);
        } catch { /* ignore */ }
        return;
      }

      isSpawnedRef.current = true;

      try {
        const detectedShell =
          shell || config.terminal.defaultShell || (await import("@/lib/ipc")).getDefaultShell() || "powershell.exe";
        const shellPath = typeof detectedShell === "string" ? detectedShell : "powershell.exe";
        const result = await ptySpawn(
          sessionId,
          shellPath,
          cwd || "",
          cols,
          rows,
        );
        updateSession(sessionId, {
          processId: result.process_id,
          shell: shellPath,
          cwd: cwd || result.cwd || "",
        });
        // Update explorer path with the effective CWD (respect session's pre-set cwd)
        const { useExplorerStore } = await import("@/stores/explorerStore");
        if (useExplorerStore.getState().shouldFollowTerminal()) {
          const effectiveCwd = cwd || result.cwd || "";
          if (effectiveCwd) {
            useExplorerStore.getState().setCurrentPath(effectiveCwd);
          }
        }
      } catch (e) {
        console.error("Failed to spawn PTY:", e);
        isSpawnedRef.current = false;
      }
    },
    [sessionId, shell, cwd, config.terminal.defaultShell, updateSession],
  );

  useEffect(() => {
    if (!terminalRef.current) return;

    const xterm = new Terminal({
      cols: 80,
      rows: 24,
      cursorBlink: config.terminal.cursorBlink,
      cursorStyle: config.terminal.cursorStyle,
      cursorWidth: 2,
      fontSize: config.terminal.fontSize,
      fontFamily: config.terminal.fontFamily,
      lineHeight: config.terminal.lineHeight,
      scrollback: config.terminal.scrollback,
      allowTransparency: true,
      theme: theme.terminal,
      allowProposedApi: true,
      minimumContrastRatio: 4.5,
    });

    const fitAddon = new FitAddon();
    const searchAddon = new SearchAddon();
    xterm.loadAddon(fitAddon);
    xterm.loadAddon(searchAddon);

    xterm.open(terminalRef.current);

    // Fit synchronously before PTY spawn to get correct dimensions from the start
    try {
      fitAddon.fit();
    } catch {
      // container not yet visible
    }

    const run = async () => {
      // Set up listeners BEFORE spawn to avoid race conditions
      const unsubs = await Promise.all([
        onPTYData(sessionId, (payload) => {
          xterm.write(payload.data);
        }),
        onPTYExit(sessionId, (payload) => {
          const message = `\r\n\x1b[33m[Process exited (code: ${payload.code})]\x1b[0m`;
          xterm.writeln(message);
          isSpawnedRef.current = false;
        }),
        onPTYError(sessionId, (payload) => {
          const message = `\r\n\x1b[31m[PTY Error: ${payload.message}]\x1b[0m`;
          xterm.writeln(message);
          isSpawnedRef.current = false;
        }),
      ]);
      unlistenRef.current = unsubs;

      const cols = xterm.cols;
      const rows = xterm.rows;
      await spawnPTY(cols, rows);
    };

    run();

    // Control key routing:
    // - The capture-phase shortcut handler intercepts forge shortcuts before xterm sees them
    // - Ctrl+` is always blocked from xterm → handled by shortcut system for passthrough toggle
    // - All other keys pass through so REPL shortcuts (Ctrl+C, Ctrl+B, etc.) work in terminal
    xterm.attachCustomKeyEventHandler((e) => {
      // Ctrl+` is always our toggle key — blocked from xterm
      if (e.code === "Backquote" && e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) {
        return false;
      }
      // All other keys go to xterm; forge shortcuts are intercepted upstream in capture phase
      return true;
    });

    // Input: JS -> PTY
    xterm.onData((data) => {
      ptyWrite(sessionId, data).catch((err) => {
        console.error("PTY write failed:", err);
      });
    });

    // Resize: PTY resize on xterm resize
    xterm.onResize(({ cols, rows }) => {
      ptyResize(sessionId, cols, rows).catch(console.error);
    });

    // Focus detection via element
    const handleFocus = () => {
      useTerminalStore.getState().setFocusedSession(sessionId);
      document.dispatchEvent(
        new CustomEvent("terminal-focus", { detail: { sessionId } }),
      );
    };
    const handleBlur = () => {
      useTerminalStore.getState().setFocusedSession(null);
      document.dispatchEvent(
        new CustomEvent("terminal-blur", { detail: { sessionId } }),
      );
    };

    const termElem = terminalRef.current.querySelector(".xterm") as HTMLElement | null;
    termElem?.setAttribute("tabindex", "0");
    termElem?.addEventListener("focus", handleFocus, true);
    termElem?.addEventListener("blur", handleBlur, true);

    // Listen for external focus requests (e.g. from Ctrl+` shortcut)
    const handleFocusRequest = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail || detail.sessionId === sessionId) {
        xterm.focus();
      }
    };
    document.addEventListener("focus-terminal", handleFocusRequest);

    // Listen for external blur requests (e.g. from prefix mode)
    const handleBlurRequest = () => {
      xterm.blur();
    };
    document.addEventListener("blur-terminal", handleBlurRequest);

    // Restore focus after prefix mode ends
    const handleFocusRestore = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail || !detail.sessionId || detail.sessionId === sessionId) {
        xterm.focus();
      }
    };
    document.addEventListener("focus-restore", handleFocusRestore);

    // ResizeObserver to keep fit
    const observer = new ResizeObserver(() => {
      try {
        fitAddon.fit();
        const { cols, rows } = xterm;
        ptyResize(sessionId, cols, rows).catch(() => {});
      } catch {
        // ignore
      }
    });

    if (terminalRef.current.parentElement) {
      observer.observe(terminalRef.current.parentElement);
    }

    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;
    searchAddonRef.current = searchAddon;
    resizeObserverRef.current = observer;

    // Cleanup
    return () => {
      observer.disconnect();
      unlistenRef.current.forEach((fn) => fn());
      // Don't kill PTY on unmount — keep it alive for tab switching
      termElem?.removeEventListener("focus", handleFocus, true);
      termElem?.removeEventListener("blur", handleBlur, true);
      document.removeEventListener("focus-terminal", handleFocusRequest);
      document.removeEventListener("blur-terminal", handleBlurRequest);
      document.removeEventListener("focus-restore", handleFocusRestore);
      xterm.dispose();
      isSpawnedRef.current = false;
    };
  }, [sessionId]); // only recreate if sessionId changes

  return (
    <div className="w-full h-full">
      <div
        ref={terminalRef}
        className="w-full h-full"
        style={{
          background: theme.terminal.background ?? "#1e1e2e",
          opacity: config.theme.opacity,
        }}
      />
    </div>
  );
}
