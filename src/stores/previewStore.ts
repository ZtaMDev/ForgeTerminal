import { create } from "zustand";

interface PreviewState {
  isOpen: boolean;
  url: string | null;
  history: string[];
  historyIndex: number;
  openPreview: (url?: string) => void;
  closePreview: () => void;
  togglePreview: () => void;
  goBack: () => void;
  goForward: () => void;
  setUrl: (url: string) => void;
}

export const usePreviewStore = create<PreviewState>((set) => ({
  isOpen: false,
  url: null,
  history: [],
  historyIndex: -1,

  openPreview: (url) =>
    set((state) => {
      if (!url) return { isOpen: true };
      
      // If the URL is the same as the current, just open the panel
      if (state.url === url) {
        return { isOpen: true };
      }
      
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(url);
      return {
        isOpen: true,
        url,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }),

  closePreview: () => set({ isOpen: false }),
  togglePreview: () => set((state) => ({ isOpen: !state.isOpen })),

  goBack: () =>
    set((state) => {
      if (state.historyIndex > 0) {
        const newIndex = state.historyIndex - 1;
        return {
          historyIndex: newIndex,
          url: state.history[newIndex],
        };
      }
      return state;
    }),

  goForward: () =>
    set((state) => {
      if (state.historyIndex < state.history.length - 1) {
        const newIndex = state.historyIndex + 1;
        return {
          historyIndex: newIndex,
          url: state.history[newIndex],
        };
      }
      return state;
    }),

  setUrl: (url) =>
    set((state) => {
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(url);
      return {
        url,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }),
}));
