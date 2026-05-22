import { create } from "zustand";
import type { TerminalSession } from "@/types/terminal";

interface TerminalState {
  sessions: Map<string, TerminalSession>;
  activeSessionId: string | null;
  focusedSessionId: string | null;
  addSession: (session: TerminalSession) => void;
  removeSession: (id: string) => void;
  setActiveSession: (id: string | null) => void;
  setFocusedSession: (id: string | null) => void;
  updateSession: (id: string, partial: Partial<TerminalSession>) => void;
  clearSessions: () => void;
}

export const useTerminalStore = create<TerminalState>((set) => ({
  sessions: new Map(),
  activeSessionId: null,
  focusedSessionId: null,

  addSession: (session) =>
    set((state) => {
      const newSessions = new Map(state.sessions);
      newSessions.set(session.id, session);
      return { sessions: newSessions };
    }),

  removeSession: (id) =>
    set((state) => {
      const newSessions = new Map(state.sessions);
      newSessions.delete(id);
      const activeId =
        state.activeSessionId === id ? null : state.activeSessionId;
      const focusedId =
        state.focusedSessionId === id ? null : state.focusedSessionId;
      return { sessions: newSessions, activeSessionId: activeId, focusedSessionId: focusedId };
    }),

  setActiveSession: (id) =>
    set({ activeSessionId: id }),

  setFocusedSession: (id) =>
    set({ focusedSessionId: id }),

  updateSession: (id, partial) =>
    set((state) => {
      const newSessions = new Map(state.sessions);
      const existing = newSessions.get(id);
      if (existing) {
        newSessions.set(id, { ...existing, ...partial });
      }
      return { sessions: newSessions };
    }),

  clearSessions: () =>
    set({ sessions: new Map(), activeSessionId: null, focusedSessionId: null }),
}));
