import { useTabStore } from "@/stores/tabStore";
import { useTerminalStore } from "@/stores/terminalStore";
import { useConfigStore } from "@/stores/configStore";
import { ForgeLogo } from "@/components/common/ForgeLogo";

export function WelcomeTab() {
  const addTab = useTabStore((s) => s.addTab);
  const addSession = useTerminalStore((s) => s.addSession);

  const openTerminal = (path = "") => {
    const id = crypto.randomUUID();
    addTab({
      id,
      type: "terminal",
      title: "Terminal",
      sessionId: id,
      pinned: false,
      createdAt: Date.now(),
    });
    addSession({
      id,
      title: "Terminal",
      shell: "",
      cwd: path,
      cols: 80,
      rows: 24,
      processId: null,
      createdAt: Date.now(),
    });
    if (path) {
      useConfigStore.getState().addPastPath(path);
    }
    setTimeout(() => {
      document.dispatchEvent(new CustomEvent("focus-terminal"));
    }, 100);
  };

  return (
    <div className="flex-1 flex items-center justify-center panel-bg select-none">
      <div className="flex flex-col items-center gap-6 text-center px-8">
        <ForgeLogo size={128} bg={false} />
        <div>
          <h1 className="text-2xl font-bold text-fg mb-1">
            Welcome
          </h1>
          <p className="text-sm text-fg-subtle">
            Terminal Emulator &amp; Multiplexer
          </p>
        </div>

        <div className="text-xs text-fg-subtle space-y-1.5">
          <p><span className="text-accent font-mono">Ctrl+`</span> Passthrough Toggle</p>
          <p><span className="text-accent font-mono">Ctrl+Shift+`</span> New Terminal</p>
          <p><span className="text-accent font-mono">Ctrl+,</span> Settings</p>
          <p><span className="text-accent font-mono">Ctrl+Shift+P</span> Command Palette</p>
        </div>

        <button
          className="mt-2 px-5 py-2 bg-accent text-bg text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
          onClick={() => openTerminal()}
        >
          Open Terminal
        </button>
      </div>
    </div>
  );
}
