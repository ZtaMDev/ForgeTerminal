import { useState, useRef, useEffect, useCallback } from "react";

interface RenameDialogProps {
  isOpen: boolean;
  currentName: string;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

export function RenameDialog({ isOpen, currentName, onConfirm, onCancel }: RenameDialogProps) {
  const [value, setValue] = useState(currentName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setValue(currentName);
      const focusInput = () => {
        if (inputRef.current) {
          inputRef.current.select();
          inputRef.current.focus();
        }
      };
      requestAnimationFrame(focusInput);
      const timer1 = setTimeout(focusInput, 50);
      const timer2 = setTimeout(focusInput, 120);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [isOpen, currentName]);

  const handleConfirm = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed) {
      onConfirm(trimmed);
    } else {
      onCancel();
    }
  }, [value, onConfirm, onCancel]);

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
      tabIndex={-1}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm outline-none select-none"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
      onKeyDown={handleKeyDown}
    >
      <div
        className="bg-bg-surface border border-surface1 rounded-lg shadow-xl p-4 min-w-[320px]"
        onClick={(e) => e.stopPropagation()}
      >
        <label className="block text-xs text-fg-subtle mb-2 font-medium">
          Rename tab to:
        </label>
        <input
          ref={inputRef}
          autoFocus
          className="w-full text-sm bg-surface0 text-fg px-3 py-2 rounded outline-none border border-surface1 focus:border-accent transition-colors"
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
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
