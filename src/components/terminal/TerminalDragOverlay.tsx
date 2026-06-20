import { useEffect, useState } from "react";
import { useTabStore } from "@/stores/tabStore";
import { useTerminalStore } from "@/stores/terminalStore";
import { getSessions, findNode } from "@/lib/splitUtils";

interface DragState {
  draggingId: string;
  targetId: string | null;
  zone: "center" | "top" | "bottom" | "left" | "right" | null;
  x: number;
  y: number;
}

export function TerminalDragOverlay() {
  const [drag, setDrag] = useState<DragState | null>(null);

  useEffect(() => {
    const startDrag = (e: Event) => {
      const customEvent = e as CustomEvent<{ sessionId: string }>;
      setDrag({
        draggingId: customEvent.detail.sessionId,
        targetId: null,
        zone: null,
        x: -1,
        y: -1,
      });
      document.body.style.cursor = "grabbing";
    };

    document.addEventListener("terminal-drag-start", startDrag);
    return () => document.removeEventListener("terminal-drag-start", startDrag);
  }, []);

  useEffect(() => {
    if (!drag) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Find what element is under the cursor
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const termContainer = el?.closest("[data-terminal-id]") as HTMLElement;
      
      let targetId = null;
      let zone: DragState["zone"] = null;

      if (termContainer) {
        targetId = termContainer.dataset.terminalId || null;
        if (targetId) {
          const rect = termContainer.getBoundingClientRect();
          const relX = e.clientX - rect.left;
          const relY = e.clientY - rect.top;
          const w = rect.width;
          const h = rect.height;

          // Define zones: edge 20% for split, center 60% for swap
          if (relY < h * 0.2) zone = "top";
          else if (relY > h * 0.8) zone = "bottom";
          else if (relX < w * 0.2) zone = "left";
          else if (relX > w * 0.8) zone = "right";
          else zone = "center";
        }
      }

      setDrag((prev) => prev ? { ...prev, targetId, zone, x: e.clientX, y: e.clientY } : null);
    };

    const commitDrag = () => {
      setDrag((currentDrag) => {
        if (currentDrag?.targetId && currentDrag.draggingId !== currentDrag.targetId) {
          const { activeTabId, tabs, swapSessions, updateTab } = useTabStore.getState();
          const tab = tabs.find(t => t.id === activeTabId);
          if (tab && tab.splitNode) {
            if (currentDrag.zone === "center") {
              swapSessions(tab.id, currentDrag.draggingId, currentDrag.targetId);
              setTimeout(() => {
                document.dispatchEvent(new CustomEvent("focus-terminal", { detail: { sessionId: currentDrag.draggingId } }));
              }, 50);
            } else if (currentDrag.zone) {
               // Complex restructuring: remove draggingId, then split targetId
               import("@/lib/splitUtils").then(({ removeNode, splitNodeAt }) => {
                 let root = removeNode(tab.splitNode!, currentDrag.draggingId);
                 if (!root) return; // Should not happen if there are at least 2 terminals
                 if (root.type === "terminal") root = { ...root }; // deep copy if needed
                 
                 const direction = (currentDrag.zone === "left" || currentDrag.zone === "right") ? "horizontal" : "vertical";
                 
                 // If the target node was the one we removed, abort (handled by draggingId !== targetId above)
                 const newRoot = splitNodeAt(root, currentDrag.targetId!, currentDrag.draggingId, direction);
                 
                 // If inserting left/top, we need to swap the newly created children since splitNodeAt puts target first
                 if (currentDrag.zone === "left" || currentDrag.zone === "top") {
                   const newlySplit = findNode(newRoot, currentDrag.targetId!); // This will be the terminal node inside the new split
                   // To swap properly, we need to swap within the newly created split node.
                   // A simpler approach is to call swapSessions right after.
                 }
                 
                 updateTab(tab.id, { splitNode: newRoot, type: "split" });

                 // Fix left/top order
                 if (currentDrag.zone === "left" || currentDrag.zone === "top") {
                   setTimeout(() => {
                     useTabStore.getState().swapSessions(tab.id, currentDrag.draggingId, currentDrag.targetId!);
                     document.dispatchEvent(new CustomEvent("focus-terminal", { detail: { sessionId: currentDrag.draggingId } }));
                   }, 10);
                 } else {
                   setTimeout(() => {
                     document.dispatchEvent(new CustomEvent("focus-terminal", { detail: { sessionId: currentDrag.draggingId } }));
                   }, 10);
                 }
               });
            }
          }
        }
        document.body.style.cursor = "";
        return null;
      });
    };

    const handleMouseUp = (e: MouseEvent) => {
      // If it's a left click (button 0) or right click release (button 2)
      commitDrag();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        commitDrag();
      } else if (e.code === "Escape") {
        setDrag(null);
        document.body.style.cursor = "";
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("contextmenu", (e) => e.preventDefault(), { capture: true }); // prevent context menu while dragging

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("contextmenu", (e) => e.preventDefault(), { capture: true });
    };
  }, [drag !== null]);

  if (!drag) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Visual representation of the dragging item (optional) */}
      <div 
        className="absolute bg-accent/20 border border-accent rounded-md pointer-events-none shadow-lg backdrop-blur-sm flex items-center justify-center text-accent font-bold"
        style={{
          left: drag.x + 15,
          top: drag.y + 15,
          width: 150,
          height: 100,
        }}
      >
        Moving Terminal
      </div>

      {/* Target drop zone indicator */}
      {drag.targetId && drag.draggingId !== drag.targetId && drag.zone && (
        <DropZoneOverlay targetId={drag.targetId} zone={drag.zone} />
      )}
    </div>
  );
}

function DropZoneOverlay({ targetId, zone }: { targetId: string; zone: "center" | "top" | "bottom" | "left" | "right" }) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const el = document.querySelector(`[data-terminal-id="${targetId}"]`);
    if (el) setRect(el.getBoundingClientRect());
  }, [targetId]);

  if (!rect) return null;

  let left = rect.left;
  let top = rect.top;
  let width = rect.width;
  let height = rect.height;

  if (zone === "left") {
    width = rect.width / 2;
  } else if (zone === "right") {
    left = rect.left + rect.width / 2;
    width = rect.width / 2;
  } else if (zone === "top") {
    height = rect.height / 2;
  } else if (zone === "bottom") {
    top = rect.top + rect.height / 2;
    height = rect.height / 2;
  }

  const isSwap = zone === "center";

  return (
    <div
      className={`absolute transition-all duration-150 rounded-md border-2 ${isSwap ? "bg-peach/30 border-peach" : "bg-blue/30 border-blue"}`}
      style={{
        left,
        top,
        width,
        height,
        boxShadow: "0 0 15px rgba(0,0,0,0.5) inset"
      }}
    >
      <div className="w-full h-full flex items-center justify-center text-white/50 font-bold tracking-widest uppercase">
        {isSwap ? "SWAP" : "SPLIT"}
      </div>
    </div>
  );
}
