import { useEffect, useRef, useCallback } from "react";
import { debounce } from "@/lib/utils";
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
  getDefaultShell,
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

function extractCWD(buffer: string): string | null {
  // OSC 7 sequence: ESC ] 7 ; file : // hostname / path ESC \
  const osc7 = buffer.match(/\x1b\]7;file:\/\/[^/]+(\/[^\x1b]*?)\x1b\\/);
  if (osc7 && osc7[1]) {
    return decodeURIComponent(osc7[1]);
  }

  // Windows PowerShell prompt: PS C:\Users\name>
  const psMatch = buffer.match(/(?:^|\n)\s*PS\s+([A-Za-z]:[^\n>]*?)>/);
  if (psMatch && psMatch[1]) {
    const path = psMatch[1].replace(/\s+$/, "");
    if (/^[A-Za-z]:\\/.test(path) || /^[A-Za-z]:\//.test(path)) {
      return path.replace(/\//g, "\\");
    }
  }

  // Windows cmd prompt: C:\Users\name>
  const cmdMatch = buffer.match(/(?:^|\n)\s*([A-Za-z]:\\[^\n>]*?)>/);
  if (cmdMatch && cmdMatch[1]) {
    const path = cmdMatch[1].replace(/\s+$/, "");
    if (/^[A-Za-z]:\\/.test(path)) {
      return path;
    }
  }

  return null;
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
          shell || config.terminal.defaultShell || await getDefaultShell() || "powershell.exe";
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

    // Fire listener registration and PTY spawn in parallel
    const cols = xterm.cols;
    const rows = xterm.rows;

    // Buffer for detecting CWD from prompt changes
    let cwdBuffer = "";

    (async () => {
      const [unsubs] = await Promise.all([
        Promise.all([
          onPTYData(sessionId, (payload) => {
            xterm.write(payload.data);
            // Parse PTY output for CWD changes (Windows prompt patterns)
            cwdBuffer += payload.data;
            if (cwdBuffer.length > 4096) {
              cwdBuffer = cwdBuffer.slice(-2048);
            }
            const cwd = extractCWD(cwdBuffer);
            if (cwd) {
              const session = useTerminalStore.getState().sessions.get(sessionId);
              if (session && session.cwd !== cwd) {
                useTerminalStore.getState().updateSession(sessionId, { cwd });
              }
            }
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
        ]),
        spawnPTY(cols, rows),
      ]);
      unlistenRef.current = unsubs;
    })();

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

    // ResizeObserver to keep fit (debounced to avoid excessive IPC)
    const onResize = debounce(() => {
      try {
        fitAddon.fit();
        const { cols, rows } = xterm;
        ptyResize(sessionId, cols, rows).catch(() => {});
      } catch {
        // ignore
      }
    }, 50);
    const observer = new ResizeObserver(onResize);

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
