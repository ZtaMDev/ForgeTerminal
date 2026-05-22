export interface EditorTabData {
  id: string;
  filePath: string;
  fileName: string;
  language: string;
  content: string;
  isDirty: boolean;
  cursorPosition: {
    line: number;
    col: number;
  };
  scrollPosition: number;
  encoding: string;
  fileSize: number;
}

export interface ViewerTabData {
  id: string;
  filePath: string;
  fileName: string;
  type: "image" | "raw" | "hex";
  fileSize: number;
}

export type FileType =
  | "image"
  | "code"
  | "text"
  | "binary"
  | "directory"
  | "unknown";
