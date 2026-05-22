let _active = false;

export function isPrefixActive(): boolean {
  return _active;
}

export function activatePrefix(): void {
  _active = true;
  document.dispatchEvent(new CustomEvent("prefix-mode-changed", { detail: { active: true } }));
}

export function deactivatePrefix(): void {
  if (!_active) return;
  _active = false;
  document.dispatchEvent(new CustomEvent("prefix-mode-changed", { detail: { active: false } }));
}

export function cancelPrefix(): void {
  if (!_active) return;
  _active = false;
  document.dispatchEvent(new CustomEvent("prefix-mode-changed", { detail: { active: false } }));
}
