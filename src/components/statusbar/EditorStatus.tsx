import type { EditorTabData } from "@/types/editor";
import { FileCode } from "lucide-react";

interface EditorStatusProps {
  editor: EditorTabData;
}

export function EditorStatus({ editor }: EditorStatusProps) {
  const fileSize =
    editor.fileSize > 1024
      ? `${(editor.fileSize / 1024).toFixed(1)} KB`
      : `${editor.fileSize} B`;

  return (
    <div className="flex items-center gap-2 text-fg flex-1 min-w-0">
      <FileCode size={12} className="text-blue" />
      <span className="text-blue truncate">{editor.fileName}</span>
      <span className="text-fg-subtle">•</span>
      <span className="text-fg-subtle">{editor.language}</span>
      <span className="text-fg-subtle">•</span>
      <span className="text-fg-subtle">
        Ln {editor.cursorPosition.line}, Col {editor.cursorPosition.col}
      </span>
      <span className="text-fg-subtle">•</span>
      <span className="text-fg-subtle">{fileSize}</span>
      {editor.isDirty && <span className="text-peach font-bold">●</span>}
    </div>
  );
}
