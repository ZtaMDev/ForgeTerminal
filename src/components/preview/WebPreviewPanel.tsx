import { useState, useEffect, useRef } from "react";
import { usePreviewStore } from "@/stores/previewStore";
import { Globe, ArrowLeft, ArrowRight, RefreshCw, X } from "lucide-react";

export function WebPreviewPanel() {
  const { isOpen, url, history, historyIndex, closePreview, goBack, goForward, setUrl } = usePreviewStore();
  const [inputUrl, setInputUrl] = useState("");
  const [width, setWidth] = useState(() => {
    const saved = localStorage.getItem("forge-preview-width");
    return saved ? parseInt(saved, 10) : 400;
  });
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    if (url) {
      setInputUrl(url);
    }
  }, [url]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      // We want to calculate the new width. Since the panel is on the left,
      // the width is essentially e.clientX (with constraints)
      const newWidth = Math.max(300, Math.min(e.clientX, window.innerWidth - 300));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        document.body.style.cursor = "default";
        // To prevent iframe capturing mouse events during drag, we could toggle pointer-events
        if (iframeRef.current) iframeRef.current.style.pointerEvents = "auto";
        localStorage.setItem("forge-preview-width", width.toString());
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [width]);

  if (!isOpen) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = "col-resize";
    if (iframeRef.current) iframeRef.current.style.pointerEvents = "none";
  };

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    let finalUrl = inputUrl.trim();
    if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
      finalUrl = `https://${finalUrl}`;
    }
    setUrl(finalUrl);
  };

  const handleReload = () => {
    if (iframeRef.current) {
      // Best effort reload for iframe
      const currentSrc = iframeRef.current.src;
      iframeRef.current.src = "about:blank";
      setTimeout(() => {
        if (iframeRef.current) iframeRef.current.src = currentSrc;
      }, 50);
    }
  };

  const handleIframeLoad = () => {
    try {
      const iframeUrl = iframeRef.current?.contentWindow?.location.href;
      if (iframeUrl && iframeUrl !== "about:blank") {
        setInputUrl(iframeUrl);
        if (iframeUrl !== url) {
          setUrl(iframeUrl);
        }
      }
    } catch {
      // Ignore cross-origin security errors
    }
  };

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < history.length - 1;

  return (
    <div 
      className="flex flex-col border-r border-surface0 bg-bg shadow-xl z-20 transition-[width] duration-0 relative"
      style={{ width: `${width}px` }}
    >
      {/* Resizer Handle */}
      <div
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-accent/50 z-30"
        onMouseDown={handleMouseDown}
      />

      {/* Header / Toolbar */}
      <div className="h-10 border-b border-surface0 flex items-center px-2 gap-1 bg-surface0/50">
        <button
          onClick={goBack}
          disabled={!canGoBack}
          className="p-1.5 rounded hover:bg-surface1 text-fg-subtle hover:text-fg disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          title="Go Back"
        >
          <ArrowLeft size={14} />
        </button>
        <button
          onClick={goForward}
          disabled={!canGoForward}
          className="p-1.5 rounded hover:bg-surface1 text-fg-subtle hover:text-fg disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          title="Go Forward"
        >
          <ArrowRight size={14} />
        </button>
        <button
          onClick={handleReload}
          className="p-1.5 rounded hover:bg-surface1 text-fg-subtle hover:text-fg transition-colors"
          title="Reload"
        >
          <RefreshCw size={14} />
        </button>
        
        <form onSubmit={handleNavigate} className="flex-1 mx-1">
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            className="w-full h-6 px-2 text-xs bg-bg border border-surface1 rounded outline-none focus:border-accent text-fg transition-colors"
            placeholder="Enter URL..."
          />
        </form>

        <button
          onClick={closePreview}
          className="p-1.5 rounded hover:bg-red-500/20 text-fg-subtle hover:text-red-400 transition-colors"
          title="Close Preview"
        >
          <X size={14} />
        </button>
      </div>

      {/* WebView (iframe) */}
      <div className="flex-1 bg-white relative">
        {url ? (
          <iframe
            ref={iframeRef}
            src={url}
            title="Web Preview"
            className="w-full h-full border-none"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            onLoad={handleIframeLoad}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-surface1 select-none">
            <Globe size={64} className="mb-4 opacity-50" />
            <span className="text-fg-subtle text-sm">No Preview Open</span>
            <span className="text-[10px] text-surface1 mt-2">Ctrl+Click a link in the terminal to preview</span>
          </div>
        )}
      </div>
    </div>
  );
}
