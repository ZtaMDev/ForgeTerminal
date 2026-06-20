import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  showConfigEditor: boolean;
  rawConfig: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    showConfigEditor: false,
    rawConfig: "",
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.state.showConfigEditor) {
        return (
          <div style={{ padding: "40px", color: "#cdd6f4", backgroundColor: "#11111b", height: "100vh", fontFamily: "monospace", display: "flex", flexDirection: "column", gap: "20px" }}>
            <h2 style={{ color: "#f38ba8", margin: 0 }}>Rescue Configuration</h2>
            <p style={{ margin: 0 }}>Edit your raw JSON configuration below. Be careful to maintain valid JSON syntax.</p>
            <textarea
              style={{ flex: 1, backgroundColor: "#181825", color: "#cdd6f4", padding: "20px", borderRadius: "8px", border: "1px solid #313244", fontFamily: "monospace", outline: "none", resize: "none" }}
              value={this.state.rawConfig}
              onChange={(e) => this.setState({ rawConfig: e.target.value })}
              spellCheck={false}
            />
            <div style={{ display: "flex", gap: "10px" }}>
              <button 
                style={{ padding: "10px 20px", backgroundColor: "#a6e3a1", color: "#11111b", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
                onClick={async () => {
                  try {
                    // Try to parse first to ensure valid JSON
                    JSON.parse(this.state.rawConfig);
                    localStorage.setItem("forge-config", this.state.rawConfig);
                    try {
                      const { configSave } = await import("@/lib/ipc");
                      await configSave(this.state.rawConfig);
                    } catch { /* ignore */ }
                    window.location.reload();
                  } catch (e) {
                    alert("Invalid JSON: " + (e as Error).message);
                  }
                }}
              >
                Save & Reload
              </button>
              <button 
                style={{ padding: "10px 20px", backgroundColor: "#45475a", color: "#cdd6f4", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
                onClick={() => this.setState({ showConfigEditor: false })}
              >
                Cancel
              </button>
            </div>
          </div>
        );
      }

      return (
        <div style={{ padding: "40px", color: "#f87171", backgroundColor: "#11111b", height: "100vh", fontFamily: "monospace", display: "flex", flexDirection: "column", gap: "20px" }}>
          <h2 style={{ color: "#f38ba8", margin: 0 }}>Terminal Emulator Crash / Configuration Error</h2>
          <p style={{ color: "#cdd6f4", margin: 0 }}>
            The application encountered a critical rendering error. This is often caused by corrupted configuration or session data in local storage.
          </p>
          <div style={{ backgroundColor: "#181825", padding: "20px", borderRadius: "8px", overflow: "auto", flex: 1, maxHeight: "300px" }}>
            <pre style={{ margin: 0 }}>{this.state.error?.toString()}</pre>
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button 
              style={{ padding: "10px 20px", backgroundColor: "#89b4fa", color: "#11111b", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Dismiss & Retry
            </button>
            <button 
              style={{ padding: "10px 20px", backgroundColor: "#f9e2af", color: "#11111b", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
              onClick={() => {
                const conf = localStorage.getItem("forge-config") || "{}";
                this.setState({ showConfigEditor: true, rawConfig: conf });
              }}
            >
              Edit Raw Config
            </button>
            <button 
              style={{ padding: "10px 20px", backgroundColor: "#f38ba8", color: "#11111b", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
              onClick={async () => {
                localStorage.clear();
                sessionStorage.clear();
                try {
                  const { configSave } = await import("@/lib/ipc");
                  await configSave("{}"); // Clear IPC config if it exists
                } catch {
                  // IPC not available, ignore
                }
                window.location.reload();
              }}
            >
              Reset All Settings & Clear Storage
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
