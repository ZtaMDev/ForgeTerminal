import type { ShortcutsConfig } from "@/types/config";

export const defaultShortcuts: ShortcutsConfig = {
  global: {
    "toggle-passthrough": ["Ctrl+`"],
    "command-palette": ["Ctrl+Shift+P"],
    "new-terminal": ["Ctrl+Shift+`"],
    "close-tab": ["Ctrl+W"],
    "close-entire-tab": ["Ctrl+Shift+W"],
    "next-tab": ["Ctrl+Tab"],
    "prev-tab": ["Ctrl+Shift+Tab"],
    "tab-1": ["Ctrl+1"],
    "tab-2": ["Ctrl+2"],
    "tab-3": ["Ctrl+3"],
    "tab-4": ["Ctrl+4"],
    "tab-5": ["Ctrl+5"],
    "tab-6": ["Ctrl+6"],
    "tab-7": ["Ctrl+7"],
    "tab-8": ["Ctrl+8"],
    "tab-9": ["Ctrl+9"],
    "duplicate-tab": ["Ctrl+Shift+D"],
    "rename-tab": ["Ctrl+Shift+R"],
    "past-sessions": ["Ctrl+Shift+O"],
    "split-horizontal": ["Ctrl+\\"],
    "split-vertical": ["Ctrl+Shift+\\"],
    "next-split": ["Ctrl+Shift+ArrowRight"],
    "prev-split": ["Ctrl+Shift+ArrowLeft"],
    "focus-terminal": ["Ctrl+Shift+T"],
    "focus-viewer": ["Ctrl+Shift+U"],
    "move-tab-up": ["Alt+ArrowUp"],
    "move-tab-down": ["Alt+ArrowDown"],
    "release-focus": ["Ctrl+Shift+Space"],
    "new-terminal-at": ["Ctrl+Alt+`"],
    "open-settings": ["Ctrl+,"],
    "toggle-preview": ["Ctrl+Shift+Y"],
    "font-increase": ["Ctrl+="],
    "font-decrease": ["Ctrl+-"],
    "fullscreen": ["F11"],
  },
  terminal: {
    copy: ["Ctrl+Shift+C"],
    paste: ["Ctrl+Shift+V"],
    "search-terminal": ["Ctrl+Shift+F"],
  },
};

export type ShortcutContext = "global" | "terminal";

export interface ParsedShortcut {
  key: string;
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
}

export function parseShortcut(shortcut: string): ParsedShortcut {
  const parts = shortcut.split("+");
  return {
    ctrl: parts.includes("Ctrl"),
    shift: parts.includes("Shift"),
    alt: parts.includes("Alt"),
    meta: parts.includes("Meta") || parts.includes("Cmd"),
    key: parts[parts.length - 1],
  };
}

// Map physical key (event.code) to the key string used in shortcuts
const keyToCode: Record<string, string[]> = {
  "`": ["Backquote", "IntlBackslash"],
  "~": ["Backquote", "IntlBackslash"],
  "-": ["Minus"],
  "_": ["Minus"],
  "=": ["Equal"],
  "+": ["Equal"],
  "[": ["BracketLeft"],
  "{": ["BracketLeft"],
  "]": ["BracketRight"],
  "}": ["BracketRight"],
  "\\": ["Backslash", "IntlBackslash", "IntlYen"],
  "|": ["Backslash", "IntlYen"],
  ";": ["Semicolon"],
  ":": ["Semicolon"],
  "'": ["Quote"],
  "\"": ["Quote"],
  ",": ["Comma"],
  "<": ["Comma"],
  ".": ["Period"],
  ">": ["Period"],
  "/": ["Slash"],
  "?": ["Slash"],
  " ": ["Space"],
  Tab: ["Tab"],
  Escape: ["Escape"],
  Enter: ["Enter"],
  ArrowUp: ["ArrowUp"],
  ArrowDown: ["ArrowDown"],
  ArrowLeft: ["ArrowLeft"],
  ArrowRight: ["ArrowRight"],
  Backspace: ["Backspace"],
  Delete: ["Delete"],
  F1: ["F1"],
  F2: ["F2"],
  F3: ["F3"],
  F4: ["F4"],
  F5: ["F5"],
  F6: ["F6"],
  F7: ["F7"],
  F8: ["F8"],
  F9: ["F9"],
  F10: ["F10"],
  F11: ["F11"],
  F12: ["F12"],
  Y: ["KeyY"],
};

export function matchShortcut(event: KeyboardEvent, shortcut: string): boolean {
  const parsed = parseShortcut(shortcut);

  const modifiersMatch =
    (event.ctrlKey || event.metaKey) === (parsed.ctrl || parsed.meta) &&
    event.shiftKey === parsed.shift &&
    event.altKey === parsed.alt;

  if (!modifiersMatch) return false;

  // Try by event.key first (works for regular characters without Shift)
  if (event.key.length === 1 && event.key.toLowerCase() === parsed.key.toLowerCase()) {
    return true;
  }

  // Try by event.code (physical key location)
  const code = event.code;
  const expectedCodes = keyToCode[parsed.key];
  if (expectedCodes && expectedCodes.includes(code)) {
    return true;
  }

  // Direct code match for special keys like ArrowUp, F11, etc.
  if (code.toLowerCase() === parsed.key.toLowerCase()) {
    return true;
  }

  return false;
}
