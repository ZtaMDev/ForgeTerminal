import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { fsReadFileBinary } from "@/lib/ipc";
import { FileCode, FileText, Terminal, Loader2 } from "lucide-react";

const MAX_HEX_SIZE = 50 * 1024 * 1024; // 50MB limit for hex view
const CHUNK_SIZE = 1024 * 1024; // 1MB chunks for conversion

interface RawViewerProps {
  filePath: string;
}

type ViewMode = "hex" | "text" | "preview";

export function isBinaryFile(path: string): boolean {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  const binaryExts = new Set([
    "exe", "dll", "so", "dylib", "bin", "dat", "obj", "lib",
    "pyc", "class",
  ]);
  return binaryExts.has(ext);
}

function base64ToBytes(base64: string): Uint8Array {
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes;
}

function formatHexDump(data: Uint8Array): string {
  const lines: string[] = [];
  const charsPerLine = 16;
  const len = Math.min(data.length, MAX_HEX_SIZE);
  for (let offset = 0; offset < len; offset += charsPerLine) {
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
  if (data.length > MAX_HEX_SIZE) {
    lines.push(`\n... file truncated (showing first ${(MAX_HEX_SIZE / 1024 / 1024).toFixed(0)}MB)`);
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
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSize] = useState(11);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setRawData(null);

    const load = async () => {
      try {
        // Use setTimeout(0) to yield to React's render cycle before heavy work
        await new Promise((r) => setTimeout(r, 0));
        if (cancelled) return;

        const base64 = await fsReadFileBinary(filePath);
        if (cancelled) return;

        // Convert in chunks to avoid blocking the UI
        const totalLen = (base64.length * 3) / 4;
        if (totalLen > MAX_HEX_SIZE) {
          setLoadedSize(totalLen);
          // For huge files, only load the first MAX_HEX_SIZE bytes
          const truncated = base64.slice(0, Math.ceil((MAX_HEX_SIZE * 4) / 3));
          const bytes = base64ToBytes(truncated);
          if (cancelled) return;
          setRawData(bytes);
        } else {
          const bytes = base64ToBytes(base64);
          if (cancelled) return;
          setRawData(bytes);
          setLoadedSize(bytes.length);
        }

        setLoading(false);
      } catch (e) {
        if (!cancelled) {
          setError(`Failed to load file: ${e}`);
          setLoading(false);
        }
      }
    };
    load();
    return () => { cancelled = true; };
  }, [filePath]);

  // Auto-detect view mode when data loads
  useEffect(() => {
    if (!rawData) return;
    const text = tryDecodeAsUTF8(rawData);
    setViewMode(text !== null ? (text.length > 100 * 1024 ? "preview" : "text") : "hex");
  }, [rawData]);

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
    const maxPreview = 100 * 1024;
    if (text.length <= maxPreview) return text;
    return text.slice(0, maxPreview) + "\n\n... (file truncated)";
  }, [rawData]);

  const displayContent = useMemo(() => {
    if (viewMode === "hex") return hexDump;
    if (viewMode === "text") return textContent;
    return previewText;
  }, [viewMode, hexDump, textContent, previewText]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.ctrlKey && (e.key === "=" || e.key === "+")) {
      e.preventDefault();
      setFontSize((s) => Math.min(s + 2, 24));
    } else if (e.ctrlKey && e.key === "-") {
      e.preventDefault();
      setFontSize((s) => Math.max(s - 2, 8));
    } else if (e.ctrlKey && e.key === "0") {
      e.preventDefault();
      setFontSize(11);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const fileSizeStr =
    loadedSize > 1024 * 1024
      ? `${(loadedSize / (1024 * 1024)).toFixed(1)} MB`
      : loadedSize > 1024
        ? `${(loadedSize / 1024).toFixed(1)} KB`
        : `${loadedSize} B`;

  const isLargeFile = loadedSize > MAX_HEX_SIZE;

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center panel-bg">
        <p className="text-red text-sm">{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center panel-bg gap-3">
        <Loader2 size={20} className="text-accent animate-spin" />
        <span className="text-sm text-fg-subtle">Loading file...</span>
        {loadedSize > 0 && (
          <span className="text-xs text-fg-subtle/60">
            {fileSizeStr}
          </span>
        )}
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
        {isLargeFile && (
          <span className="text-[10px] text-yellow/80 ml-1">
            (large file — showing first 50MB)
          </span>
        )}
        <span className="ml-auto flex items-center gap-2 text-xs text-fg-subtle tabular-nums">
          <span className="text-fg-subtle/60">Ctrl+±</span>
          {fileSizeStr}
        </span>
      </div>

      <div className="flex-1 overflow-auto" tabIndex={0} data-viewer="true">
        <pre
          className="leading-relaxed p-4 font-mono text-fg select-text whitespace-pre"
          style={{ fontSize: `${fontSize}px` }}
        >
          {displayContent}
        </pre>
      </div>
    </div>
  );
}
