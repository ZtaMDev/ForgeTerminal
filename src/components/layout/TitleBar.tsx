import { useRef, useEffect } from "react";
import { Minus, Square, X } from "lucide-react";
import { ForgeLogo } from "@/components/common/ForgeLogo";

interface TitleBarProps {
  title?: string;
}

function minimize() {
  import("@/lib/ipc").then(({ windowMinimize }) => windowMinimize()).catch(() => {});
}

function maximize() {
  import("@/lib/ipc").then(({ windowToggleMaximize }) => windowToggleMaximize()).catch(() => {});
}

function closeWindow() {
  import("@/lib/ipc").then(({ windowClose }) => windowClose()).catch(() => {});
}

async function startDrag() {
  try {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    await getCurrentWindow().startDragging();
  } catch {
    try {
      const { windowStartDrag } = await import("@/lib/ipc");
      await windowStartDrag();
    } catch {}
  }
}

export function TitleBar({ title = "Forge" }: TitleBarProps) {
  const dragRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = dragRef.current;
    if (!el) return;

    const onMouseDown = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest("button")) return;
      e.preventDefault();
      startDrag();
    };

    el.addEventListener("mousedown", onMouseDown);
    return () => el.removeEventListener("mousedown", onMouseDown);
  }, []);

  return (
    <div
      ref={dragRef}
      className="h-9 bg-bg-alt flex items-center justify-between select-none border-b border-surface0 flex-shrink-0"
    >
      <div className="flex items-center gap-2 pl-3">
        <ForgeLogo size={18} />
        <span className="text-sm text-fg-subtle font-medium">{title}</span>
      </div>

      <div className="flex items-center flex-1">
        <span className="text-xs text-fg-subtle text-center flex-1 px-4 truncate">
          Forge Terminal
        </span>
      </div>

      <div className="flex items-stretch h-full">
        <button
          className="w-10 flex items-center justify-center hover-bg rounded-none text-fg-subtle hover:text-fg transition-colors"
          onClick={minimize}
          aria-label="Minimize"
        >
          <Minus size={14} />
        </button>
        <button
          className="w-10 flex items-center justify-center hover-bg rounded-none text-fg-subtle hover:text-fg transition-colors"
          onClick={maximize}
          aria-label="Maximize"
        >
          <Square size={12} />
        </button>
        <button
          className="w-12 flex items-center justify-center hover:bg-red/80 hover:text-white rounded-none text-fg-subtle transition-colors"
          onClick={closeWindow}
          aria-label="Close"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
