import type { Tab } from "./terminal";

export interface WorkspaceTabData {
  id: string;
  type: "terminal" | "editor" | "viewer" | "split";
  title: string;
  cwd?: string;
  shell?: string;
  filePath?: string;
  cursorPosition?: { line: number; col: number };
  scrollPosition?: number;
  direction?: "horizontal" | "vertical";
  splits?: WorkspaceTabData[];
  active?: boolean;
}

export interface WorkspaceLayout {
  explorer: {
    visible: boolean;
    width: number;
    position: "left" | "right";
    pinnedPath: string | null;
  };
  activeTabId: string | null;
  activeView: "terminal" | "editor" | "viewer";
}

export interface WorkspaceState {
  version: number;
  tabs: WorkspaceTabData[];
  layout: WorkspaceLayout;
  lastOpened: string;
}
