import { useState, useEffect } from "react";
import { useTabStore } from "@/stores/tabStore";
import { useConfigStore } from "@/stores/configStore";
import { isPrefixActive } from "@/lib/prefixMode";
import { TerminalStatus } from "./TerminalStatus";
import { Image, FileType } from "lucide-react";
import { isImageFile } from "@/components/viewer/ImageViewer";

export function StatusBar() {
  const { activeView, activeTabId } = useTabStore();
  const config = useConfigStore((s) => s.config);
  const [prefixActive, setPrefixActive] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      setPrefixActive((e as CustomEvent).detail.active);
    };
    document.addEventListener("prefix-mode-changed", handler);
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
      {prefixActive ? (
        <span className="text-accent font-bold tracking-wide">
          CMD
        </span>
      ) : (
        <span className="text-surface2 font-bold tracking-wide text-[10px]">
          THRU
        </span>
      )}

      {activeView === "terminal" && <TerminalStatus />}
      {activeView === "viewer" && activeTabId && (() => {
        const tab = useTabStore.getState().tabs.find(t => t.id === activeTabId);
        if (!tab?.filePath) return null;
        const isImg = isImageFile(tab.filePath);
        return (
          <div className="flex items-center gap-2 text-fg flex-1 min-w-0">
            {isImg ? <Image size={12} className="text-peach" /> : <FileType size={12} className="text-peach" />}
            <span className="text-peach truncate">{tab.title}</span>
            <span className="text-fg-subtle">•</span>
            <span className="text-fg-subtle">{isImg ? "Image" : "Raw"}</span>
          </div>
        );
      })()}

      <div className="flex-1" />

      <div className="flex items-center gap-2 text-fg-subtle">
        <span className="hover:text-fg cursor-default" title="Toggle Passthrough">
          Ctrl+` {prefixActive ? "THRU" : "CMD"}
        </span>
        <span className="text-surface1">|</span>
        <span className="hover:text-fg cursor-default" title="Command Palette">
          Ctrl+Shift+P
        </span>
      </div>
    </div>
  );
}
