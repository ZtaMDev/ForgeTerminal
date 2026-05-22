import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { rust } from "@codemirror/lang-rust";
import { json } from "@codemirror/lang-json";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { markdown } from "@codemirror/lang-markdown";
import { xml } from "@codemirror/lang-xml";
import { sql } from "@codemirror/lang-sql";
import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { php } from "@codemirror/lang-php";
import type { Extension } from "@codemirror/state";

export interface LanguageSupport {
  name: string;
  extensions: string[];
  load: () => Extension;
}

export const languageMap: LanguageSupport[] = [
  {
    name: "JavaScript",
    extensions: [".js", ".mjs", ".cjs", ".jsx"],
    load: () => javascript(),
  },
  {
    name: "TypeScript",
    extensions: [".ts", ".tsx", ".mts", ".cts"],
    load: () => javascript({ typescript: true }),
  },
  {
    name: "JSX",
    extensions: [".jsx"],
    load: () => javascript({ jsx: true }),
  },
  {
    name: "TSX",
    extensions: [".tsx"],
    load: () => javascript({ jsx: true, typescript: true }),
  },
  {
    name: "Python",
    extensions: [".py", ".pyw", ".pyx"],
    load: () => python(),
  },
  {
    name: "Rust",
    extensions: [".rs"],
    load: () => rust(),
  },
  {
    name: "JSON",
    extensions: [".json", ".jsonc"],
    load: () => json(),
  },
  {
    name: "HTML",
    extensions: [".html", ".htm", ".xhtml"],
    load: () => html(),
  },
  {
    name: "CSS",
    extensions: [".css", ".scss", ".less", ".sass"],
    load: () => css(),
  },
  {
    name: "Markdown",
    extensions: [".md", ".mdx"],
    load: () => markdown(),
  },
  {
    name: "XML",
    extensions: [".xml", ".svg", ".plist"],
    load: () => xml(),
  },
  {
    name: "SQL",
    extensions: [".sql"],
    load: () => sql(),
  },
  {
    name: "C/C++",
    extensions: [".c", ".cpp", ".h", ".hpp", ".cc", ".cxx"],
    load: () => cpp(),
  },
  {
    name: "Java",
    extensions: [".java"],
    load: () => java(),
  },
  {
    name: "PHP",
    extensions: [".php"],
    load: () => php(),
  },
  {
    name: "YAML",
    extensions: [".yaml", ".yml"],
    load: () => javascript(),
  },
  {
    name: "TOML",
    extensions: [".toml"],
    load: () => javascript(),
  },
  {
    name: "Bash",
    extensions: [".sh", ".bash", ".zsh"],
    load: () => javascript(),
  },
  {
    name: "PowerShell",
    extensions: [".ps1", ".psm1", ".psd1"],
    load: () => javascript(),
  },
  {
    name: "Batch",
    extensions: [".bat", ".cmd"],
    load: () => javascript(),
  },
  {
    name: "Dockerfile",
    extensions: ["dockerfile"],
    load: () => javascript(),
  },
  {
    name: "Plain Text",
    extensions: [".txt", ".log", ".env", ".gitignore", ".editorconfig"],
    load: () => [],
  },
];

export function getLanguageForFile(filename: string): LanguageSupport {
  const lower = filename.toLowerCase();

  if (lower === "dockerfile") {
    const lang = languageMap.find((l) => l.extensions.includes("dockerfile"));
    if (lang) return lang;
  }

  if (lower === "makefile" || lower === "makefile") {
    return { name: "Makefile", extensions: [], load: () => javascript() };
  }

  const ext = `.${lower.split(".").pop() ?? ""}`;
  const match = languageMap.find((l) => l.extensions.includes(ext));
  return (
    match ?? {
      name: "Plain Text",
      extensions: [],
      load: () => [],
    }
  );
}
