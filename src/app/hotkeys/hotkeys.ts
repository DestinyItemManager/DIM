import { I18nKey, t, tl } from 'app/i18next-t';
import { isMac } from 'app/utils/browsers';
import { compareByIndex } from 'app/utils/comparators';
import { noop } from 'app/utils/functions';
import { StringLookup } from 'app/utils/util-types';

/** Mapping from key name to fun symbols */
const map: StringLookup<string> = {
  command: '\u2318', // ⌘
  shift: '\u21E7', // ⇧
  left: '\u2190', // ←
  right: '\u2192', // →
  up: '\u2191', // ↑
  down: '\u2193', // ↓
  return: '\u23CE', // ⏎
  backspace: '\u232B', // ⌫
};

/** We translate the keys that don't have fun symbols. */
const keyi18n: StringLookup<I18nKey> = {
  tab: tl('Hotkey.Tab'),
  enter: tl('Hotkey.Enter'),
};

/**
 * Convert strings like cmd into symbols like ⌘
 */
export function symbolize(combo: string) {
  const parts = combo.split('+');

  return parts
    .map((part) => {
      // try to resolve command / ctrl based on OS:
      if (part === 'mod') {
        part = isMac() ? 'command' : 'ctrl';
      }

      return keyi18n[part] ? t(keyi18n[part]!) : map[part] || part.toUpperCase();
    })
    .join(' ');
}

export interface Hotkey {
  /** The actual hotkey combo, like "shift+p" */
  combo: string;
  /** A description that'll be shown on the hotkey help screen. */
  description: string;
  /** What to do when the hotkey is triggered. */
  callback: (event: KeyboardEvent) => void;
}

// Each key combo can have many hotkey implementations bound to it, but only the
// last one in the array gets triggered.
const keyMap: { [combo: string]: undefined | (Hotkey & { id: string })[] } = {};

export function clearAllHotkeysForTest() {
  for (const key of Object.keys(keyMap)) {
    delete keyMap[key];
  }
}

/**
 * Add a new set of hotkeys. The id parameter allows us to preserve this hotkey
 * in the stack of bindings for the hotkey even when repeatedly registered - use
 * the useId hook to generate a stable ID for a component to use for this. Call
 * removeHotkeysById when a component is unmounted or the hotkey is disabled.
 */
export function registerHotkeys(id: string, hotkeys: Hotkey[]) {
  if (!hotkeys?.length) {
    return noop;
  }
  for (const hotkey of hotkeys) {
    bind(id, hotkey);
  }
}

/**
 * Remove bound hotkeys from the stack by id. This should be the same ID the
 * hotkey was registered under. Pass combo if you know it to speed up removal.
 */
export function removeHotkeysById(id: string, combo?: string) {
  if (combo) {
    unbind(id, combo);
  } else {
    // Look for the ID in every combo
    for (const combo of Object.keys(keyMap)) {
      unbind(id, combo);
    }
  }
}

export function getAllHotkeys() {
  const combos: { [combo: string]: string } = {};
  for (const k in keyMap) {
    const hotkeyList = keyMap[k]!;
    const hotkey = hotkeyList.at(-1)!;
    const combo = symbolize(hotkey.combo);
    combos[combo] = hotkey.description;
  }
  return combos;
}

const modifiers = ['ctrl', 'alt', 'shift', 'meta'];
function normalizeCombo(combo: string) {
  return combo
    .split('+')
    .map((c) => (c === 'mod' ? (isMac() ? 'meta' : 'ctrl') : c))
    .sort(compareByIndex(modifiers, (c) => c))
    .join('+');
}

function bind(id: string, hotkey: Hotkey) {
  const keys = (keyMap[normalizeCombo(hotkey.combo)] ??= []);
  // Replace existing hotkeys in the same place in the stack, so re-renders
  // don't pop the hotkey to the top.
  const existingIndex = keys.findIndex((h) => h.id === id);
  if (existingIndex >= 0) {
    keys[existingIndex] = { ...hotkey, id };
  } else {
    keys.push({ ...hotkey, id });
  }
}

function unbind(id: string, combo: string) {
  const normalizedCombo = normalizeCombo(combo);
  const hotkeysForCombo = keyMap[normalizedCombo];
  const existingIndex = hotkeysForCombo?.findIndex((h) => h.id === id) ?? -1;
  if (existingIndex >= 0) {
    hotkeysForCombo!.splice(existingIndex, 1);
  }
  if (!hotkeysForCombo?.length) {
    delete keyMap[normalizedCombo];
  }
}

const _MAP: { [code: number]: string } = {
  8: 'backspace',
  9: 'tab',
  13: 'enter',
  16: 'shift',
  17: 'ctrl',
  18: 'alt',
  20: 'capslock',
  27: 'esc',
  32: 'space',
  33: 'pageup',
  34: 'pagedown',
  35: 'end',
  36: 'home',
  37: 'left',
  38: 'up',
  39: 'right',
  40: 'down',
  45: 'ins',
  46: 'del',
  91: 'meta',
  93: 'meta',
  224: 'meta',
  106: '*',
  107: '+',
  109: '-',
  110: '.',
  111: '/',
  186: ';',
  187: '=',
  188: ',',
  189: '-',
  190: '.',
  191: '/',
  192: '`',
  219: '[',
  220: '\\',
  221: ']',
  222: "'",
};

/**
 * A list of hotkeys that should not be blocked even when a
 * form control is focused.
 */
const allowedKeysInFormControls = ['Escape'];

// Add in the number keys
for (let i = 0; i <= 9; ++i) {
  // This needs to use a string cause otherwise since 0 is falsey
  // mousetrap will never fire for numpad 0 pressed as part of a keydown
  // event.
  //
  // @see https://github.com/ccampbell/mousetrap/pull/258
  _MAP[i + 96] = i.toString();
}

function handleKeyEvent(e: KeyboardEvent) {
  /**
   * By default, we block custom hotkeys to prevent overriding built-in input
   * hotkeys. However, certain custom hotkeys should be allowed even when a
   * form control is focused. For example, pressing Escape inside of a sheet
   * should always close the sheet, even if an input in the sheet is focused.
   */
  const blockHotKeyInFormControl =
    e.target instanceof HTMLElement &&
    (e.target.isContentEditable ||
      (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) &&
        (e.target as HTMLInputElement).type !== 'checkbox')) &&
    !allowedKeysInFormControls.includes(e.key);

  if (e.isComposing || e.repeat || blockHotKeyInFormControl) {
    return;
  }

  const combo = new Set<string>();
  if (e.ctrlKey && e.key !== 'ctrl') {
    combo.add('ctrl');
  }
  if (e.altKey && e.key !== 'alt') {
    combo.add('alt');
  }
  if (e.shiftKey && e.key !== 'shift') {
    combo.add('shift');
  }
  if (e.metaKey && e.key !== 'meta') {
    combo.add('meta');
  }

  // This works for stuff like Shift+1
  const character = _MAP[e.which] ?? String.fromCharCode(e.which).toLowerCase();
  combo.add(character);
  const comboStr = [...combo].join('+');
  if (trigger(comboStr, e)) {
    return;
  }

  // Then try the resolved key which works for stuff like ?. We don't need modifiers for that one.
  combo.delete('shift');
  combo.delete(character);
  combo.add(e.key);
  const comboStr2 = [...combo].join('+');
  trigger(comboStr2, e);
}

function trigger(comboStr: string, e: KeyboardEvent) {
  const callbacks = keyMap[comboStr];
  if (callbacks) {
    // Only call the last callback registered for this combo.
    callbacks.at(-1)?.callback(e);
    e.preventDefault();
    return true;
  }
  return false;
}

document.addEventListener('keydown', handleKeyEvent);
