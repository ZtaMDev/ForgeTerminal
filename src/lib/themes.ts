import type { ITheme } from "@xterm/xterm";

export interface ForgeTheme {
  name: string;
  type: "dark" | "light";
  colors: Record<string, string>;
  terminal: ITheme;
  syntax: Record<string, string>;
  ansi: string[];
}

export const catppuccinMocha: ForgeTheme = {
  name: "Catppuccin Mocha",
  type: "dark",
  colors: {
    bg: "#1e1e2e",
    "bg-alt": "#181825",
    "bg-surface": "#313244",
    "bg-overlay": "#45475a",
    fg: "#cdd6f4",
    "fg-alt": "#bac2de",
    "fg-subtle": "#a6adc8",
    red: "#f38ba8",
    green: "#a6e3a1",
    yellow: "#f9e2af",
    blue: "#89b4fa",
    magenta: "#f5c2e7",
    cyan: "#94e2d5",
    peach: "#fab387",
    mauve: "#cba6f7",
    teal: "#94e2d5",
    sky: "#89dceb",
    pink: "#f5c2e7",
    flamingo: "#f2cdcd",
    rosewater: "#f5e0dc",
    maroon: "#eba0ac",
    lavender: "#b4befe",
    sapphire: "#74c7ec",
    mantle: "#181825",
    crust: "#11111b",
    subtext0: "#a6adc8",
    subtext1: "#bac2de",
    surface0: "#313244",
    surface1: "#45475a",
    surface2: "#585b70",
    overlay0: "#6c7086",
    overlay1: "#7f849c",
    overlay2: "#9399b2",
    accent: "#cba6f7",
  },
  terminal: {
    background: "#1e1e2e",
    foreground: "#cdd6f4",
    cursor: "#f5e0dc",
    cursorAccent: "#1e1e2e",
    selectionBackground: "#45475a",
    selectionInactiveBackground: "#313244",
  },
  ansi: [
    "#45475a",
    "#f38ba8",
    "#a6e3a1",
    "#f9e2af",
    "#89b4fa",
    "#f5c2e7",
    "#94e2d5",
    "#bac2de",
    "#585b70",
    "#f38ba8",
    "#a6e3a1",
    "#f9e2af",
    "#89b4fa",
    "#f5c2e7",
    "#94e2d5",
    "#a6adc8",
  ],
  syntax: {
    keyword: "#cba6f7",
    string: "#a6e3a1",
    number: "#fab387",
    boolean: "#fab387",
    function: "#89b4fa",
    variable: "#f9e2af",
    constant: "#f38ba8",
    type: "#f9e2af",
    comment: "#6c7086",
    operator: "#89dceb",
    property: "#94e2d5",
    punctuation: "#bac2de",
    tag: "#f38ba8",
    attribute: "#f9e2af",
    selector: "#cba6f7",
    regexp: "#f5c2e7",
    escape: "#f5c2e7",
    link: "#89b4fa",
    url: "#89b4fa",
    heading: "#f38ba8",
    strong: "#f38ba8",
    emphasis: "#f9e2af",
    deleted: "#f38ba8",
    inserted: "#a6e3a1",
    changed: "#f9e2af",
    invalid: "#f38ba8",
    meta: "#f5c2e7",
  },
};

export const themes: Record<string, ForgeTheme> = {
  "catppuccin-mocha": catppuccinMocha,
};

export function getTheme(name: string): ForgeTheme {
  return themes[name] ?? catppuccinMocha;
}
