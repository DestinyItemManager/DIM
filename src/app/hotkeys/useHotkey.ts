import { useEffect, useId } from 'react';
import { Hotkey, registerHotkeys, removeHotkeysById } from './hotkeys';

/**
 * A hook for registering a single global hotkey that will appear in the hotkey
 * help screen. Make sure to memoize the callback. Hotkeys registered in this
 * way take precedence over any previously registered hotkeys for the same
 * combos, and can likewise be overridden by a later registration. However, once
 * the later registration is unregistered, these will become active again. For
 * example, if you have a sequence of sheets that open one after another, each
 * one can register an "esc" callback, and they'll dismiss one by one in order
 * as the user hits "esc."
 *
 * @example
 * useHotkey("ctrl+alt+1", "Does a thing", useCallback(() => setThing(1), [setThing]));
 */
export function useHotkey(
  combo: string,
  description: string,
  callback: (event: KeyboardEvent) => void,
  disabled?: boolean,
) {
  const id = useId();
  useEffect(() => {
    if (disabled) {
      removeHotkeysById(id, combo);
      return;
    }
    registerHotkeys(id, [
      {
        combo,
        description,
        callback,
      },
    ]);
  }, [id, combo, description, callback, disabled]);

  // Remove the hotkey only once the component unmounts
  useEffect(() => () => removeHotkeysById(id, combo), [combo, id]);
}

/**
 * A hook for registering a dynamic list of global hotkeys that will appear in the hotkey help screen. Prefer useHotkey if you can.
 *
 * You should memoize the list of hotkeys with `useMemo`.
 *
 * @see {@link useHotkey}
 */
export function useHotkeys(hotkeyDefs: Hotkey[]) {
  const id = useId();
  useEffect(() => registerHotkeys(id, hotkeyDefs), [hotkeyDefs, id]);

  // Remove the hotkeys only once the component unmounts
  useEffect(() => () => removeHotkeysById(id), [id]);
}
