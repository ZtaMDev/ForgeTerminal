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
      setTimeout(() => {
        inputRef.current?.select();
        inputRef.current?.focus();
      }, 0);
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
        handleConfirm();
      } else if (e.key === "Escape") {
        onCancel();
      }
    },
    [handleConfirm, onCancel],
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="bg-bg-surface border border-surface1 rounded-lg shadow-xl p-4 min-w-[280px]">
        <label className="block text-xs text-fg-subtle mb-2">Rename tab</label>
        <input
          ref={inputRef}
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
            className="px-3 py-1.5 text-xs text-bg bg-accent rounded hover:opacity-90 transition-opacity"
            onClick={handleConfirm}
          >
            Rename
          </button>
        </div>
      </div>
    </div>
  );
}
