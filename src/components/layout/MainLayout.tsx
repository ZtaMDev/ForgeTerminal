import { useState, useCallback, useEffect, useRef } from "react";
import { TitleBar } from "./TitleBar";
import { TabBar } from "@/components/tabs/TabBar";
import { WelcomeTab } from "@/components/tabs/WelcomeTab";
import { StatusBar } from "@/components/statusbar/StatusBar";
import { TerminalTab } from "@/components/terminal/TerminalTab";
import { CommandPalette } from "@/components/common/CommandPalette";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { RenameDialog } from "@/components/common/RenameDialog";
import { PathInputDialog } from "@/components/common/PathInputDialog";
import { PastSessionsDialog } from "@/components/common/PastSessionsDialog";
import { Tutorial } from "@/components/common/Tutorial";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useTabStore } from "@/stores/tabStore";
import { useTerminalStore } from "@/stores/terminalStore";
import { useConfigStore } from "@/stores/configStore";
import { getAllCommands } from "@/lib/commands";
import { isImageFile } from "@/components/viewer/ImageViewer";
import { ImageViewer } from "@/components/viewer/ImageViewer";
import { RawViewer } from "@/components/viewer/RawViewer";
import { WebPreviewPanel } from "@/components/preview/WebPreviewPanel";

export function MainLayout() {
  useKeyboardShortcuts();

  const config = useConfigStore((s) => s.config);
  const { tabs, activeTabId } = useTabStore();

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [renameTabId, setRenameTabId] = useState<string | null>(null);
  const [renameCurrentName, setRenameCurrentName] = useState("");
  const [pathDialogOpen, setPathDialogOpen] = useState(false);
  const [pastSessionsOpen, setPastSessionsOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);

  // Inject animation duration CSS variable
  useEffect(() => {
    const speed = config.theme.animations.enabled ? config.theme.animations.speed : 0;
    document.documentElement.style.setProperty("--anim-duration", `${speed}ms`);
  }, [config.theme.animations.enabled, config.theme.animations.speed]);

  const handlePathConfirm = useCallback((path: string) => {
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
      cwd: path,
      cols: 80,
      rows: 24,
      processId: null,
      createdAt: Date.now(),
    });
    useConfigStore.getState().addPastPath(path);
    setPathDialogOpen(false);
    setTimeout(() => {
      document.dispatchEvent(new CustomEvent("focus-terminal"));
    }, 100);
  }, []);

  const handleRenameConfirm = useCallback((name: string) => {
    if (renameTabId) {
      useTabStore.getState().updateTab(renameTabId, { title: name });
    }
    setRenameTabId(null);
  }, [renameTabId]);

  const activeTab = tabs.find((t) => t.id === activeTabId);

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
    const toggleSettings = () => {
      setSettingsOpen((p) => !p);
    };
    const openPathInput = () => {
      setPathDialogOpen(true);
    };
    const openPastSessions = () => {
      setPastSessionsOpen(true);
    };
    const showTutorial = () => {
      setTutorialOpen(true);
    };
    document.addEventListener("toggle-command-palette", togglePalette);
    document.addEventListener("toggle-settings-panel", toggleSettings);
    document.addEventListener("open-path-input", openPathInput);
    document.addEventListener("open-past-sessions-dialog", openPastSessions);
    document.addEventListener("show-tutorial", showTutorial);

    const clearTutorial = () => {
      localStorage.removeItem("forge-tutorial-shown");
    };
    document.addEventListener("clear-tutorial", clearTutorial);

    const closeOverlays = () => {
      setPaletteOpen(false);
      setSettingsOpen(false);
    };
    document.addEventListener("close-overlays", closeOverlays);
    document.addEventListener("open-rename-dialog", openRename);
    document.addEventListener("contextmenu", blockContextMenu);
    return () => {
      document.removeEventListener("toggle-command-palette", togglePalette);
      document.removeEventListener("toggle-settings-panel", toggleSettings);
      document.removeEventListener("open-rename-dialog", openRename);
      document.removeEventListener("contextmenu", blockContextMenu);
      document.removeEventListener("open-path-input", openPathInput);
      document.removeEventListener("open-past-sessions-dialog", openPastSessions);
      document.removeEventListener("show-tutorial", showTutorial);
      document.removeEventListener("clear-tutorial", clearTutorial);
      document.removeEventListener("close-overlays", closeOverlays);
    };
  }, []);

  const commands = getAllCommands();

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
            splitNode={activeTab.splitNode}
          />
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
          <WebPreviewPanel />
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

      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => {
          setSettingsOpen(false);
          restoreFocus();
        }}
      />

      <Tutorial
        isOpen={tutorialOpen}
        onClose={() => {
          setTutorialOpen(false);
          localStorage.setItem("forge-tutorial-shown", "1");
        }}
      />

      <PathInputDialog
        isOpen={pathDialogOpen}
        onConfirm={handlePathConfirm}
        onCancel={() => {
          setPathDialogOpen(false);
          restoreFocus();
        }}
      />

      <PastSessionsDialog
        isOpen={pastSessionsOpen}
        onClose={() => {
          setPastSessionsOpen(false);
          restoreFocus();
        }}
        onSelect={handlePathConfirm}
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
    </div>
  );
}
