import { useEffect, useRef, useCallback } from "react";
import { debounce } from "@/lib/utils";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { SearchAddon } from "@xterm/addon-search";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { useTerminalStore } from "@/stores/terminalStore";
import { useConfigStore } from "@/stores/configStore";
import { usePreviewStore } from "@/stores/previewStore";
import { getTheme } from "@/lib/themes";
import { open } from "@tauri-apps/plugin-shell";

// Tooltip state
let activeTooltip: HTMLElement | null = null;
let tooltipTimeout: NodeJS.Timeout | null = null;

const createTooltip = (event: MouseEvent, uri: string) => {
  if (activeTooltip) {
    activeTooltip.remove();
  }
  if (tooltipTimeout) clearTimeout(tooltipTimeout);

  const tooltip = document.createElement("div");
  tooltip.className = "fixed z-50 bg-surface0 border border-surface1 rounded shadow-lg p-2 flex flex-col gap-2 text-xs text-fg animate-in fade-in zoom-in-95 duration-100";
  
  // Position near cursor, ensuring it doesn't overflow right
  const left = Math.min(event.clientX, window.innerWidth - 220);
  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${event.clientY + 15}px`;

  // Helper text
  const hint = document.createElement("div");
  hint.className = "text-[10px] text-fg-subtle mb-[-4px]";
  hint.innerText = "Ctrl+Click to follow link";
  tooltip.appendChild(hint);

  // Content URL
  const text = document.createElement("span");
  text.className = "font-mono truncate max-w-[300px] block opacity-90 text-accent";
  text.innerText = uri;
  tooltip.appendChild(text);

  // Buttons container
  const btnContainer = document.createElement("div");
  btnContainer.className = "flex items-center gap-1.5 mt-1";

  const btnPreview = document.createElement("button");
  btnPreview.className = "px-2 py-1 bg-surface1 hover:bg-surface2 rounded text-fg transition-colors flex-1";
  btnPreview.innerText = "Preview Panel";
  btnPreview.onclick = () => {
    usePreviewStore.getState().openPreview(uri);
    tooltip.remove();
    activeTooltip = null;
  };
  btnContainer.appendChild(btnPreview);

  const btnBrowser = document.createElement("button");
  btnBrowser.className = "px-2 py-1 bg-surface1 hover:bg-surface2 rounded text-fg transition-colors flex-1";
  btnBrowser.innerText = "System Browser";
  btnBrowser.onclick = () => {
    open(uri).catch(console.error);
    tooltip.remove();
    activeTooltip = null;
  };
  btnContainer.appendChild(btnBrowser);

  tooltip.appendChild(btnContainer);

  // Prevent closing when mouse enters tooltip
  tooltip.onmouseenter = () => {
    if (tooltipTimeout) clearTimeout(tooltipTimeout);
  };
  tooltip.onmouseleave = () => {
    tooltip.remove();
    activeTooltip = null;
  };

  document.body.appendChild(tooltip);
  activeTooltip = tooltip;
};

const closeTooltip = () => {
  if (tooltipTimeout) clearTimeout(tooltipTimeout);
  tooltipTimeout = setTimeout(() => {
    if (activeTooltip) {
      activeTooltip.remove();
      activeTooltip = null;
    }
  }, 200);
};

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
        const targetCwd = cwd || existingSession?.cwd || "";
        const result = await ptySpawn(
          sessionId,
          shellPath,
          targetCwd,
          cols,
          rows,
        );
        updateSession(sessionId, {
          processId: result.process_id,
          shell: shellPath,
          cwd: targetCwd || result.cwd || "",
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
    const webLinksAddon = new WebLinksAddon(
      (event: MouseEvent, uri: string) => {
        // Only open on Ctrl+Click or Cmd+Click
        if (event.ctrlKey || event.metaKey) {
          const behavior = useConfigStore.getState().config.terminal.linkBehavior;
          if (behavior === "preview") {
            usePreviewStore.getState().openPreview(uri);
          } else {
            open(uri).catch(console.error);
          }
        }
      },
      {
        hover: (event: MouseEvent, uri: string) => {
          createTooltip(event, uri);
        },
        leave: () => {
          closeTooltip();
        }
      }
    );
    xterm.loadAddon(fitAddon);
    xterm.loadAddon(searchAddon);
    xterm.loadAddon(webLinksAddon);

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
      
      // Copy on Ctrl+C if text is selected
      if (e.type === "keydown" && e.code === "KeyC" && e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) {
        if (xterm.hasSelection()) {
          navigator.clipboard.writeText(xterm.getSelection()).catch(console.error);
          xterm.clearSelection();
          return false; // Prevent sending SIGINT to terminal
        }
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
      useTerminalStore.getState().setLastFocusedSession(sessionId);
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

    const handleMouseUp = () => {
      if (useConfigStore.getState().config.terminal.copyOnSelect && xterm.hasSelection()) {
        const sel = xterm.getSelection();
        if (sel) {
          navigator.clipboard.writeText(sel).catch(console.error);
        }
      }
    };
    termElem?.addEventListener("mouseup", handleMouseUp);

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
      termElem?.removeEventListener("focus", handleFocus, true);
      termElem?.removeEventListener("blur", handleBlur, true);
      termElem?.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("focus-terminal", handleFocusRequest);
      document.removeEventListener("blur-terminal", handleBlurRequest);
      document.removeEventListener("focus-restore", handleFocusRestore);
      xterm.dispose();
      isSpawnedRef.current = false;
    };
  }, [sessionId]); // only recreate if sessionId changes

  // Sync config changes to running xterm in real time
  useEffect(() => {
    const xterm = xtermRef.current;
    if (!xterm) return;
    xterm.options.fontSize = config.terminal.fontSize;
    xterm.options.fontFamily = config.terminal.fontFamily;
    xterm.options.lineHeight = config.terminal.lineHeight;
    xterm.options.cursorBlink = config.terminal.cursorBlink;
    xterm.options.cursorStyle = config.terminal.cursorStyle;
    xterm.options.scrollback = config.terminal.scrollback;
  }, [
    config.terminal.fontSize,
    config.terminal.fontFamily,
    config.terminal.lineHeight,
    config.terminal.cursorBlink,
    config.terminal.cursorStyle,
    config.terminal.scrollback,
  ]);

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
