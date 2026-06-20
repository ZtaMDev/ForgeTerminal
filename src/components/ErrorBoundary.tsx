import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "40px", color: "#f87171", backgroundColor: "#11111b", height: "100vh", fontFamily: "monospace", display: "flex", flexDirection: "column", gap: "20px" }}>
          <h2 style={{ color: "#f38ba8", margin: 0 }}>Terminal Emulator Crash / Configuration Error</h2>
          <p style={{ color: "#cdd6f4", margin: 0 }}>
            The application encountered a critical rendering error. This is often caused by corrupted configuration or session data in local storage.
          </p>
          <div style={{ backgroundColor: "#181825", padding: "20px", borderRadius: "8px", overflow: "auto" }}>
            <pre style={{ margin: 0 }}>{this.state.error?.toString()}</pre>
          </div>
          <div>
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
