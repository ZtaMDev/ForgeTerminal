import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type { PTYData, PTYExit, PTYError } from "@/types/terminal";

export interface FileEntry {
  name: string;
  path: string;
  is_dir: boolean;
  size: number;
  modified_at: string;
}

export interface FileInfo {
  name: string;
  path: string;
  is_dir: boolean;
  size: number;
  modified_at: string;
}

export interface PtySpawnResult {
  process_id: number;
  cwd: string;
}

export async function ptySpawn(
  id: string,
  shell: string,
  cwd: string,
  cols: number,
  rows: number,
): Promise<PtySpawnResult> {
  return invoke<PtySpawnResult>("pty_spawn", { id, shell, cwd, cols, rows });
}

export async function ptyWrite(id: string, data: string): Promise<void> {
  return invoke("pty_write", { id, data });
}

export async function ptyResize(
  id: string,
  cols: number,
  rows: number,
): Promise<void> {
  return invoke("pty_resize", { id, cols, rows });
}

export async function ptyKill(id: string): Promise<void> {
  return invoke("pty_kill", { id });
}

export async function fsReadDir(path: string): Promise<FileEntry[]> {
  return invoke<FileEntry[]>("fs_read_dir", { path });
}

export async function fsReadFile(path: string): Promise<string> {
  return invoke<string>("fs_read_file", { path });
}

export async function fsReadFileBinary(path: string): Promise<string> {
  return invoke<string>("fs_read_file_binary", { path });
}

export async function fsWriteFile(
  path: string,
  content: string,
): Promise<void> {
  return invoke("fs_write_file", { path, content });
}

export async function fsStat(path: string): Promise<FileInfo> {
  return invoke<FileInfo>("fs_stat", { path });
}

export async function fsCreateDir(path: string): Promise<void> {
  return invoke("fs_create_dir", { path });
}

export async function fsRemove(path: string): Promise<void> {
  return invoke("fs_remove", { path });
}

export async function fsRename(oldPath: string, newPath: string): Promise<void> {
  return invoke("fs_rename", { oldPath, newPath });
}

export async function getDefaultShell(): Promise<string> {
  return invoke<string>("get_default_shell");
}

export async function workspaceLoad(cwd: string): Promise<string | null> {
  return invoke<string | null>("workspace_load", { cwd });
}

export async function workspaceSave(
  cwd: string,
  state: string,
): Promise<void> {
  return invoke("workspace_save", { cwd, state });
}

export async function configLoad(): Promise<string | null> {
  return invoke<string | null>("config_load");
}

export async function configSave(config: string): Promise<void> {
  return invoke("config_save", { config });
}

export const getProcessArgs = async (): Promise<string[]> => {
  return await invoke("get_process_args");
};

export const getProcessCwd = async (): Promise<string> => {
  return await invoke("get_current_dir");
};

export async function windowStartDrag(): Promise<void> {
  return invoke("window_start_drag");
}

export async function windowMinimize(): Promise<void> {
  return invoke("window_minimize");
}

export async function windowToggleMaximize(): Promise<void> {
  return invoke("window_toggle_maximize");
}

export async function windowClose(): Promise<void> {
  return invoke("window_close");
}

export function onPTYData(
  id: string,
  callback: (data: PTYData) => void,
): Promise<UnlistenFn> {
  return listen<PTYData>(`pty:${id}:data`, (event) => callback(event.payload));
}

export function onPTYExit(
  id: string,
  callback: (exit: PTYExit) => void,
): Promise<UnlistenFn> {
  return listen<PTYExit>(`pty:${id}:exit`, (event) => callback(event.payload));
}

export function onPTYError(
  id: string,
  callback: (error: PTYError) => void,
): Promise<UnlistenFn> {
  return listen<PTYError>(`pty:${id}:error`, (event) =>
    callback(event.payload),
  );
}
