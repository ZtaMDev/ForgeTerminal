import { useState, useCallback, useEffect, useRef } from "react";
import { TitleBar } from "./TitleBar";
import { TabBar } from "@/components/tabs/TabBar";
import { WelcomeTab } from "@/components/tabs/WelcomeTab";
import { StatusBar } from "@/components/statusbar/StatusBar";
import { TerminalTab } from "@/components/terminal/TerminalTab";
import { CommandPalette } from "@/components/common/CommandPalette";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { RenameDialog } from "@/components/common/RenameDialog";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useTabStore } from "@/stores/tabStore";
import { useTerminalStore } from "@/stores/terminalStore";
import { useConfigStore } from "@/stores/configStore";
import { getAllCommands } from "@/lib/commands";
import { isImageFile } from "@/components/viewer/ImageViewer";
import { ImageViewer } from "@/components/viewer/ImageViewer";
import { RawViewer } from "@/components/viewer/RawViewer";

export function MainLayout() {
  useKeyboardShortcuts();

  const config = useConfigStore((s) => s.config);
  const { tabs, activeTabId } = useTabStore();

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [renameTabId, setRenameTabId] = useState<string | null>(null);
  const [renameCurrentName, setRenameCurrentName] = useState("");

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
    document.addEventListener("toggle-command-palette", togglePalette);
    document.addEventListener("toggle-settings-panel", toggleSettings);
    document.addEventListener("open-rename-dialog", openRename);
    document.addEventListener("contextmenu", blockContextMenu);
    return () => {
      document.removeEventListener("toggle-command-palette", togglePalette);
      document.removeEventListener("toggle-settings-panel", toggleSettings);
      document.removeEventListener("open-rename-dialog", openRename);
      document.removeEventListener("contextmenu", blockContextMenu);
    };
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
