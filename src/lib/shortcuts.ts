import type { ShortcutsConfig } from "@/types/config";

export const defaultShortcuts: ShortcutsConfig = {
  global: {
    "command-palette": ["Ctrl+Shift+P"],
    "quick-open": ["Ctrl+P"],
    "toggle-terminal": ["Ctrl+`"],
    "new-terminal": ["Ctrl+Shift+`"],
    "close-tab": ["Ctrl+W"],
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
    "toggle-explorer": ["Ctrl+B"],
    "open-settings": ["Ctrl+,"],
    "release-focus": ["Ctrl+Shift+Space"],
    fullscreen: ["F11"],
    "move-tab-up": ["Alt+ArrowUp"],
    "move-tab-down": ["Alt+ArrowDown"],
    "new-terminal-at": ["Ctrl+Alt+`"],
    "change-explorer-root": ["Ctrl+Shift+O"],
    "rename-tab": ["Ctrl+Shift+R"],
    "split-horizontal": ["Ctrl+\\"],
    "split-vertical": ["Ctrl+Shift+\\"],
    "close-split": ["Ctrl+Shift+W"],
    "next-split": ["Ctrl+Shift+ArrowUp"],
    "prev-split": ["Ctrl+Shift+ArrowDown"],
    "duplicate-tab": ["Ctrl+D"],
  },
  terminal: {
    copy: ["Ctrl+Shift+C"],
    paste: ["Ctrl+Shift+V"],
    "search-terminal": ["Ctrl+Shift+F"],
    "split-horizontal": ["Ctrl+\\"],
    "split-vertical": ["Ctrl+Shift+\\"],
    "close-split": ["Ctrl+Shift+W"],
    "next-split": ["Ctrl+Shift+ArrowUp"],
    "prev-split": ["Ctrl+Shift+ArrowDown"],
    "duplicate-tab": ["Ctrl+D"],
  },
  editor: {
    save: ["Ctrl+S"],
    find: ["Ctrl+F"],
    replace: ["Ctrl+H"],
    "select-next": ["Ctrl+D"],
    "toggle-comment": ["Ctrl+/"],
    "move-line-up": ["Alt+ArrowUp"],
    "move-line-down": ["Alt+ArrowDown"],
    "select-all-occurences": ["Ctrl+Shift+L"],
    "trigger-autocomplete": ["Ctrl+Space"],
    "delete-line": ["Ctrl+Shift+K"],
    indent: ["Tab"],
    outdent: ["Shift+Tab"],
  },
  explorer: {
    "focus-explorer": ["Ctrl+Shift+E"],
    "new-file": ["Ctrl+Shift+N"],
    "new-folder": ["Ctrl+Shift+~"],
    rename: ["F2"],
    delete: ["Delete"],
    refresh: ["Ctrl+R"],
    "open-file": ["Enter"],
    "preview-file": ["Space"],
  },
};

export type ShortcutContext = "global" | "terminal" | "editor" | "explorer";

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
