export type TerminalShell = "powershell" | "pwsh" | "cmd" | "bash" | "zsh" | "fish";

export interface TerminalSession {
  id: string;
  title: string;
  shell: string;
  cwd: string;
  cols: number;
  rows: number;
  processId: number | null;
  createdAt: number;
}

export interface SplitLayout {
  direction: "horizontal" | "vertical";
  splits: string[];
}

export type TabType = "terminal" | "editor" | "viewer" | "split";

export interface Tab {
  id: string;
  type: TabType;
  title: string;
  sessionId?: string;
  filePath?: string;
  splitLayout?: SplitLayout;
  pinned: boolean;
  createdAt: number;
}

export interface PTYData {
  id: string;
  data: string;
}

export interface PTYExit {
  id: string;
  code: number;
}

export interface PTYError {
  id: string;
  message: string;
}
