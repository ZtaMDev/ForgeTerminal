import { useEffect, useState, useCallback } from "react";
import { fsReadFileBinary } from "@/lib/ipc";
import { ZoomIn, ZoomOut, RotateCw, Loader2 } from "lucide-react";

interface ImageViewerProps {
  filePath: string;
}

const IMAGE_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico",
  ".bmp", ".webp", ".avif", ".tiff", ".tif",
]);

export function isImageFile(path: string): boolean {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return IMAGE_EXTENSIONS.has(`.${ext}`);
}

function getMimeType(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  const mimeMap: Record<string, string> = {
    png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
    gif: "image/gif", svg: "image/svg+xml", ico: "image/x-icon",
    bmp: "image/bmp", webp: "image/webp", avif: "image/avif",
    tiff: "image/tiff", tif: "image/tiff",
  };
  return mimeMap[ext] ?? "image/png";
}

export function ImageViewer({ filePath }: ImageViewerProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const load = async () => {
      try {
        const base64 = await fsReadFileBinary(filePath);
        if (cancelled) return;
        const mime = getMimeType(filePath);
        setSrc(`data:${mime};base64,${base64}`);
        setError(null);
        setLoading(false);
      } catch (e) {
        if (!cancelled) {
          setError(`Failed to load image: ${e}`);
          setLoading(false);
        }
      }
    };
    load();
    return () => { cancelled = true; };
  }, [filePath]);

  const handleZoomIn = useCallback(() => setZoom((z) => Math.min(z + 0.25, 5)), []);
  const handleZoomOut = useCallback(() => setZoom((z) => Math.max(z - 0.25, 0.1)), []);
  const handleRotate = useCallback(() => setRotation((r) => (r + 90) % 360), []);
  const handleReset = useCallback(() => { setZoom(1); setRotation(0); }, []);

  // Keyboard shortcuts for zoom/rotation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        handleZoomIn();
      } else if (e.ctrlKey && e.key === "-") {
        e.preventDefault();
        handleZoomOut();
      } else if (e.ctrlKey && e.key === "0") {
        e.preventDefault();
        handleReset();
      } else if (e.key === "r" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        handleRotate();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleZoomIn, handleZoomOut, handleRotate, handleReset]);

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center panel-bg">
        <div className="text-center">
          <p className="text-red text-sm mb-2">{error}</p>
        </div>
      </div>
    );
  }

  if (loading || !src) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center panel-bg gap-3">
        <Loader2 size={20} className="text-accent animate-spin" />
        <span className="text-sm text-fg-subtle">Loading image...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col panel-bg overflow-hidden">
      <div className="flex items-center gap-1 px-3 py-1.5 bg-bg-alt border-b border-surface0 flex-shrink-0">
        <button
          className="p-1 rounded hover:bg-surface0 text-fg-subtle hover:text-fg transition-colors"
          onClick={handleZoomOut}
          title="Zoom Out (Ctrl+-)"
        >
          <ZoomOut size={14} />
        </button>
        <span className="text-xs text-fg-subtle w-12 text-center tabular-nums">
          {Math.round(zoom * 100)}%
        </span>
        <button
          className="p-1 rounded hover:bg-surface0 text-fg-subtle hover:text-fg transition-colors"
          onClick={handleZoomIn}
          title="Zoom In (Ctrl+=)"
        >
          <ZoomIn size={14} />
        </button>
        <span className="w-px h-4 bg-surface0 mx-1" />
        <button
          className="p-1 rounded hover:bg-surface0 text-fg-subtle hover:text-fg transition-colors"
          onClick={handleRotate}
          title="Rotate (R)"
        >
          <RotateCw size={14} />
        </button>
        <button
          className="p-1 rounded hover:bg-surface0 text-fg-subtle hover:text-fg transition-colors ml-auto"
          onClick={handleReset}
          title="Reset Zoom (Ctrl+0)"
        >
          <span className="text-xs">Reset</span>
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center overflow-auto" tabIndex={0} data-viewer="true">
        <img
          src={src}
          alt={filePath.split("\\").pop() ?? ""}
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
            maxWidth: "none",
            maxHeight: "none",
          }}
          className="select-none"
          draggable={false}
        />
      </div>
    </div>
  );
}
