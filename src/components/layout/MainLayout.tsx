import { useState, useCallback, useEffect, useRef, lazy, Suspense } from "react";
import { TitleBar } from "./TitleBar";
import { PanelResizer } from "./PanelResizer";
import { TabBar } from "@/components/tabs/TabBar";
import { WelcomeTab } from "@/components/tabs/WelcomeTab";
import { StatusBar } from "@/components/statusbar/StatusBar";
import { FileExplorer } from "@/components/explorer/FileExplorer";
import { TerminalTab } from "@/components/terminal/TerminalTab";
import { CommandPalette } from "@/components/common/CommandPalette";
import { RenameDialog } from "@/components/common/RenameDialog";
import { PathPickerDialog } from "@/components/explorer/PathPickerDialog";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useTabStore } from "@/stores/tabStore";
import { useTerminalStore } from "@/stores/terminalStore";
import { useConfigStore } from "@/stores/configStore";
import { useExplorerStore } from "@/stores/explorerStore";
import { getAllCommands } from "@/lib/commands";
import { isImageFile } from "@/components/viewer/ImageViewer";
import { ImageViewer } from "@/components/viewer/ImageViewer";
import { RawViewer } from "@/components/viewer/RawViewer";

const CodeMirrorEditor = lazy(() =>
  import("@/components/editor/CodeMirrorEditor").then((m) => ({ default: m.CodeMirrorEditor })),
);

export function MainLayout() {
  useKeyboardShortcuts();

  const config = useConfigStore((s) => s.config);
  const { tabs, activeTabId } = useTabStore();
  const { isPinned } = useExplorerStore();

  const [explorerWidth, setExplorerWidth] = useState(config.explorer.width);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [renameTabId, setRenameTabId] = useState<string | null>(null);
  const [renameCurrentName, setRenameCurrentName] = useState("");
  const [pathPicker, setPathPicker] = useState<{
    mode: "new-terminal" | "change-root";
    initialPath: string;
  } | null>(null);

  const handleExplorerResize = useCallback((delta: number) => {
    setExplorerWidth((prev) => Math.max(180, Math.min(500, prev + delta)));
  }, []);

  const handleRenameConfirm = useCallback((name: string) => {
    if (renameTabId) {
      useTabStore.getState().updateTab(renameTabId, { title: name });
    }
    setRenameTabId(null);
  }, [renameTabId]);

  const createTerminalAt = useCallback((targetDir: string) => {
    const id = crypto.randomUUID();
    useTabStore.getState().addTab({
      id,
      type: "terminal",
      title: "Terminal",
      sessionId: id,
      pinned: false,
      createdAt: Date.now(),
    });
    useTerminalStore.getState().addSession({
      id,
      title: "Terminal",
      shell: "",
      cwd: targetDir,
      cols: 80,
      rows: 24,
      processId: null,
      createdAt: Date.now(),
    });
    // Auto-navigate explorer to target dir (if not pinned)
    const explorer = useExplorerStore.getState();
    if (explorer.shouldFollowTerminal()) {
      explorer.setCurrentPath(targetDir);
      explorer.setTabPath(id, targetDir);
    }
    setTimeout(() => {
      document.dispatchEvent(new CustomEvent("focus-terminal"));
      // After focus, auto-cd to the chosen directory
      setTimeout(async () => {
        try {
          const { ptyWrite } = await import("@/lib/ipc");
          const escaped = targetDir.replace(/"/g, '\\"');
          await ptyWrite(id, `cd "${escaped}"\r\n`);
        } catch {}
      }, 200);
    }, 100);
  }, []);

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const explorerVisible = !config.layout.explorerHidden;

  useEffect(() => {
    const togglePalette = () => {
      setPaletteOpen((p) => !p);
    };
    const openRename = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setRenameTabId(detail.tabId);
      setRenameCurrentName(detail.currentName);
    };
    const blockContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    const openTerminalPicker = () => {
      const cwd = useTerminalStore.getState().focusedSessionId
        ? (useTerminalStore.getState().sessions.get(useTerminalStore.getState().focusedSessionId!)?.cwd ?? "")
        : useExplorerStore.getState().currentPath || "";
      setPathPicker({ mode: "new-terminal", initialPath: cwd || "" });
    };
    const openExplorerRootPicker = () => {
      const current = useExplorerStore.getState().currentPath || useExplorerStore.getState().pinnedPath || "";
      setPathPicker({ mode: "change-root", initialPath: current });
    };
    document.addEventListener("toggle-command-palette", togglePalette);
    document.addEventListener("open-rename-dialog", openRename);
    document.addEventListener("open-terminal-location-picker", openTerminalPicker);
    document.addEventListener("open-explorer-root-picker", openExplorerRootPicker);
    document.addEventListener("contextmenu", blockContextMenu);
    return () => {
      document.removeEventListener("toggle-command-palette", togglePalette);
      document.removeEventListener("open-rename-dialog", openRename);
      document.removeEventListener("open-terminal-location-picker", openTerminalPicker);
      document.removeEventListener("open-explorer-root-picker", openExplorerRootPicker);
      document.removeEventListener("contextmenu", blockContextMenu);
    };
  }, []);

  // Save explorer path per-tab on tab switch
  const prevTabIdRef = useRef<string | null>(null);
  useEffect(() => {
    // Save current state for the previous tab
    if (prevTabIdRef.current && prevTabIdRef.current !== activeTabId) {
      const explorer = useExplorerStore.getState();
      explorer.setTabPath(prevTabIdRef.current, explorer.currentPath);
      explorer.setTabExpanded(prevTabIdRef.current, Array.from(explorer.expandedPaths));
    }
    prevTabIdRef.current = activeTabId;

    // Restore state for the new tab
    if (!activeTab) return;

    const explorer = useExplorerStore.getState();
    if (!explorer.shouldFollowTerminal()) return;
    if (activeTab.type !== "terminal" && activeTab.type !== "split") return;

    const savedPath = explorer.tabPaths[activeTab.id];
    if (savedPath) {
      explorer.setCurrentPath(savedPath);
    } else {
      const sessionId = activeTab.sessionId ?? activeTab.splitLayout?.splits[0];
      if (!sessionId) return;
      const session = useTerminalStore.getState().sessions.get(sessionId);
      if (session?.cwd) {
        explorer.setCurrentPath(session.cwd);
      }
    }

    // Restore expandedPaths for this tab
    const savedExpanded = explorer.tabExpanded[activeTab.id];
    if (savedExpanded) {
      explorer.setExpandedPaths(savedExpanded);
    }
  }, [activeTabId]);

  // Subscribe to session updates for async CWD changes (after PTY spawn)
  useEffect(() => {
    const unsub = useTerminalStore.subscribe((state) => {
      const explorer = useExplorerStore.getState();
      if (!explorer.shouldFollowTerminal()) return;
      const focusedId = state.focusedSessionId;
      if (!focusedId) return;
      const session = state.sessions.get(focusedId);
      if (!session?.cwd) return;

      explorer.setCurrentPath(session.cwd);
      // Also save for this session's tab
      const tabs = useTabStore.getState().tabs;
      const tab = tabs.find(
        (t) => t.sessionId === focusedId || t.splitLayout?.splits.includes(focusedId),
      );
      if (tab) {
        explorer.setTabPath(tab.id, session.cwd);
      }
    });
    return () => unsub();
  }, []);

  const commands = tabs.length > 0 ? getAllCommands() : [];

  function restoreFocus() {
    const focusedId = useTerminalStore.getState().focusedSessionId;
    if (focusedId) {
      document.dispatchEvent(
        new CustomEvent("focus-terminal", { detail: { sessionId: focusedId } }),
      );
    }
  }

  const renderPanel = () => {
    if (!activeTab) {
      return <WelcomeTab />;
    }

    switch (activeTab.type) {
      case "terminal":
      case "split":
        return (
          <TerminalTab
            tabId={activeTab.id}
            sessionId={activeTab.sessionId}
            splitLayout={activeTab.splitLayout}
          />
        );
      case "editor":
        return (
          <Suspense fallback={<div className="flex-1 panel-bg" />}>
            <CodeMirrorEditor
              editorId={activeTab.id}
              filePath={activeTab.filePath ?? ""}
            />
          </Suspense>
        );
      case "viewer":
        if (!activeTab.filePath) {
          return (
            <div className="flex-1 flex items-center justify-center panel-bg">
              <span className="text-fg-subtle">Viewer</span>
            </div>
          );
        }
        return isImageFile(activeTab.filePath) ? (
          <ImageViewer filePath={activeTab.filePath} />
        ) : (
          <RawViewer filePath={activeTab.filePath} />
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-bg overflow-hidden">
      <TitleBar />

      <div className="flex flex-col flex-1 min-h-0">
        <TabBar />

        <div className="flex flex-1 min-h-0">
          {explorerVisible && (
            <>
              <FileExplorer width={explorerWidth} />
              <PanelResizer direction="horizontal" onResize={handleExplorerResize} />
            </>
          )}

          <main className="flex-1 flex flex-col min-w-0">
            {renderPanel()}
          </main>
        </div>
      </div>

      {config.layout.showStatusBar && <StatusBar />}

      <CommandPalette
        isOpen={paletteOpen}
        onClose={() => {
          setPaletteOpen(false);
          restoreFocus();
        }}
        commands={commands}
      />

      <RenameDialog
        isOpen={renameTabId !== null}
        currentName={renameCurrentName}
        onConfirm={handleRenameConfirm}
        onCancel={() => {
          setRenameTabId(null);
          restoreFocus();
        }}
      />

      <PathPickerDialog
        isOpen={pathPicker !== null}
        title={pathPicker?.mode === "new-terminal" ? "New Terminal at..." : "Change Explorer Root"}
        confirmLabel={pathPicker?.mode === "new-terminal" ? "Open Here" : "Set Root"}
        initialPath={pathPicker?.initialPath ?? ""}
        onConfirm={(path) => {
          if (pathPicker?.mode === "new-terminal") {
            createTerminalAt(path);
          } else {
            useExplorerStore.getState().setCurrentPath(path);
            useExplorerStore.getState().setPinnedPath(path);
          }
          setPathPicker(null);
          restoreFocus();
        }}
        onCancel={() => {
          setPathPicker(null);
          restoreFocus();
        }}
      />
    </div>
  );
}
