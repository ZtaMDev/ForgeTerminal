import { useRef, useEffect } from "react";
import { useConfirmStore } from "@/stores/confirmStore";

export function ConfirmDialog() {
  const { isOpen, message, close } = useConfirmStore();
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => confirmRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      close(true);
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      close(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close(false);
      }}
      onKeyDown={handleKeyDown}
    >
      <div className="bg-bg-surface border border-surface1 rounded-lg shadow-xl p-5 min-w-[320px]">
        <p className="text-sm text-fg mb-5 leading-relaxed">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            className="px-3 py-1.5 text-xs text-fg-subtle hover:text-fg rounded hover:bg-surface0 transition-colors"
            onClick={() => close(false)}
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            className="px-3 py-1.5 text-xs text-bg bg-accent rounded hover:opacity-90 transition-opacity"
            onClick={() => close(true)}
          >
            Close Tab
          </button>
        </div>
      </div>
    </div>
  );
}
