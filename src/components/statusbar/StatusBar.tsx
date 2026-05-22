import { useState, useEffect } from "react";
import { useTabStore } from "@/stores/tabStore";
import { useConfigStore } from "@/stores/configStore";
import { useEditorStore } from "@/stores/editorStore";
import { isPrefixActive } from "@/lib/prefixMode";
import { TerminalStatus } from "./TerminalStatus";
import { EditorStatus } from "./EditorStatus";

export function StatusBar() {
  const { activeView, activeTabId } = useTabStore();
  const config = useConfigStore((s) => s.config);
  const activeEditor = useEditorStore((s) =>
    s.activeEditorId ? s.editors.get(s.activeEditorId) : null,
  );
  const [prefixActive, setPrefixActive] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      setPrefixActive((e as CustomEvent).detail.active);
    };
    document.addEventListener("prefix-mode-changed", handler);
    // Poll in case of edge cases
    const interval = setInterval(() => {
      setPrefixActive(isPrefixActive());
    }, 500);
    return () => {
      document.removeEventListener("prefix-mode-changed", handler);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="h-6 bg-bg-alt border-t border-surface0 flex items-center px-3 gap-3 text-[11px] flex-shrink-0 select-none">
      {prefixActive && (
        <span className="text-accent font-bold tracking-wide">
          PASSTHROUGH
        </span>
      )}

      {activeView === "terminal" && <TerminalStatus />}
      {activeView === "editor" && activeEditor && (
        <EditorStatus editor={activeEditor} />
      )}

      <div className="flex-1" />

      <div className="flex items-center gap-2 text-fg-subtle">
        <span className="hover:text-fg cursor-default" title="Command Palette">
          F1 Help
        </span>
        <span className="text-surface1">|</span>
        <span className="hover:text-fg cursor-default" title="Toggle Terminal">
          Ctrl+`
        </span>
        <span className="text-surface1">|</span>
        <span className="hover:text-fg cursor-default" title="Command Palette">
          Ctrl+Shift+P
        </span>
      </div>
    </div>
  );
}
