import { create } from "zustand";

export interface ExplorerNode {
  name: string;
  path: string;
  is_dir: boolean;
  size: number;
  modified_at: string;
  children?: ExplorerNode[];
  expanded: boolean;
  loading: boolean;
  depth: number;
}

interface ExplorerState {
  root: ExplorerNode | null;
  currentPath: string;
  pinnedPath: string | null;
  isPinned: boolean;
  selectedPath: string | null;
  expandedPaths: Set<string>;
  tabPaths: Record<string, string>;
  tabExpanded: Record<string, string[]>;
  setRoot: (root: ExplorerNode) => void;
  setCurrentPath: (path: string) => void;
  setTabPath: (tabId: string, path: string) => void;
  setTabExpanded: (tabId: string, paths: string[]) => void;
  setPinnedPath: (path: string | null) => void;
  togglePin: () => void;
  setSelectedPath: (path: string | null) => void;
  toggleExpanded: (path: string) => void;
  setExpandedPaths: (paths: string[]) => void;
  updateNode: (path: string, partial: Partial<ExplorerNode>) => void;
  setChildren: (path: string, children: ExplorerNode[]) => void;
  shouldFollowTerminal: () => boolean;
}

export const useExplorerStore = create<ExplorerState>((set, get) => ({
  root: null,
  currentPath: "",
  pinnedPath: null,
  isPinned: false,
  selectedPath: null,
  expandedPaths: new Set(),
  tabPaths: {},
  tabExpanded: {},

  setRoot: (root) =>
    set((state) => ({
      root,
      expandedPaths: new Set(state.expandedPaths).add(root.path),
    })),

  setCurrentPath: (path) => set({ currentPath: path }),

  setTabPath: (tabId, path) =>
    set((state) => ({ tabPaths: { ...state.tabPaths, [tabId]: path } })),

  setTabExpanded: (tabId, paths) =>
    set((state) => ({ tabExpanded: { ...state.tabExpanded, [tabId]: paths } })),

  setExpandedPaths: (paths) => set({ expandedPaths: new Set(paths) }),

  setPinnedPath: (path) =>
    set({ pinnedPath: path, isPinned: path !== null }),

  togglePin: () =>
    set((state) => {
      if (state.isPinned) {
        return { isPinned: false, pinnedPath: null };
      }
      return { isPinned: true, pinnedPath: state.currentPath };
    }),

  setSelectedPath: (path) => set({ selectedPath: path }),

  toggleExpanded: (path) =>
    set((state) => {
      const newExpanded = new Set(state.expandedPaths);
      if (newExpanded.has(path)) {
        newExpanded.delete(path);
      } else {
        newExpanded.add(path);
      }
      return { expandedPaths: newExpanded };
    }),

  updateNode: (path, partial) =>
    set((state) => {
      if (!state.root) return state;

      const updateInTree = (
        node: ExplorerNode,
      ): ExplorerNode => {
        if (node.path === path) {
          return { ...node, ...partial };
        }
        if (node.children) {
          return {
            ...node,
            children: node.children.map(updateInTree),
          };
        }
        return node;
      };

      return { root: updateInTree(state.root) };
    }),

  setChildren: (path, children) =>
    set((state) => {
      if (!state.root) return state;

      const updateChildren = (node: ExplorerNode): ExplorerNode => {
        if (node.path === path) {
          return { ...node, children, loading: false };
        }
        if (node.children) {
          return {
            ...node,
            children: node.children.map(updateChildren),
          };
        }
        return node;
      };

      return { root: updateChildren(state.root) };
    }),

  shouldFollowTerminal: () => {
    const state = get();
    return !state.isPinned;
  },
}));
