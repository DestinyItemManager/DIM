import { Hotkey } from './hotkeys';
import { useHotkeys } from './useHotkey';

/**
 * Used to install global hotkeys that do not require focus and are included in the hotkey cheat sheet.
 * Prefer useHotkey or useHotkeys hooks.
 */
export default function GlobalHotkeys({ hotkeys: hotkeyDefs }: { hotkeys: Hotkey[] }) {
  useHotkeys(hotkeyDefs);
  return null;
}
