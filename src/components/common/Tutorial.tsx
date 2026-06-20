import { useState, useCallback, useEffect, useRef } from "react";
import {
  Zap,
  ArrowLeftRight,
  LayoutList,
  LayoutPanelTop,
  Columns,
  Settings,
} from "lucide-react";
import { useTabStore } from "@/stores/tabStore";
import { useTerminalStore } from "@/stores/terminalStore";
import { useConfigStore } from "@/stores/configStore";

import { formatShortcut } from "@/lib/shortcuts";

const getSteps = (commandKey: string) => [
  {
    icon: Zap,
    title: "Welcome to Forge",
    content: `Forge is a terminal emulator and multiplexer — run and manage multiple terminal sessions in one window.\n\nThis quick guide will walk you through the essentials.\n\n**Note**: The Command Key is currently set to '${commandKey}'. You can change this at any time in the Settings panel!`,
    target: null,
  },
  {
    icon: ArrowLeftRight,
    title: "Passthrough Mode",
    content:
      "Passthrough is ON by default — keyboard shortcuts are intercepted by Forge.\n\n" +
      `Press ${formatShortcut("Ctrl+<cmd>", commandKey)} to toggle OFF (THRU mode) so all keys go directly to the terminal.\n\n` +
      "The status bar shows CMD (passthrough ON) or THRU (passthrough OFF) on the left.",
    target: '[title="Toggle Passthrough"]',
  },
  {
    icon: LayoutList,
    title: "Status Bar",
    content:
      "The status bar at the bottom shows:\n\n" +
      "• CMD / THRU — current passthrough mode\n" +
      "• Ctrl+Shift+P — open command palette\n" +
      "• Ctrl+, — open settings\n" +
      "• ⚙ gear icon — open settings panel",
    target: ".h-6.bg-bg-alt",
  },
  {
    icon: LayoutPanelTop,
    title: "Tabs & Navigation",
    content:
      `• ${formatShortcut("Ctrl+Shift+<cmd>", commandKey)} — New terminal\n` +
      "• Ctrl+W — Close current tab/pane\n" +
      "• Ctrl+Shift+W — Close entire tab\n" +
      "• Ctrl+Tab / Ctrl+Shift+Tab — Next / previous tab\n" +
      "• Ctrl+1 through Ctrl+9 — Go to tab N\n" +
      "• Ctrl+Shift+D — Duplicate tab",
    target: null,
  },
  {
    icon: Columns,
    title: "Split Panes",
    content:
      "• Ctrl+\\ — Split horizontally\n" +
      "• Ctrl+Shift+\\ — Split vertically\n" +
      "• Ctrl+Shift+ArrowLeft/Right — Cycle through splits",
    target: ".xterm",
  },
  {
    icon: Settings,
    title: "Command Palette & Settings",
    content:
      "• Ctrl+Shift+P — Open command palette (search any action)\n" +
      "• Ctrl+, — Open settings panel\n\n" +
      "In both panels:\n" +
      "• ↑↓ — Navigate items\n" +
      "• Enter/Space — Activate\n" +
      "• ←→ — Adjust values\n" +
      "• Esc — Close\n\n" +
      "Settings changes update the terminal in real time.",
    target: '[title="Open Settings"]',
  },
];

const BORDER = "#45475a";

function arrowCSS(dir: "top" | "bottom" | "left" | "right"): React.CSSProperties {
  switch (dir) {
    case "top":
      return { top: -6, left: "50%", marginLeft: -6, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderBottom: `6px solid ${BORDER}` };
    case "bottom":
      return { bottom: -6, left: "50%", marginLeft: -6, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: `6px solid ${BORDER}` };
    case "left":
      return { left: -6, top: "50%", marginTop: -6, borderTop: "6px solid transparent", borderBottom: "6px solid transparent", borderRight: `6px solid ${BORDER}` };
    case "right":
      return { right: -6, top: "50%", marginTop: -6, borderTop: "6px solid transparent", borderBottom: "6px solid transparent", borderLeft: `6px solid ${BORDER}` };
  }
}

function AnimationPrefs() {
  const config = useConfigStore((s) => s.config);
  const setTheme = useConfigStore((s) => s.setTheme);
  const anim = config.theme.animations;
  return (
    <div className="mt-3 pt-3 border-t border-surface0">
      <p className="text-xs text-fg-subtle font-medium mb-2">Animation Preferences</p>
      <div className="flex items-center gap-3 mb-2">
        <span className="text-xs text-fg-alt w-20">Enabled</span>
        <div
          role="switch"
          tabIndex={0}
          aria-checked={anim.enabled}
          className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${anim.enabled ? "bg-accent" : "bg-surface1"}`}
          style={{ transitionDuration: "var(--anim-duration, 200ms)" }}
          onClick={() => setTheme({ animations: { ...anim, enabled: !anim.enabled } })}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setTheme({ animations: { ...anim, enabled: !anim.enabled } }); } }}
        >
          <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${anim.enabled ? "translate-x-4" : ""}`}
            style={{ transitionDuration: "var(--anim-duration, 200ms)" }} />
        </div>
      </div>
      {anim.enabled && (
        <div className="flex items-center gap-3">
          <span className="text-xs text-fg-alt w-20">Speed</span>
          <input
            type="range"
            min={50}
            max={600}
            step={50}
            value={anim.speed}
            onChange={(e) => setTheme({ animations: { ...anim, speed: Number(e.target.value) } })}
            className="flex-1 h-1 accent-accent cursor-pointer"
          />
          <span className="text-xs text-fg font-mono w-8 text-right">{anim.speed}ms</span>
        </div>
      )}
    </div>
  );
}

interface TutorialProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Tutorial({ isOpen, onClose }: TutorialProps) {
  const [step, setStep] = useState(0);
  const [arrowDir, setArrowDir] = useState<"top" | "bottom" | "left" | "right" | null>(null);
  const [offsets, setOffsets] = useState({ top: 0, left: 0 });
  const [spotRect, setSpotRect] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const tutorialTabIdsRef = useRef<string[]>([]);
  const configStore = useConfigStore();
  const commandKey = configStore.config.shortcuts.commandKey;
  const STEPS = getSteps(commandKey);
  const total = STEPS.length;
  const current = STEPS[step];
  const isLast = step === total - 1;
  const isStep5 = step === 4;
  const iconClass = "w-8 h-8 flex items-center justify-center rounded-lg bg-accent/10 text-accent";
  const animSpeed = useConfigStore((s) => s.config.theme.animations.enabled ? s.config.theme.animations.speed : 0);

  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setMounted(true);
      tutorialTabIdsRef.current = [];
      document.dispatchEvent(new CustomEvent("close-overlays"));
    } else if (mounted) {
      const t = setTimeout(() => setMounted(false), animSpeed);
      return () => clearTimeout(t);
    }
  }, [isOpen, animSpeed]);

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => cardRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [isOpen, step]);

  useEffect(() => {
    if (!isOpen) return;
    const blockKeys = (e: KeyboardEvent) => {
      if (["Escape", "Enter", " ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) return;
      e.preventDefault();
      e.stopPropagation();
    };
    document.addEventListener("keydown", blockKeys, { capture: true });
    return () => document.removeEventListener("keydown", blockKeys, { capture: true });
  }, [isOpen]);

  // Create split terminal for step 5 — always fresh tab
  useEffect(() => {
    if (!isOpen || !isStep5) return;

    const tabId = crypto.randomUUID();
    useTabStore.getState().addTab({
      id: tabId,
      type: "terminal",
      title: "Terminal",
      sessionId: tabId,
      pinned: false,
      createdAt: Date.now(),
    });
    useTerminalStore.getState().addSession({
      id: tabId,
      title: "Terminal",
      shell: "",
      cwd: "",
      cols: 80,
      rows: 24,
      processId: null,
      createdAt: Date.now(),
    });
    tutorialTabIdsRef.current.push(tabId);

    useTabStore.getState().setActiveTab(tabId);

    const splitId = useTabStore.getState().splitHorizontal(tabId);
    if (splitId) {
      useTerminalStore.getState().addSession({
        id: splitId,
        title: "Terminal",
        shell: "",
        cwd: "",
        cols: 80,
        rows: 24,
        processId: null,
        createdAt: Date.now(),
      });
      tutorialTabIdsRef.current.push(splitId);
    }

    const t1 = setTimeout(() => {
      cardRef.current?.focus();
    }, 200);
    return () => clearTimeout(t1);
  }, [isOpen, isStep5]);

  // Open command palette on last step — keep focus on tutorial card
  useEffect(() => {
    if (isOpen && isLast) {
      const t1 = setTimeout(() => {
        document.dispatchEvent(new CustomEvent("toggle-command-palette"));
      }, 100);
      const t2 = setTimeout(() => {
        cardRef.current?.focus();
      }, 200);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [isOpen, isLast]);

  const handleClose = useCallback(() => {
    document.dispatchEvent(new CustomEvent("close-overlays"));
    const ids = tutorialTabIdsRef.current;
    if (ids.length > 0) {
      const ts = useTabStore.getState();
      for (const id of ids) {
        ts.removeTab(id);
      }
    }
    onClose();
  }, [onClose]);

  // Positioning + target highlight (no dimming)
  useEffect(() => {
    if (!isOpen) {
      setArrowDir(null);
      setSpotRect(null);
      return;
    }

    let active = true;
    let retries = 0;
    const maxRetries = 20;

    const update = () => {
      if (!active) return;
      const card = cardRef.current;
      if (!card) return;

      if (!current.target) {
        setArrowDir(null);
        setSpotRect(null);
        return;
      }

      const target = document.querySelector(current.target) as HTMLElement | null;
      if (!target) {
        if (retries < maxRetries) {
          retries++;
          setTimeout(update, 100);
        } else {
          setArrowDir(null);
          setSpotRect(null);
        }
        return;
      }

      const tr = target.getBoundingClientRect();
      setSpotRect(tr);

      const cardW = card.offsetWidth || 380;
      const cardH = card.offsetHeight || 300;
      const gap = 12;
      const pad = 8;

      if (isStep5 && tr.left - cardW - gap > 0) {
        setArrowDir("right");
        setOffsets({
          top: Math.max(pad, Math.min(tr.top + tr.height / 2 - cardH / 2, window.innerHeight - cardH - pad)),
          left: tr.left - cardW - gap,
        });
        return;
      }

      if (tr.top - cardH - gap > 0) {
        setArrowDir("bottom");
        setOffsets({
          top: tr.top - cardH - gap,
          left: Math.max(pad, Math.min(tr.left + tr.width / 2 - cardW / 2, window.innerWidth - cardW - pad)),
        });
        return;
      }

      if (tr.bottom + cardH + gap < window.innerHeight) {
        setArrowDir("top");
        setOffsets({
          top: tr.bottom + gap,
          left: Math.max(pad, Math.min(tr.left + tr.width / 2 - cardW / 2, window.innerWidth - cardW - pad)),
        });
        return;
      }

      if (tr.right + cardW + gap < window.innerWidth) {
        setArrowDir("left");
        setOffsets({
          top: Math.max(pad, Math.min(tr.top + tr.height / 2 - cardH / 2, window.innerHeight - cardH - pad)),
          left: tr.right + gap,
        });
        return;
      }

      if (tr.left - cardW - gap > 0) {
        setArrowDir("right");
        setOffsets({
          top: Math.max(pad, Math.min(tr.top + tr.height / 2 - cardH / 2, window.innerHeight - cardH - pad)),
          left: tr.left - cardW - gap,
        });
        return;
      }

      setArrowDir(null);
      setSpotRect(null);
    };

    const t = setTimeout(update, 30);
    window.addEventListener("resize", update);
    return () => {
      active = false;
      clearTimeout(t);
      window.removeEventListener("resize", update);
    };
  }, [isOpen, step, current.target, isStep5]);

  const advance = useCallback(() => {
    if (step < total - 1) {
      setStep((s) => s + 1);
    } else {
      handleClose();
    }
  }, [step, total, handleClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        if (step < total - 1) setStep((s) => s + 1);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        if (step > 0) setStep((s) => s - 1);
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        advance();
      }
    },
    [step, total, handleClose, advance],
  );

  if (!mounted && !isOpen) return null;

  const hasTarget = current.target !== null;
  const Icon = current.icon;

  return (
    <>
      {/* Transparent full-screen blocker */}
      <div
        data-tutorial="true"
        className={`fixed inset-0 z-[90] ${isOpen ? "anim-fade" : "anim-overlay-out"}`}
        style={{ background: "transparent" }}
      />

      {/* Accent border around target */}
      {hasTarget && spotRect && (
        <div
          className={`fixed z-[91] border-2 border-accent rounded pointer-events-none ${isOpen ? "anim-fade" : "anim-overlay-out"}`}
          style={{
            top: spotRect.top - 2,
            left: spotRect.left - 2,
            width: spotRect.width + 4,
            height: spotRect.height + 4,
          }}
        />
      )}

      {/* Tutorial card */}
      <div
        ref={cardRef}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={`fixed z-[95] outline-none ${isOpen ? "anim-overlay" : "anim-overlay-out"}`}
        style={
          arrowDir === null
            ? { top: "50%", left: "50%", transform: "translate(-50%, -50%)" }
            : { top: offsets.top, left: offsets.left }
        }
      >
        <div
          className={`relative bg-bg-surface border border-surface1 rounded-lg shadow-2xl ${
            arrowDir === null ? "w-[480px]" : "w-[380px]"
          }`}
        >
          {arrowDir !== null && (
            <div
              className="absolute w-0 h-0"
              style={arrowCSS(arrowDir)}
            />
          )}

          <div className="px-5 pt-5 pb-1">
            <div className="flex items-center gap-2.5 mb-2">
              <div className={iconClass}>
                <Icon size={18} />
              </div>
              <h2 className="text-base font-bold text-fg">{current.title}</h2>
            </div>
            <div className="flex gap-1 mb-2">
              {Array.from({ length: total }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i === step ? "bg-accent" : "bg-surface1"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="px-5 py-2 max-h-[40vh] overflow-y-auto">
            {current.content.split("\n").map((line, i) => (
              <p key={i} className="text-sm text-fg-alt leading-relaxed mb-1">
                {line}
              </p>
            ))}
            {step === 0 && <AnimationPrefs />}
          </div>

          <div className="flex items-center justify-between px-5 py-3 border-t border-surface0">
            <div className="flex flex-col gap-0.5">
              <button
                className="text-xs text-fg-subtle hover:text-fg transition-colors cursor-pointer text-left"
                onClick={handleClose}
              >
                Hide tutorial
              </button>
              <span className="text-[11px] text-fg-subtle/50">
                ↑↓ navigate · ↵ continue · Esc close
              </span>
            </div>
            <div className="flex gap-2">
              {step > 0 && (
                <button
                  className="px-3 py-1.5 text-xs text-fg-subtle hover:text-fg rounded hover:bg-surface0 transition-colors cursor-pointer"
                  onClick={() => setStep((s) => s - 1)}
                >
                  ← Back
                </button>
              )}
              {isLast ? (
                <button
                  className="px-4 py-1.5 text-xs text-bg bg-accent rounded hover:opacity-90 transition-opacity font-medium cursor-pointer"
                  onClick={handleClose}
                >
                  Got it!
                </button>
              ) : (
                <button
                  className="px-4 py-1.5 text-xs text-bg bg-accent rounded hover:opacity-90 transition-opacity font-medium cursor-pointer"
                  onClick={() => setStep((s) => s + 1)}
                >
                  Next →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
