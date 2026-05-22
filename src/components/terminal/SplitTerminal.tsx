import { useRef, useCallback, useEffect, useState } from "react";
import { TerminalInstance } from "./TerminalInstance";
import type { SplitLayout } from "@/types/terminal";

interface SplitTerminalProps {
  layout: SplitLayout;
  tabId: string;
}

export function SplitTerminal({ layout, tabId }: SplitTerminalProps) {
  const n = layout.splits.length;
  const [sizes, setSizes] = useState<number[]>(() => Array(n).fill(100 / n));
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSizes(Array(layout.splits.length).fill(100 / layout.splits.length));
  }, [layout.splits.length]);

  const isHorizontal = layout.direction === "horizontal";

  const handleResize = useCallback(
    (index: number, delta: number) => {
      setSizes((prev) => {
        const next = [...prev];
        const containerSize = containerRef.current
          ? (isHorizontal ? containerRef.current.offsetWidth : containerRef.current.offsetHeight) - (n - 1) * 4
          : 1;
        const deltaPct = (delta / containerSize) * 100;

        const leftIdx = index;
        const rightIdx = index + 1;
        if (rightIdx >= next.length) return prev;

        const newLeft = next[leftIdx] + deltaPct;
        const newRight = next[rightIdx] - deltaPct;

        if (newLeft < 8 || newRight < 8) return prev;

        next[leftIdx] = newLeft;
        next[rightIdx] = newRight;
        return next;
      });
    },
    [isHorizontal, n],
  );

  if (layout.splits.length === 0) {
    return <TerminalInstance sessionId={tabId} />;
  }

  const items: React.ReactNode[] = [];
  for (let i = 0; i < layout.splits.length; i++) {
    items.push(
      <div
        key={layout.splits[i]}
        className="flex flex-col min-h-0 min-w-0"
        style={{ flexBasis: `${sizes[i]}%`, flexGrow: 0, flexShrink: 0, overflow: "hidden" }}
      >
        <div className="flex-1 min-h-0 min-w-0">
          <TerminalInstance sessionId={layout.splits[i]} />
        </div>
      </div>,
    );
    if (i < layout.splits.length - 1) {
      items.push(
        <SplitResizer key={`r-${i}`} isHorizontal={isHorizontal} onResize={(d) => handleResize(i, d)} />,
      );
    }
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 flex min-h-0 min-w-0 bg-bg"
      style={{ flexDirection: isHorizontal ? "row" : "column" }}
    >
      {items}
    </div>
  );
}

interface SplitResizerProps {
  isHorizontal: boolean;
  onResize: (delta: number) => void;
}

function SplitResizer({ isHorizontal, onResize }: SplitResizerProps) {
  const isDragging = useRef(false);
  const startPos = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;
      startPos.current = isHorizontal ? e.clientX : e.clientY;
      document.body.style.cursor = isHorizontal ? "col-resize" : "row-resize";
      document.body.style.userSelect = "none";
    },
    [isHorizontal],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging.current) return;
      const current = isHorizontal ? e.clientX : e.clientY;
      const delta = current - startPos.current;
      startPos.current = current;
      onResize(delta);
    },
    [onResize, isHorizontal],
  );

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div
      className="flex-shrink-0 bg-surface0 transition-colors duration-100 hover:bg-accent/50 z-10"
      style={
        isHorizontal
          ? { width: 4, height: "100%", cursor: "col-resize" }
          : { height: 4, width: "100%", cursor: "row-resize" }
      }
      onMouseDown={handleMouseDown}
    />
  );
}
