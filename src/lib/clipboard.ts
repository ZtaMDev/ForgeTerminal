import { clipboardReadText as ipcRead, clipboardWriteText as ipcWrite } from "./ipc";

/**
 * Reads text from system clipboard using native Tauri IPC (arboard).
 * Never triggers browser/WebView2 permission popups.
 */
export async function readClipboardText(): Promise<string> {
  try {
    return await ipcRead();
  } catch (err) {
    if (typeof navigator !== "undefined" && navigator.clipboard?.readText) {
      try {
        return await navigator.clipboard.readText();
      } catch {
        return "";
      }
    }
    return "";
  }
}

/**
 * Writes text to system clipboard using native Tauri IPC (arboard).
 * Never triggers browser/WebView2 permission popups.
 */
export async function writeClipboardText(text: string): Promise<void> {
  try {
    await ipcWrite(text);
  } catch (err) {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return;
      } catch {
        // Fallback to execCommand
      }
    }
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    } catch {
      // ignore
    }
  }
}

