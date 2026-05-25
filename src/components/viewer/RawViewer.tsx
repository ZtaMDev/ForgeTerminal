import { useEffect, useState, useMemo, useCallback } from "react";
import { fsReadFileBinary } from "@/lib/ipc";
import { FileCode, FileText, Terminal } from "lucide-react";

interface RawViewerProps {
  filePath: string;
}

type ViewMode = "hex" | "text" | "preview";

export function isBinaryFile(path: string): boolean {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  const binaryExts = new Set([
    "exe", "dll", "so", "dylib", "bin", "dat", "obj", "lib",
    "zip", "tar", "gz", "bz2", "7z", "rar", "xz", "zst",
    "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
    "ttf", "otf", "woff", "woff2", "eot",
    "mp3", "mp4", "avi", "mov", "mkv", "wav", "flac", "ogg",
    "iso", "img", "dmg", "pyc", "class",
  ]);
  return binaryExts.has(ext);
}

function formatHexDump(data: Uint8Array): string {
  const lines: string[] = [];
  const charsPerLine = 16;
  for (let offset = 0; offset < data.length; offset += charsPerLine) {
    const slice = data.slice(offset, offset + charsPerLine);
    const hex = Array.from(slice)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(" ");
    const ascii = Array.from(slice)
      .map((b) => (b >= 0x20 && b <= 0x7e ? String.fromCharCode(b) : "."))
      .join("");
    lines.push(
      `${offset.toString(16).padStart(8, "0")}  ${hex.padEnd(47)}  |${ascii}|`,
    );
  }
  return lines.join("\n");
}

function tryDecodeAsUTF8(data: Uint8Array): string | null {
  try {
    const decoder = new TextDecoder("utf-8", { fatal: true });
    return decoder.decode(data);
  } catch {
    return null;
  }
}

export function RawViewer({ filePath }: RawViewerProps) {
  const [rawData, setRawData] = useState<Uint8Array | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const [loadedSize, setLoadedSize] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const base64 = await fsReadFileBinary(filePath);
        if (cancelled) return;

        const binaryStr = atob(base64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        setRawData(bytes);
        setLoadedSize(bytes.length);

        const text = tryDecodeAsUTF8(bytes);
        setViewMode(text !== null ? "text" : "hex");
        setError(null);
      } catch (e) {
        if (!cancelled) setError(`Failed to load file: ${e}`);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [filePath]);

  const hexDump = useMemo(
    () => (rawData ? formatHexDump(rawData) : ""),
    [rawData],
  );

  const textContent = useMemo(
    () => (rawData ? tryDecodeAsUTF8(rawData) ?? "" : ""),
    [rawData],
  );

  const previewText = useMemo(() => {
    if (!rawData) return "";
    const text = tryDecodeAsUTF8(rawData);
    if (!text) return "";
    // Show first 100KB for preview, or full if we have a smaller file
    const maxPreview = 100 * 1024;
    if (text.length <= maxPreview) return text;
    return text.slice(0, maxPreview) + "\n\n... (file truncated)";
  }, [rawData]);

  const displayContent = useMemo(() => {
    if (viewMode === "hex") return hexDump;
    if (viewMode === "text") return textContent;
    return previewText;
  }, [viewMode, hexDump, textContent, previewText]);

  const fileName = filePath.split("\\").pop() ?? "";

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center panel-bg">
        <p className="text-red text-sm">{error}</p>
      </div>
    );
  }

  if (!rawData) {
    return (
      <div className="flex-1 flex items-center justify-center panel-bg">
        <span className="text-fg-subtle text-sm">Loading file...</span>
      </div>
    );
  }

  const fileSizeStr =
    loadedSize > 1024 * 1024
      ? `${(loadedSize / (1024 * 1024)).toFixed(1)} MB`
      : loadedSize > 1024
        ? `${(loadedSize / 1024).toFixed(1)} KB`
        : `${loadedSize} B`;

  return (
    <div className="flex-1 flex flex-col panel-bg overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-bg-alt border-b border-surface0 flex-shrink-0">
        <button
          className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-colors ${
            viewMode === "preview"
              ? "bg-surface0 text-fg"
              : "text-fg-subtle hover:text-fg hover:bg-surface0"
          }`}
          onClick={() => setViewMode("preview")}
        >
          <FileText size={12} />
          Preview
        </button>
        <button
          className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-colors ${
            viewMode === "hex"
              ? "bg-surface0 text-fg"
              : "text-fg-subtle hover:text-fg hover:bg-surface0"
          }`}
          onClick={() => setViewMode("hex")}
        >
          <Terminal size={12} />
          Hex
        </button>
        <button
          className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-colors ${
            viewMode === "text"
              ? "bg-surface0 text-fg"
              : "text-fg-subtle hover:text-fg hover:bg-surface0"
          }`}
          onClick={() => setViewMode("text")}
        >
          <FileCode size={12} />
          Text
        </button>
        <span className="ml-auto text-xs text-fg-subtle tabular-nums">
          {fileSizeStr}
        </span>
      </div>

      <div className="flex-1 overflow-auto">
        <pre className="text-xs leading-relaxed p-4 font-mono text-fg select-text whitespace-pre">
          {displayContent}
        </pre>
      </div>
    </div>
  );
}
