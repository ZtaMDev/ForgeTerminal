import { useEffect, useState, useCallback } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { EditorView } from "@codemirror/view";
import { search } from "@codemirror/search";
import { autocompletion } from "@codemirror/autocomplete";
import { useConfigStore } from "@/stores/configStore";
import { getTheme } from "@/lib/themes";
import { getLanguageForFile } from "@/lib/languages";
import { fsReadFile, fsWriteFile } from "@/lib/ipc";
import { useEditorStore } from "@/stores/editorStore";

interface CodeMirrorEditorProps {
  editorId: string;
  filePath: string;
}

export function CodeMirrorEditor({ editorId, filePath }: CodeMirrorEditorProps) {
  const config = useConfigStore((s) => s.config);
  const { updateEditor, setDirty, setContent } = useEditorStore();
  const [content, setLocalContent] = useState("");
  const [language, setLanguage] = useState("Plain Text");
  const [loaded, setLoaded] = useState(false);

  const themeColors = getTheme(config.theme.type);

  const editorTheme = EditorView.theme(
    {
      "&": {
        backgroundColor: "transparent",
        height: "100%",
        fontSize: `${config.editor.fontSize}px`,
        fontFamily: config.editor.fontFamily,
      },
      ".cm-gutters": {
        backgroundColor: "var(--color-bg-alt)",
        borderRight: "1px solid var(--color-surface0)",
        color: "var(--color-subtext0)",
      },
      ".cm-activeLineGutter": {
        backgroundColor: "var(--color-surface0)",
      },
      ".cm-activeLine": {
        backgroundColor: "rgba(69, 71, 90, 0.3)",
      },
      ".cm-cursor": {
        borderLeft: `${config.editor.cursorWidth}px solid var(--color-rosewater)`,
      },
      ".cm-selectionBackground": {
        backgroundColor: "rgba(69, 71, 90, 0.6)",
      },
      ".cm-matchingBracket": {
        backgroundColor: "rgba(203, 166, 247, 0.2)",
        outline: "1px solid var(--color-mauve)",
      },
      ".cm-searchMatch": {
        backgroundColor: "rgba(249, 226, 175, 0.3)",
      },
      ".cm-searchMatch-selected": {
        backgroundColor: "rgba(249, 226, 175, 0.5)",
      },
      ".cm-tooltip": {
        backgroundColor: "var(--color-bg-surface)",
        border: "1px solid var(--color-surface1)",
        color: "var(--color-fg)",
      },
      ".cm-tooltip-autocomplete ul li": {
        color: "var(--color-fg)",
      },
      ".cm-tooltip-autocomplete ul li[aria-selected]": {
        backgroundColor: "var(--color-surface0)",
        color: "var(--color-accent)",
      },
      ".cm-foldPlaceholder": {
        backgroundColor: "var(--color-surface0)",
        color: "var(--color-subtext0)",
      },
      "&.cm-focused .cm-selectionBackground": {
        backgroundColor: "rgba(69, 71, 90, 0.8)",
      },
    },
    { dark: true },
  );

  const syntaxTheme = EditorView.theme(
    {
      ".cm-line": {
        color: themeColors.colors.fg,
      },
      "& .ͼ1 .cm-keyword": { color: themeColors.syntax.keyword },
      "& .ͼ1 .cm-atom": { color: themeColors.syntax.number },
      "& .ͼ1 .cm-number": { color: themeColors.syntax.number },
      "& .ͼ1 .cm-def": { color: themeColors.syntax.function },
      "& .ͼ1 .cm-variable": { color: themeColors.syntax.variable },
      "& .ͼ1 .cm-variable-2": { color: themeColors.syntax.variable },
      "& .ͼ1 .cm-variable-3": { color: themeColors.syntax.variable },
      "& .ͼ1 .cm-type": { color: themeColors.syntax.type },
      "& .ͼ1 .cm-comment": { color: themeColors.syntax.comment },
      "& .ͼ1 .cm-string": { color: themeColors.syntax.string },
      "& .ͼ1 .cm-string-2": { color: themeColors.syntax.string },
      "& .ͼ1 .cm-meta": { color: themeColors.syntax.meta },
      "& .ͼ1 .cm-qualifier": { color: themeColors.syntax.function },
      "& .ͼ1 .cm-builtin": { color: themeColors.syntax.constant },
      "& .ͼ1 .cm-bracket": { color: themeColors.syntax.punctuation },
      "& .ͼ1 .cm-tag": { color: themeColors.syntax.tag },
      "& .ͼ1 .cm-attribute": { color: themeColors.syntax.attribute },
      "& .ͼ1 .cm-hr": { color: themeColors.syntax.punctuation },
      "& .ͼ1 .cm-link": { color: themeColors.syntax.link },
      "& .ͼ1 .cm-operator": { color: themeColors.syntax.operator },
      "& .ͼ1 .cm-property": { color: themeColors.syntax.property },
      "& .ͼ1 .cm-punctuation": { color: themeColors.syntax.punctuation },
      "& .ͼ1 .cm-separator": { color: themeColors.syntax.punctuation },
    },
    { dark: true },
  );

  const fileName = filePath.split("\\").pop() ?? "";
  const langInfo = getLanguageForFile(fileName);
  const langExtension = langInfo.load();

  useEffect(() => {
    const loadFile = async () => {
      try {
        const fileContent = await fsReadFile(filePath);
        setLocalContent(fileContent);
        setLanguage(langInfo.name);
        setLoaded(true);

        updateEditor(editorId, {
          content: fileContent,
          language: langInfo.name,
          fileName,
          filePath,
        });
      } catch (e) {
        console.error("Failed to load file:", e);
        setLocalContent(`// Error loading file: ${filePath}`);
        setLoaded(true);
      }
    };
    loadFile();
  }, [filePath]);

  const onChange = useCallback(
    (value: string) => {
      setLocalContent(value);
      setContent(editorId, value);
    },
    [editorId, setContent],
  );

  const handleSave = useCallback(async () => {
    try {
      await fsWriteFile(filePath, content);
      setDirty(editorId, false);
    } catch (e) {
      console.error("Failed to save file:", e);
    }
  }, [filePath, content, editorId, setDirty]);

  if (!loaded) {
    return (
      <div className="flex-1 flex items-center justify-center panel-bg">
        <span className="text-fg-subtle text-sm">Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 panel-bg overflow-hidden">
      <CodeMirror
        value={content}
        onChange={onChange}
        extensions={[
          langExtension,
          editorTheme,
          syntaxTheme,
          search(),
          autocompletion(),
          EditorView.lineWrapping,
          EditorView.updateListener.of((update) => {
            if (update.focusChanged) {
              if (update.view.hasFocus) {
                document.dispatchEvent(
                  new CustomEvent("editor-focus", { detail: { editorId } }),
                );
              } else {
                document.dispatchEvent(
                  new CustomEvent("editor-blur", { detail: { editorId } }),
                );
              }
            }
          }),
          EditorView.theme({
            "&": { height: "100%" },
            ".cm-scroller": { overflow: "auto" },
          }),
        ]}
        basicSetup={{
          lineNumbers: config.editor.lineNumbers,
          highlightActiveLineGutter: true,
          highlightActiveLine: true,
          foldGutter: true,
          bracketMatching: true,
          closeBrackets: config.editor.autoClosingBrackets,
          indentOnInput: true,
          tabSize: config.editor.tabSize,
          highlightSelectionMatches: true,
        }}
        style={{ height: "100%" }}
      />
    </div>
  );
}
