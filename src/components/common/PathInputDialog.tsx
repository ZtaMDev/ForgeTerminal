import { useState, useRef, useEffect, useCallback } from "react";

interface PathInputDialogProps {
  isOpen: boolean;
  onConfirm: (path: string) => void;
  onCancel: () => void;
}

export function PathInputDialog({ isOpen, onConfirm, onCancel }: PathInputDialogProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setValue("");
      const focusInput = () => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      };
      // Immediate and deferred focus attempts to guarantee focus after preceding modal/palette closes
      requestAnimationFrame(focusInput);
      const timer1 = setTimeout(focusInput, 50);
      const timer2 = setTimeout(focusInput, 120);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [isOpen]);

  const handleConfirm = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed) {
      onConfirm(trimmed);
    }
  }, [value, onConfirm]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        handleConfirm();
      } else if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onCancel();
      }
    },
    [handleConfirm, onCancel],
  );

  if (!isOpen) return null;

  return (
    <div
      data-overlay="true"
      data-path-dialog="true"
      tabIndex={-1}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm outline-none select-none"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
      onKeyDown={handleKeyDown}
    >
      <div
        className="bg-bg-surface border border-surface1 rounded-lg shadow-xl p-4 min-w-[340px]"
        onClick={(e) => e.stopPropagation()}
      >
        <label className="block text-xs text-fg-subtle mb-2 font-medium">
          Enter path to open terminal at:
        </label>
        <input
          ref={inputRef}
          autoFocus
          className="w-full text-sm bg-surface0 text-fg px-3 py-2 rounded outline-none border border-surface1 focus:border-accent transition-colors"
          placeholder="C:\path\to\directory or /home/user/path"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="flex justify-end gap-2 mt-3">
          <button
            className="px-3 py-1.5 text-xs text-fg-subtle hover:text-fg rounded hover:bg-surface0 transition-colors"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="px-3 py-1.5 text-xs text-bg bg-accent rounded hover:opacity-90 transition-opacity font-medium"
            onClick={handleConfirm}
          >
            Open
          </button>
        </div>
      </div>
    </div>
  );
}
