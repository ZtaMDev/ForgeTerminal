import type { ShortcutsConfig } from "@/types/config";

export const defaultShortcuts: ShortcutsConfig = {
  commandKey: "`",
  global: {
    "toggle-passthrough": ["Ctrl+<cmd>"],
    "command-palette": ["Ctrl+Shift+P"],
    "new-terminal": ["Ctrl+Shift+<cmd>"],
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
    "rename-tab": ["Ctrl+Shift+R"],
    "past-sessions": ["Ctrl+Shift+O"],
    "split-horizontal": ["Ctrl+\\"],
    "split-vertical": ["Ctrl+Shift+\\"],
    "next-split": ["Ctrl+Shift+ArrowRight"],
    "prev-split": ["Ctrl+Shift+ArrowLeft"],
    "focus-terminal": ["Ctrl+Shift+T"],
    "move-tab-up": ["Alt+ArrowUp"],
    "move-tab-down": ["Alt+ArrowDown"],
    "release-focus": ["Ctrl+Shift+Space"],
    "new-terminal-at": ["Ctrl+Alt+<cmd>"],
    "open-settings": ["Ctrl+,"],
    "toggle-preview": ["Ctrl+Shift+Y"],
    "font-increase": ["Ctrl++", "Ctrl+="],
    "font-decrease": ["Ctrl+-"],
  },
  terminal: {
    copy: ["Ctrl+Shift+C"],
    paste: ["Ctrl+Shift+V"],
    "search-terminal": ["Ctrl+Shift+F"],
  },
};

export type ShortcutContext = "global" | "terminal";

export interface ShortcutDefinition {
  id: string;
  category: ShortcutContext;
  group: "System" | "Terminal & Splits" | "Tabs & Navigation" | "Window & View" | "Clipboard & Search";
  name: string;
  description: string;
  defaultKeys: string[];
}

export const shortcutDefinitions: ShortcutDefinition[] = [
  // System
  {
    id: "command-palette",
    category: "global",
    group: "System",
    name: "Command Palette",
    description: "Search and run any Forge command",
    defaultKeys: ["Ctrl+Shift+P"],
  },
  {
    id: "open-settings",
    category: "global",
    group: "System",
    name: "Open Settings",
    description: "Open the Forge settings panel",
    defaultKeys: ["Ctrl+,"],
  },

  // Terminal & Splits
  {
    id: "past-sessions",
    category: "global",
    group: "Terminal & Splits",
    name: "View Past Sessions",
    description: "Reopen previous workspace directories",
    defaultKeys: ["Ctrl+Shift+O"],
  },
  {
    id: "split-horizontal",
    category: "global",
    group: "Terminal & Splits",
    name: "Split Horizontally",
    description: "Split current terminal horizontally into two panes",
    defaultKeys: ["Ctrl+\\"],
  },
  {
    id: "split-vertical",
    category: "global",
    group: "Terminal & Splits",
    name: "Split Vertically",
    description: "Split current terminal vertically into two panes",
    defaultKeys: ["Ctrl+Shift+\\"],
  },
  {
    id: "next-split",
    category: "global",
    group: "Terminal & Splits",
    name: "Next Split Pane",
    description: "Cycle focus forward across split panes in active tab",
    defaultKeys: ["Ctrl+Shift+ArrowRight"],
  },
  {
    id: "prev-split",
    category: "global",
    group: "Terminal & Splits",
    name: "Previous Split Pane",
    description: "Cycle focus backward across split panes in active tab",
    defaultKeys: ["Ctrl+Shift+ArrowLeft"],
  },

  // Tabs & Navigation
  {
    id: "close-tab",
    category: "global",
    group: "Tabs & Navigation",
    name: "Close Current Split / Tab",
    description: "Close focused split pane or the active tab",
    defaultKeys: ["Ctrl+W"],
  },
  {
    id: "close-entire-tab",
    category: "global",
    group: "Tabs & Navigation",
    name: "Close Entire Tab",
    description: "Close the entire tab regardless of splits inside it",
    defaultKeys: ["Ctrl+Shift+W"],
  },
  {
    id: "next-tab",
    category: "global",
    group: "Tabs & Navigation",
    name: "Next Tab",
    description: "Switch to next tab in tab bar",
    defaultKeys: ["Ctrl+Tab"],
  },
  {
    id: "prev-tab",
    category: "global",
    group: "Tabs & Navigation",
    name: "Previous Tab",
    description: "Switch to previous tab in tab bar",
    defaultKeys: ["Ctrl+Shift+Tab"],
  },
  {
    id: "rename-tab",
    category: "global",
    group: "Tabs & Navigation",
    name: "Rename Tab",
    description: "Prompt to rename the current tab",
    defaultKeys: ["Ctrl+Shift+R"],
  },
  {
    id: "move-tab-up",
    category: "global",
    group: "Tabs & Navigation",
    name: "Move Tab Left",
    description: "Reorder active tab towards the left",
    defaultKeys: ["Alt+ArrowUp"],
  },
  {
    id: "move-tab-down",
    category: "global",
    group: "Tabs & Navigation",
    name: "Move Tab Right",
    description: "Reorder active tab towards the right",
    defaultKeys: ["Alt+ArrowDown"],
  },
  { id: "tab-1", category: "global", group: "Tabs & Navigation", name: "Switch to Tab 1", description: "Jump directly to tab 1", defaultKeys: ["Ctrl+1"] },
  { id: "tab-2", category: "global", group: "Tabs & Navigation", name: "Switch to Tab 2", description: "Jump directly to tab 2", defaultKeys: ["Ctrl+2"] },
  { id: "tab-3", category: "global", group: "Tabs & Navigation", name: "Switch to Tab 3", description: "Jump directly to tab 3", defaultKeys: ["Ctrl+3"] },
  { id: "tab-4", category: "global", group: "Tabs & Navigation", name: "Switch to Tab 4", description: "Jump directly to tab 4", defaultKeys: ["Ctrl+4"] },
  { id: "tab-5", category: "global", group: "Tabs & Navigation", name: "Switch to Tab 5", description: "Jump directly to tab 5", defaultKeys: ["Ctrl+5"] },
  { id: "tab-6", category: "global", group: "Tabs & Navigation", name: "Switch to Tab 6", description: "Jump directly to tab 6", defaultKeys: ["Ctrl+6"] },
  { id: "tab-7", category: "global", group: "Tabs & Navigation", name: "Switch to Tab 7", description: "Jump directly to tab 7", defaultKeys: ["Ctrl+7"] },
  { id: "tab-8", category: "global", group: "Tabs & Navigation", name: "Switch to Tab 8", description: "Jump directly to tab 8", defaultKeys: ["Ctrl+8"] },
  { id: "tab-9", category: "global", group: "Tabs & Navigation", name: "Switch to Tab 9", description: "Jump directly to tab 9", defaultKeys: ["Ctrl+9"] },

  // Window & View
  {
    id: "focus-terminal",
    category: "global",
    group: "Window & View",
    name: "Focus Terminal",
    description: "Focus the active terminal session",
    defaultKeys: ["Ctrl+Shift+T"],
  },
  {
    id: "release-focus",
    category: "global",
    group: "Window & View",
    name: "Release Focus",
    description: "Blur currently focused element",
    defaultKeys: ["Ctrl+Shift+Space"],
  },
  {
    id: "toggle-preview",
    category: "global",
    group: "Window & View",
    name: "Toggle Web Preview Panel",
    description: "Show or hide the live web preview pane",
    defaultKeys: ["Ctrl+Shift+Y"],
  },
  {
    id: "font-increase",
    category: "global",
    group: "Window & View",
    name: "Increase Font Size",
    description: "Zoom in terminal font size (Ctrl++ or Ctrl+=)",
    defaultKeys: ["Ctrl++", "Ctrl+="],
  },
  {
    id: "font-decrease",
    category: "global",
    group: "Window & View",
    name: "Decrease Font Size",
    description: "Zoom out terminal font size (Ctrl+-)",
    defaultKeys: ["Ctrl+-"],
  },

  // Clipboard & Search (terminal-specific)
  {
    id: "copy",
    category: "terminal",
    group: "Clipboard & Search",
    name: "Copy Selection",
    description: "Copy selected terminal text to clipboard (native)",
    defaultKeys: ["Ctrl+Shift+C"],
  },
  {
    id: "paste",
    category: "terminal",
    group: "Clipboard & Search",
    name: "Paste into Terminal",
    description: "Paste clipboard text into focused terminal (native)",
    defaultKeys: ["Ctrl+Shift+V"],
  },
  {
    id: "search-terminal",
    category: "terminal",
    group: "Clipboard & Search",
    name: "Search in Terminal",
    description: "Open the find in terminal search bar",
    defaultKeys: ["Ctrl+Shift+F"],
  },
];

export interface ParsedShortcut {
  key: string;
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
}

export function formatShortcut(shortcut: string, commandKey: string): string {
  return shortcut.replace("<cmd>", commandKey);
}

export function parseShortcut(shortcut: string, commandKey?: string): ParsedShortcut {
  const finalShortcut = commandKey ? formatShortcut(shortcut, commandKey) : shortcut;

  let key = "";
  let modifierString = finalShortcut;

  // Handle keys that are "+" themselves, e.g. "Ctrl++" or "Ctrl+Shift++" or "+"
  if (finalShortcut.endsWith("++")) {
    key = "+";
    modifierString = finalShortcut.slice(0, -2);
  } else if (finalShortcut === "+") {
    key = "+";
    modifierString = "";
  } else {
    const lastPlus = finalShortcut.lastIndexOf("+");
    if (lastPlus !== -1) {
      key = finalShortcut.slice(lastPlus + 1);
      modifierString = finalShortcut.slice(0, lastPlus);
    } else {
      key = finalShortcut;
      modifierString = "";
    }
  }

  const modParts = modifierString.split("+").filter(Boolean);
  return {
    ctrl: modParts.includes("Ctrl"),
    shift: modParts.includes("Shift"),
    alt: modParts.includes("Alt"),
    meta: modParts.includes("Meta") || modParts.includes("Cmd"),
    key,
  };
}

// Map physical key (event.code) to the key string used in shortcuts
const keyToCode: Record<string, string[]> = {
  "`": ["Backquote", "IntlBackslash"],
  "~": ["Backquote", "IntlBackslash"],
  "-": ["Minus", "NumpadSubtract"],
  "_": ["Minus", "NumpadSubtract"],
  "=": ["Equal", "NumpadEqual", "NumpadAdd", "Plus"],
  "+": ["Equal", "NumpadAdd", "NumpadEqual", "Plus", "BracketRight"],
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
  ".": ["Period", "NumpadDecimal"],
  ">": ["Period"],
  "/": ["Slash", "NumpadDivide"],
  "?": ["Slash"],
  " ": ["Space"],
  Tab: ["Tab"],
  Escape: ["Escape"],
  Enter: ["Enter", "NumpadEnter"],
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

export function matchShortcut(event: KeyboardEvent, shortcut: string, commandKey?: string): boolean {
  const parsed = parseShortcut(shortcut, commandKey);

  // Special handling for zoom in (+ / =):
  // Works with Ctrl+=, Ctrl++, Ctrl+Shift+=, NumpadAdd, etc.
  if (parsed.key === "+" || parsed.key === "=") {
    const isPlusOrEqualKey =
      event.key === "+" ||
      event.key === "=" ||
      event.code === "Equal" ||
      event.code === "NumpadAdd" ||
      event.code === "Plus" ||
      (event.key === "+" &&
        (event.code === "BracketRight" ||
          event.code === "BracketLeft" ||
          event.code === "Backslash"));

    if (isPlusOrEqualKey) {
      const ctrlMatch = (event.ctrlKey || event.metaKey) === (parsed.ctrl || parsed.meta);
      const altMatch = event.altKey === parsed.alt;
      // Allow with or without Shift since on US layout + is Shift+=, while on others it is standalone
      if (ctrlMatch && altMatch) {
        return true;
      }
    }
  }

  // Special handling for zoom out (-):
  if (parsed.key === "-" || parsed.key === "_") {
    const isMinusKey =
      event.key === "-" ||
      event.key === "_" ||
      event.code === "Minus" ||
      event.code === "NumpadSubtract";

    if (isMinusKey) {
      const ctrlMatch = (event.ctrlKey || event.metaKey) === (parsed.ctrl || parsed.meta);
      const altMatch = event.altKey === parsed.alt;
      if (ctrlMatch && altMatch) {
        return true;
      }
    }
  }

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

/**
 * Splits a shortcut string (like "Ctrl+Shift+P" or "Ctrl++" or "Ctrl+<cmd>")
 * into individual key tokens suitable for UI badge display.
 */
export function splitShortcutParts(shortcut: string, commandKey?: string): string[] {
  const formatted = commandKey ? formatShortcut(shortcut, commandKey) : shortcut;
  if (!formatted) return [];

  if (formatted.endsWith("++")) {
    const modStr = formatted.slice(0, -2);
    const mods = modStr ? modStr.split("+").filter(Boolean) : [];
    return [...mods, "+"];
  }

  if (formatted === "+") {
    return ["+"];
  }

  const lastPlus = formatted.lastIndexOf("+");
  if (lastPlus !== -1) {
    const mods = formatted.slice(0, lastPlus).split("+").filter(Boolean);
    const key = formatted.slice(lastPlus + 1);
    return [...mods, key];
  }

  return [formatted];
}

const codeToKeyName: Record<string, string> = {
  Backquote: "`",
  Minus: "-",
  Equal: "=",
  BracketLeft: "[",
  BracketRight: "]",
  Backslash: "\\",
  Semicolon: ";",
  Quote: "'",
  Comma: ",",
  Period: ".",
  Slash: "/",
  Space: "Space",
  Tab: "Tab",
  Enter: "Enter",
  Escape: "Escape",
  Backspace: "Backspace",
  Delete: "Delete",
  ArrowUp: "ArrowUp",
  ArrowDown: "ArrowDown",
  ArrowLeft: "ArrowLeft",
  ArrowRight: "ArrowRight",
  NumpadAdd: "+",
  NumpadSubtract: "-",
  NumpadMultiply: "*",
  NumpadDivide: "/",
  NumpadEnter: "Enter",
};

/**
 * Converts a KeyboardEvent into a formatted shortcut string (e.g. "Ctrl+Shift+P" or "Ctrl+<cmd>").
 * Returns null if only modifier keys were pressed.
 */
export function eventToShortcutString(event: KeyboardEvent, commandKey: string): string | null {
  const modifierKeys = ["Control", "Shift", "Alt", "Meta", "OS"];
  if (modifierKeys.includes(event.key)) {
    return null;
  }

  const parts: string[] = [];

  const isPlusKey =
    event.key === "+" ||
    event.code === "NumpadAdd" ||
    event.code === "Plus" ||
    (event.shiftKey && event.code === "Equal");

  if (event.ctrlKey || event.metaKey) parts.push("Ctrl");
  // Only add Shift if it wasn't just the mechanism to type "+" on an Equal key
  if (event.shiftKey && (!isPlusKey || event.code !== "Equal")) {
    parts.push("Shift");
  }
  if (event.altKey) parts.push("Alt");

  let keyStr = "";

  if (isPlusKey) {
    keyStr = "+";
  } else if (event.key === "-" || event.code === "NumpadSubtract" || event.code === "Minus") {
    keyStr = "-";
  } else if (event.code.startsWith("Key") && event.code.length === 4) {
    keyStr = event.code.slice(3).toUpperCase();
  } else if (event.code.startsWith("Digit") && event.code.length === 6) {
    keyStr = event.code.slice(5);
  } else if (/^F\d{1,2}$/.test(event.code)) {
    keyStr = event.code;
  } else if (codeToKeyName[event.code]) {
    keyStr = codeToKeyName[event.code];
  } else if (event.key.length === 1) {
    keyStr = event.key.toUpperCase();
  } else {
    keyStr = event.key;
  }

  parts.push(keyStr);
  return parts.join("+");
}
