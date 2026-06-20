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
          let sid = tab.sessionId;
          if (tab.type === "split" && tab.splitNode) {
            import("@/lib/splitUtils").then(({ getSessions }) => {
               // We can't use async here cleanly without state, so let's write a simple inline tree traverse
            });
            const getFirstSession = (node: import("@/types/terminal").SplitNode): string | undefined => {
              if (node.type === "terminal") return node.sessionId;
              return node.children[0] ? getFirstSession(node.children[0]) : undefined;
            };
            sid = getFirstSession(tab.splitNode);
          }
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

  const shellPath = activeSession.shell;
  const shellName = shellPath
    .split(/[/\\]/)
    .pop()!
    .replace(".exe", "")
    .replace(".EXE", "");

  return (
    <div className="flex items-center gap-2 text-fg">
      <Terminal size={12} className="text-green" />
      <span className="text-green truncate max-w-[120px]" title={shellPath}>
        {shellName || "shell"}
      </span>
      <span className="text-fg-subtle">•</span>
      <span className="text-fg-subtle truncate max-w-[300px]">
        {activeSession.cwd || "~"}
      </span>
    </div>
  );
}
