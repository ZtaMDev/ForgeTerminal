export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(1)} ${units[i]}`;
}

export function truncatePath(path: string, maxLen: number): string {
  if (path.length <= maxLen) return path;
  const parts = path.split("\\");
  let result = "";
  for (let i = parts.length - 1; i >= 0; i--) {
    const candidate = i === parts.length - 1 ? parts[i] : `${parts[i]}\\${result}`;
    if (candidate.length > maxLen) {
      return i < parts.length - 1
        ? `...\\${result}`
        : `...\\${parts[i].slice(-maxLen + 4)}`;
    }
    result = candidate;
  }
  return result;
}
