import { t, tl } from 'app/i18next-t';
import { isMac } from 'app/utils/browsers';
import { compareBy } from 'app/utils/comparators';
import { StringLookup } from 'app/utils/util-types';

// A unique ID generator
let componentId = 0;
export const getHotkeyId = () => componentId++;

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

const keyi18n: StringLookup<string> = {
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

      return keyi18n[part] ? t(keyi18n[part]!) : map[part] || part;
    })
    .join(' ');
}

function format(hotkey: Hotkey) {
  // Don't show all the possible key combos, just the first one.  Not sure
  // of usecase here, so open a ticket if my assumptions are wrong
  const combo = hotkey.combo;

  const sequence = combo.split(/\s/);
  for (let i = 0; i < sequence.length; i++) {
    sequence[i] = symbolize(sequence[i]);
  }
  return sequence.join(' ');
}

export interface Hotkey {
  combo: string;
  description: string;
  callback: (event: KeyboardEvent) => void;
}

/**
 * A mapping from a unique identifier for a component (see getHotkeyId) to a
 * list of hotkey definitions associated with that component.
 */
const hotkeysByComponent: { [componentId: number]: Hotkey[] } = {};
// Only the last hotkey for any combo is currently valid
const hotkeysByCombo: { [combo: string]: Hotkey[] | undefined } = {};

/**
 * Add a new set of hotkeys. Returns an unregister function that
 * can be used to remove these bindings.
 */
export function registerHotkeys(hotkeys: Hotkey[]) {
  const componentId = getHotkeyId();
  if (hotkeys?.length) {
    for (const hotkey of hotkeys) {
      installHotkey(hotkey);
    }
    hotkeysByComponent[componentId] = hotkeys;
  }
  return () => unregister(componentId);
}

function unregister(componentId: number) {
  if (hotkeysByComponent[componentId]) {
    for (const hotkey of hotkeysByComponent[componentId]) {
      uninstallHotkey(hotkey);
    }
    delete hotkeysByComponent[componentId];
  }
}

export function getAllHotkeys() {
  const combos: { [combo: string]: string } = {};
  for (const hotkeyList of Object.values(hotkeysByComponent)) {
    for (const hotkey of hotkeyList) {
      const combo = format(hotkey);
      combos[combo] = hotkey.description;
    }
  }
  return combos;
}

// Add the actual key handler via MouseTrap.
function installHotkey(hotkey: Hotkey) {
  const callback = hotkey.callback;

  const existingHotkeysForCombo = (hotkeysByCombo[hotkey.combo] ??= []);
  if (existingHotkeysForCombo.length) {
    unbind(hotkey.combo);
  }
  // Move it to the end of the list
  const alreadyThereIndex = existingHotkeysForCombo.indexOf(hotkey);
  if (alreadyThereIndex >= 0) {
    existingHotkeysForCombo.splice(alreadyThereIndex, 1);
  }
  existingHotkeysForCombo.push(hotkey);

  bind(hotkey.combo, callback);
  return hotkey;
}

function uninstallHotkey(hotkey: Hotkey) {
  unbind(hotkey.combo);
  const allHotkeysForCombo = hotkeysByCombo[hotkey.combo]!;
  allHotkeysForCombo?.pop();
  if (allHotkeysForCombo.length) {
    installHotkey(allHotkeysForCombo[allHotkeysForCombo.length - 1]);
  } else {
    delete hotkeysByCombo[hotkey.combo];
  }
}

const keyMap: { [combo: string]: ((e: KeyboardEvent) => void)[] } = {};
const modifiers = ['ctrl', 'alt', 'shift', 'meta'];

function bind(combo: string, callback: (e: KeyboardEvent) => void) {
  const normalizedCombo = combo
    .split('+')
    .map((c) => (c === 'mod' ? (isMac() ? 'meta' : 'ctrl') : c))
    .sort(compareBy((c) => modifiers.indexOf(c) + 1 || 999))
    .join('+');
  (keyMap[normalizedCombo] ??= []).push(callback);
}

function unbind(combo: string) {
  delete keyMap[combo];
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
  if (
    e.isComposing ||
    e.repeat ||
    (e.target instanceof HTMLElement &&
      (e.target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)))
  ) {
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
  trigger(comboStr, e);

  /*
  // TODO: we don't need this unless we want shortcuts like ? or @.
  // Then try the resolved key which works for stuff like ?. We don't need modifiers for that one.
  combo.delete('shift');
  const comboStr2 = [...combo, e.key].join('+');
  trigger(comboStr2, e);
  */
}

function trigger(comboStr: string, e: KeyboardEvent) {
  const callbacks = keyMap[comboStr];
  if (callbacks) {
    // Only call the last callback registered for this combo.
    callbacks[callbacks.length - 1](e);
    return true;
  }
  return false;
}

document.addEventListener('keydown', handleKeyEvent);
