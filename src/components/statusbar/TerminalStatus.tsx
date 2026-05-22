import { useTerminalStore } from "@/stores/terminalStore";
import { useTabStore } from "@/stores/tabStore";
import { Terminal } from "lucide-react";

export function TerminalStatus() {
  const { focusedSessionId, sessions } = useTerminalStore();
  const { activeTabId, tabs } = useTabStore();

  const activeSession = focusedSessionId
    ? sessions.get(focusedSessionId)
    : activeTabId
      ? (() => {
          const tab = tabs.find((t) => t.id === activeTabId);
          if (!tab) return null;
          const sid = tab.type === "split" ? tab.splitLayout?.splits[0] : tab.sessionId;
          return sid ? sessions.get(sid) : null;
        })()
      : null;

  if (!activeSession) {
    return (
      <div className="flex items-center gap-2 text-fg-subtle">
        <Terminal size={12} />
        <span>No terminal</span>
      </div>
    );
  }

  const shellName = activeSession.shell
    .replace(".exe", "")
    .replace("/usr/bin/", "")
    .replace("/bin/", "");

  return (
    <div className="flex items-center gap-2 text-fg">
      <Terminal size={12} className="text-green" />
      <span className="text-green">{shellName || "shell"}</span>
      <span className="text-fg-subtle">•</span>
      <span className="text-fg-subtle truncate max-w-[300px]">
        {activeSession.cwd || "~"}
      </span>
    </div>
  );
}
