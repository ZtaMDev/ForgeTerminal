import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Terminal } from "@xterm/xterm";
import { useConfigStore } from "@/stores/configStore";

interface GhostTextOverlayProps {
  xterm: Terminal | null;
  suggestion: string;
  inputPrefix: string;
}

export function GhostTextOverlay({ xterm, suggestion, inputPrefix }: GhostTextOverlayProps) {
  const config = useConfigStore((s) => s.config);
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [cellDim, setCellDim] = useState({ width: 0, height: 0 });
  const [exactDim, setExactDim] = useState({ width: 0, height: 0 });
  const [offset, setOffset] = useState({ left: 0, top: 0 });

  useEffect(() => {
    if (!measureRef.current) return;
    const rect = measureRef.current.getBoundingClientRect();
    setCellDim({ width: rect.width, height: rect.height });
  }, [config.terminal.fontSize, config.terminal.fontFamily, config.terminal.lineHeight]);

  useEffect(() => {
    if (!xterm) return;

    const updatePosition = () => {
      const buffer = xterm.buffer.active;
      
      // Try to get pixel-perfect dimensions from xterm internals safely
      let exactWidth, exactHeight;
      try {
        const core = (xterm as any)._core;
        exactWidth = core._renderService.dimensions.css.cell.width;
        exactHeight = core._renderService.dimensions.css.cell.height;
      } catch (err) {
        // Fallback gracefully if internal API changes or is unavailable during early render
      }
      
      if (exactWidth && exactHeight) {
        setExactDim({ width: exactWidth, height: exactHeight });
      }

      // Calculate the exact offset of the xterm canvas relative to our wrapper container
      const screen = xterm?.element?.querySelector('.xterm-screen');
      const terminalDiv = xterm?.element?.parentElement;
      if (screen && terminalDiv) {
        const screenRect = screen.getBoundingClientRect();
        const termRect = terminalDiv.getBoundingClientRect();
        setOffset({ 
          left: Math.max(0, screenRect.left - termRect.left), 
          top: Math.max(0, screenRect.top - termRect.top) 
        });
      }
      
      setCoords({ x: buffer.cursorX, y: buffer.cursorY });
    };

    updatePosition();
    const cursorListener = xterm.onCursorMove(updatePosition);
    const scrollListener = xterm.onScroll(updatePosition);
    const renderListener = xterm.onRender(updatePosition);

    return () => {
      cursorListener.dispose();
      scrollListener.dispose();
      renderListener.dispose();
    };
  }, [xterm, suggestion]);

  const userFont = config.terminal.fontFamily?.replace(/['"]/g, '').split(',')[0].trim() || 'JetBrains Mono';
  const computedFontFamily = `"${userFont}", "Consolas", "Courier New", monospace`;

  const finalWidth = exactDim.width || cellDim.width;
  const finalHeight = exactDim.height || cellDim.height;

  // Calculate the starting X position of the current word so the div doesn't move as you type
  const startX = coords ? coords.x - inputPrefix.length : 0;
  
  const hiddenPart = suggestion && inputPrefix ? suggestion.slice(0, inputPrefix.length) : "";
  const visiblePart = suggestion && inputPrefix ? suggestion.slice(inputPrefix.length) : "";

  const overlayDiv = (
    <div
      className="pointer-events-none absolute whitespace-pre"
      style={{
        zIndex: 50, // above cursor canvas
        left: startX * finalWidth + offset.left,
        top: (coords ? coords.y * finalHeight : 0) + offset.top,
        height: `${finalHeight}px`,
        fontFamily: computedFontFamily,
        fontSize: `${config.terminal.fontSize}px`,
        lineHeight: `${finalHeight}px`,
        color: "#6c7086", // Catppuccin surface2
        opacity: 0.8,
        // If the cursor is a block, we can ensure text draws cleanly over it
        mixBlendMode: "normal"
      }}
    >
      <span style={{ color: "transparent" }}>{hiddenPart}</span>
      <span>{visiblePart}</span>
    </div>
  );

  return (
    <>
      {/* Invisible element to measure exact character dimensions */}
      <span
        ref={measureRef}
        style={{
          position: "absolute",
          visibility: "hidden",
          fontFamily: computedFontFamily,
          fontSize: `${config.terminal.fontSize}px`,
          lineHeight: config.terminal.lineHeight,
        }}
      >
        M
      </span>
      {visiblePart && xterm && coords && finalWidth > 0 && overlayDiv}
    </>
  );
}
