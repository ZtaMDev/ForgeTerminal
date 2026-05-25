import { useEffect, useState, useCallback } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { EditorView } from "@codemirror/view";
import { search } from "@codemirror/search";
import { autocompletion } from "@codemirror/autocomplete";
import { useConfigStore } from "@/stores/configStore";
import { getLanguageForFile } from "@/lib/languages";
import { getEditorExtensions } from "@/lib/editorTheme";
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
    <div
      className="flex-1 panel-bg overflow-hidden"
      style={{
        "--editor-font-family": `${config.editor.fontFamily}`,
        "--editor-font-size": `${config.editor.fontSize}px`,
        "--editor-cursor-width": `${config.editor.cursorWidth}px`,
      } as React.CSSProperties}
    >
      <CodeMirror
        value={content}
        onChange={onChange}
        extensions={[
          langExtension,
          ...getEditorExtensions(),
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
