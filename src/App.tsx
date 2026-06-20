import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useConfigStore } from "@/stores/configStore";
import { useTabStore } from "@/stores/tabStore";
import { useTerminalStore } from "@/stores/terminalStore";
import { loadFromStorage, saveToStorage } from "@/stores/tabStore";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Loader2, Terminal } from "lucide-react";
import { listen } from "@tauri-apps/api/event";
import { getProcessArgs } from "@/lib/ipc";
import { getSessions } from "@/lib/splitUtils";
import { TerminalDragOverlay } from "@/components/terminal/TerminalDragOverlay";

export default function App() {
  const { loadConfig, loaded, config } = useConfigStore();
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    if (!loaded) return;

    const doLoad = async () => {
      await new Promise((r) => setTimeout(r, 50));

      if (config.session.sessionRestore) {
        const saved = loadFromStorage();
        if (saved && saved.tabs.length > 0) {
          const { addTab, setActiveTab } = useTabStore.getState();
          const { addSession } = useTerminalStore.getState();
          for (const tab of saved.tabs) {
            addTab(tab);
          }
          for (const s of saved.sessions) {
            addSession({
              id: s.id,
              title: s.title || "Terminal",
              shell: s.shell || "",
              cwd: s.cwd || "",
              cols: s.cols || 80,
              rows: s.rows || 24,
              processId: null,
              createdAt: s.createdAt || Date.now(),
            });
          }
          if (saved.tabs.length > 0) {
            setActiveTab(saved.tabs[0].id);
            setTimeout(() => {
              document.dispatchEvent(new CustomEvent("focus-terminal"));
            }, 200);
          }
        }
      }

      // Check CLI args
      try {
        const args = await getProcessArgs();
        if (args && args.length > 1) {
          const pathArg = args.find((a: string) => !a.startsWith("-") && !a.endsWith("exe") && !a.endsWith("forge"));
          if (pathArg) {
            openSessionAt(pathArg);
          }
        }
      } catch (e) {
        // Failed to get process args
      }

      setShowLoader(false);
    };

    doLoad();
  }, [loaded, config.session.sessionRestore]);

  useEffect(() => {
    if (!loaded) return;

    if (!localStorage.getItem("forge-tutorial-shown")) {
      setTimeout(() => {
        document.dispatchEvent(new CustomEvent("show-tutorial"));
      }, 500);
    }

    const unsubTab = useTabStore.subscribe(() => saveToStorage());
    const unsubTerm = useTerminalStore.subscribe(() => saveToStorage());

    let saveTimer: ReturnType<typeof setTimeout>;
    const unsubConfig = useConfigStore.subscribe(() => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        useConfigStore.getState().saveConfig();
      }, 500);
    });

    window.addEventListener("beforeunload", saveToStorage);

    const handleRefocus = () => {
      const lastId = useTerminalStore.getState().lastFocusedSessionId;
      const tabState = useTabStore.getState();

      if (lastId) {
        const tabWithSession = tabState.tabs.find(
          (t) =>
            t.sessionId === lastId ||
            (t.splitNode && getSessions(t.splitNode).includes(lastId)),
        );
        if (tabWithSession && tabWithSession.id !== tabState.activeTabId) {
          tabState.setActiveTab(tabWithSession.id);
        }
        setTimeout(() => {
          document.dispatchEvent(
            new CustomEvent("focus-terminal", { detail: { sessionId: lastId } }),
          );
        }, 100);
      } else {
        const termTab = tabState.tabs.find((t) => t.type === "terminal" || t.type === "split");
        if (termTab) {
          tabState.setActiveTab(termTab.id);
          setTimeout(() => {
            document.dispatchEvent(new CustomEvent("focus-terminal"));
          }, 100);
        }
      }
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") handleRefocus();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", handleRefocus);

    return () => {
      unsubTab();
      unsubTerm();
      unsubConfig();
      clearTimeout(saveTimer);
      window.removeEventListener("beforeunload", saveToStorage);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", handleRefocus);
    };
  }, [loaded]);

  useEffect(() => {
    if (!loaded) return;

    const unlisten = listen("new-instance", (event) => {
      const payload = event.payload as any;
      if (payload && payload.args && payload.args.length > 1) {
        // Depending on how args are passed, path is usually the last or specific one
        // Let's assume the first non-flag argument after the executable
        const pathArg = payload.args.find((a: string) => !a.startsWith("-") && !a.endsWith("exe") && !a.endsWith("forge"));
        if (pathArg) {
          openSessionAt(pathArg);
        } else if (payload.cwd) {
          openSessionAt(payload.cwd);
        }
      } else if (payload && payload.cwd) {
        openSessionAt(payload.cwd);
      }
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [loaded]);

  const openSessionAt = (path: string, shellOverride?: string) => {
    const id = crypto.randomUUID();
    const shell = shellOverride || useConfigStore.getState().config.terminal.defaultShell || "powershell.exe";
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
      shell,
      cwd: path,
      cols: 80,
      rows: 24,
      processId: null,
      createdAt: Date.now(),
    });
    useConfigStore.getState().addPastPath(path);
    setTimeout(() => {
      document.dispatchEvent(new CustomEvent("focus-terminal"));
    }, 100);
  };

  if (showLoader) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-bg select-none">
        <Terminal size={40} className="text-accent mb-4" />
        <Loader2 size={24} className="text-accent animate-spin mb-3" />
        <p className="text-sm text-fg-subtle font-mono">Starting Forge...</p>
      </div>
    );
  }

  return (
    <>
      <MainLayout />
      <ConfirmDialog />
      <TerminalDragOverlay />
    </>
  );
}
