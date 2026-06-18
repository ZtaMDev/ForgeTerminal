export interface WorkspaceTabData {
  id: string;
  type: "terminal" | "viewer" | "split";
  title: string;
  cwd?: string;
  shell?: string;
  filePath?: string;
  direction?: "horizontal" | "vertical";
  splits?: WorkspaceTabData[];
  active?: boolean;
}

export interface WorkspaceLayout {
  activeTabId: string | null;
  activeView: "terminal" | "viewer";
}

export interface WorkspaceState {
  version: number;
  tabs: WorkspaceTabData[];
  layout: WorkspaceLayout;
  lastOpened: string;
}
