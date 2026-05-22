interface Window {
  __TAURI__?: {
    window?: {
      getCurrent: () => {
        minimize: () => Promise<void>;
        toggleMaximize: () => Promise<void>;
        maximize: () => Promise<void>;
        unmaximize: () => Promise<void>;
        close: () => Promise<void>;
        isMaximized: () => Promise<boolean>;
      };
    };
    core?: {
      invoke: (cmd: string, args?: Record<string, unknown>) => Promise<unknown>;
    };
  };
}
