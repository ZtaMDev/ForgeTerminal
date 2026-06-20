import { useState, useCallback } from "react";
import { TerminalInstance } from "./TerminalInstance";
import { SplitTerminal } from "./SplitTerminal";
import { TerminalContextMenu } from "./TerminalContextMenu";
import { useTabStore } from "@/stores/tabStore";
import { useTerminalStore } from "@/stores/terminalStore";
import type { SplitNode } from "@/types/terminal";

interface TerminalTabProps {
  tabId: string;
  sessionId?: string;
  splitNode?: SplitNode;
}

export function TerminalTab({ tabId, sessionId, splitNode }: TerminalTabProps) {
  const [ctx, setCtx] = useState<{ x: number; y: number } | null>(null);
  const tab = useTabStore((s) => s.tabs.find((t) => t.id === tabId));
  const session = useTerminalStore((s) =>
    sessionId ? s.sessions.get(sessionId) : null,
  );

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (e.ctrlKey && e.altKey) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    setCtx({ x: e.clientX, y: e.clientY });
  }, []);

  if (!tab) return null;

  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0" onContextMenu={handleContextMenu}>
      {splitNode ? (
        <SplitTerminal node={splitNode} tabId={tabId} />
      ) : (
        <TerminalInstance sessionId={sessionId ?? tabId} tabId={tabId} cwd={session?.cwd} />
      )}

      <TerminalContextMenu
        isOpen={ctx !== null}
        x={ctx?.x ?? 0}
        y={ctx?.y ?? 0}
        tab={tab}
        onClose={() => setCtx(null)}
      />
    </div>
  );
}
