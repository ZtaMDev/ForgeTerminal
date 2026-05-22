import { create } from "zustand";

interface ConfirmStore {
  isOpen: boolean;
  message: string;
  resolve: ((value: boolean) => void) | null;
  open: (message: string) => Promise<boolean>;
  close: (result: boolean) => void;
}

export const useConfirmStore = create<ConfirmStore>((set, get) => ({
  isOpen: false,
  message: "",
  resolve: null,
  open: (message: string) => {
    return new Promise<boolean>((resolve) => {
      set({ isOpen: true, message, resolve });
    });
  },
  close: (result: boolean) => {
    const { resolve } = get();
    resolve?.(result);
    set({ isOpen: false, message: "", resolve: null });
  },
}));

/** Convenience helper to call from non-React code (e.g. keyboard handler) */
export function showConfirm(message: string): Promise<boolean> {
  return useConfirmStore.getState().open(message);
}
