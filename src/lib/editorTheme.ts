import { syntaxHighlighting, HighlightStyle } from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { EditorView } from "@codemirror/view";

const catppuccinHighlight = HighlightStyle.define([
  { tag: tags.keyword, color: "var(--color-mauve)" },
  { tag: [tags.deleted, tags.meta], color: "var(--color-red)" },
  { tag: [tags.inserted, tags.escape], color: "var(--color-green)" },
  { tag: [tags.string, tags.regexp, tags.special(tags.string)], color: "var(--color-green)" },
  { tag: tags.comment, color: "var(--color-overlay0)", fontStyle: "italic" },
  { tag: tags.number, color: "var(--color-peach)" },
  { tag: tags.bool, color: "var(--color-peach)" },
  { tag: tags.atom, color: "var(--color-peach)" },
  { tag: tags.variableName, color: "var(--color-yellow)" },
  { tag: tags.local(tags.variableName), color: "var(--color-yellow)" },
  { tag: tags.special(tags.variableName), color: "var(--color-red)" },
  { tag: tags.definition(tags.variableName), color: "var(--color-yellow)" },
  { tag: tags.typeName, color: "var(--color-yellow)" },
  { tag: tags.className, color: "var(--color-blue)" },
  { tag: tags.namespace, color: "var(--color-mauve)" },
  { tag: tags.propertyName, color: "var(--color-teal)" },
  { tag: tags.definition(tags.propertyName), color: "var(--color-teal)" },
  { tag: tags.attributeName, color: "var(--color-yellow)" },
  { tag: tags.labelName, color: "var(--color-mauve)" },
  { tag: tags.macroName, color: "var(--color-red)" },
  { tag: tags.operator, color: "var(--color-sky)" },
  { tag: tags.definition(tags.operator), color: "var(--color-sky)" },
  { tag: tags.derefOperator, color: "var(--color-sky)" },
  { tag: tags.arithmeticOperator, color: "var(--color-sky)" },
  { tag: tags.logicOperator, color: "var(--color-sky)" },
  { tag: tags.bitwiseOperator, color: "var(--color-sky)" },
  { tag: tags.compareOperator, color: "var(--color-sky)" },
  { tag: tags.updateOperator, color: "var(--color-sky)" },
  { tag: tags.controlOperator, color: "var(--color-sky)" },
  { tag: tags.typeOperator, color: "var(--color-sky)" },
  { tag: tags.definition(tags.typeName), color: "var(--color-yellow)" },
  { tag: tags.bracket, color: "var(--color-fg-alt)" },
  { tag: tags.squareBracket, color: "var(--color-fg-alt)" },
  { tag: tags.angleBracket, color: "var(--color-fg-alt)" },
  { tag: tags.punctuation, color: "var(--color-fg-alt)" },
  { tag: tags.separator, color: "var(--color-fg-alt)" },
  { tag: tags.link, color: "var(--color-blue)", textDecoration: "underline" },
  { tag: tags.url, color: "var(--color-blue)", textDecoration: "underline" },
  { tag: tags.heading, color: "var(--color-red)", fontWeight: "bold" },
  { tag: tags.heading1, color: "var(--color-red)", fontWeight: "bold" },
  { tag: tags.heading2, color: "var(--color-peach)", fontWeight: "bold" },
  { tag: tags.heading3, color: "var(--color-yellow)", fontWeight: "bold" },
  { tag: tags.strong, color: "var(--color-red)", fontWeight: "bold" },
  { tag: tags.emphasis, color: "var(--color-yellow)", fontStyle: "italic" },
  { tag: tags.strikethrough, color: "var(--color-overlay0)", textDecoration: "line-through" },
  { tag: tags.content, color: "var(--color-fg)" },
  { tag: tags.invalid, color: "var(--color-red)" },
  { tag: tags.unit, color: "var(--color-peach)" },
  { tag: tags.modifier, color: "var(--color-mauve)" },
  { tag: tags.self, color: "var(--color-mauve)" },
  { tag: tags.null, color: "var(--color-peach)" },
  { tag: tags.character, color: "var(--color-green)" },
  { tag: tags.attributeValue, color: "var(--color-green)" },
  { tag: tags.definitionKeyword, color: "var(--color-mauve)" },
  { tag: tags.moduleKeyword, color: "var(--color-mauve)" },
  { tag: tags.controlKeyword, color: "var(--color-mauve)" },
  { tag: tags.operatorKeyword, color: "var(--color-sky)" },
  { tag: tags.definition(tags.className), color: "var(--color-blue)" },
  { tag: tags.definition(tags.typeName), color: "var(--color-yellow)" },
]);

export const catppuccinEditorTheme = EditorView.theme(
  {
    "&": {
      backgroundColor: "var(--color-bg-alt)",
      height: "100%",
    },
    ".cm-scroller": {
      overflow: "auto",
    },
    ".cm-content": {
      caretColor: "var(--color-rosewater)",
      fontFamily: "var(--editor-font-family, 'JetBrains Mono', 'Cascadia Code', monospace)",
      fontSize: "var(--editor-font-size, 14px)",
    },
    ".cm-cursor": {
      borderLeftColor: "var(--color-rosewater)",
      borderLeftWidth: "var(--editor-cursor-width, 2px)",
    },
    ".cm-selectionBackground": {
      backgroundColor: "rgba(69, 71, 90, 0.6)",
    },
    "&.cm-focused .cm-selectionBackground": {
      backgroundColor: "rgba(69, 71, 90, 0.8)",
    },
    ".cm-cursorLayer": {
      animationDuration: "1.2s",
    },
    ".cm-gutters": {
      backgroundColor: "var(--color-bg)",
      borderRight: "1px solid var(--color-surface0)",
      color: "var(--color-subtext0)",
    },
    ".cm-lineNumbers .cm-gutterElement": {
      padding: "0 8px 0 4px",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "var(--color-surface0)",
      color: "var(--color-fg)",
    },
    ".cm-activeLine": {
      backgroundColor: "rgba(69, 71, 90, 0.3)",
    },
    ".cm-matchingBracket": {
      backgroundColor: "rgba(203, 166, 247, 0.2)",
      outline: "1px solid var(--color-mauve)",
    },
    ".cm-nonmatchingBracket": {
      backgroundColor: "rgba(243, 139, 168, 0.2)",
      outline: "1px solid var(--color-red)",
    },
    ".cm-foldPlaceholder": {
      backgroundColor: "var(--color-surface0)",
      color: "var(--color-subtext0)",
      border: "none",
    },
    ".cm-searchMatch": {
      backgroundColor: "rgba(249, 226, 175, 0.3)",
      outline: "1px solid transparent",
    },
    ".cm-searchMatch-selected": {
      backgroundColor: "rgba(249, 226, 175, 0.5)",
    },
    ".cm-tooltip": {
      backgroundColor: "var(--color-bg-surface)",
      border: "1px solid var(--color-surface1)",
      color: "var(--color-fg)",
    },
    ".cm-tooltip-autocomplete": {
      "& > ul": {
        maxHeight: "300px",
      },
      "& ul li": {
        color: "var(--color-fg)",
        padding: "2px 6px",
      },
      "& ul li[aria-selected]": {
        backgroundColor: "var(--color-surface0)",
        color: "var(--color-accent)",
      },
    },
    ".cm-completionLabel": {
      color: "var(--color-fg)",
    },
    ".cm-completionDetail": {
      color: "var(--color-fg-subtle)",
      fontStyle: "italic",
    },
    ".cm-completionMatchedText": {
      color: "var(--color-accent)",
      textDecoration: "none",
    },
    ".cm-selectionMatch": {
      backgroundColor: "rgba(137, 180, 250, 0.15)",
    },
    ".cm-diagnostic": {
      borderLeft: "3px solid var(--color-red)",
    },
    ".cm-diagnostic-error": {
      borderLeftColor: "var(--color-red)",
    },
    ".cm-diagnostic-warning": {
      borderLeftColor: "var(--color-yellow)",
    },
    ".cm-panel": {
      backgroundColor: "var(--color-bg-alt)",
      color: "var(--color-fg)",
    },
    ".cm-panel.cm-search": {
      padding: "4px 8px",
      borderBottom: "1px solid var(--color-surface0)",
    },
    ".cm-panel.cm-search label": {
      color: "var(--color-fg-subtle)",
      fontSize: "12px",
    },
    ".cm-panel.cm-search input": {
      backgroundColor: "var(--color-bg-surface)",
      color: "var(--color-fg)",
      border: "1px solid var(--color-surface1)",
      borderRadius: "4px",
      padding: "2px 6px",
    },
    ".cm-panel.cm-search .cm-button": {
      backgroundColor: "var(--color-surface0)",
      color: "var(--color-fg)",
      border: "1px solid var(--color-surface1)",
      borderRadius: "4px",
      padding: "2px 8px",
      cursor: "pointer",
    },
    ".cm-panel.cm-search .cm-button:hover": {
      backgroundColor: "var(--color-surface1)",
    },
  },
  { dark: true },
);

export function getEditorExtensions() {
  return [
    catppuccinEditorTheme,
    syntaxHighlighting(catppuccinHighlight),
  ];
}
