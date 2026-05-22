import { create } from "zustand";
import type { EditorTabData } from "@/types/editor";

interface EditorState {
  editors: Map<string, EditorTabData>;
  activeEditorId: string | null;
  openEditor: (data: EditorTabData) => void;
  closeEditor: (id: string) => void;
  setActiveEditor: (id: string | null) => void;
  updateEditor: (id: string, partial: Partial<EditorTabData>) => void;
  setContent: (id: string, content: string) => void;
  setCursorPosition: (id: string, line: number, col: number) => void;
  setDirty: (id: string, dirty: boolean) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  editors: new Map(),
  activeEditorId: null,

  openEditor: (data) =>
    set((state) => {
      const newEditors = new Map(state.editors);
      newEditors.set(data.id, data);
      return { editors: newEditors, activeEditorId: data.id };
    }),

  closeEditor: (id) =>
    set((state) => {
      const newEditors = new Map(state.editors);
      newEditors.delete(id);
      const activeId =
        state.activeEditorId === id ? null : state.activeEditorId;
      return { editors: newEditors, activeEditorId: activeId };
    }),

  setActiveEditor: (id) => set({ activeEditorId: id }),

  updateEditor: (id, partial) =>
    set((state) => {
      const newEditors = new Map(state.editors);
      const existing = newEditors.get(id);
      if (existing) {
        newEditors.set(id, { ...existing, ...partial });
      }
      return { editors: newEditors };
    }),

  setContent: (id, content) =>
    set((state) => {
      const newEditors = new Map(state.editors);
      const existing = newEditors.get(id);
      if (existing) {
        newEditors.set(id, { ...existing, content, isDirty: true });
      }
      return { editors: newEditors };
    }),

  setCursorPosition: (id, line, col) =>
    set((state) => {
      const newEditors = new Map(state.editors);
      const existing = newEditors.get(id);
      if (existing) {
        newEditors.set(id, {
          ...existing,
          cursorPosition: { line, col },
        });
      }
      return { editors: newEditors };
    }),

  setDirty: (id, dirty) =>
    set((state) => {
      const newEditors = new Map(state.editors);
      const existing = newEditors.get(id);
      if (existing) {
        newEditors.set(id, { ...existing, isDirty: dirty });
      }
      return { editors: newEditors };
    }),
}));
