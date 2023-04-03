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
  // these elements are prevented by the default Mousetrap.stopCallback():
  const preventIn = ['INPUT', 'SELECT', 'TEXTAREA'];

  // if callback is defined, then wrap it in a function
  // that checks if the event originated from a form element.
  // the function blocks the callback from executing unless the element is specified
  // in allowIn (emulates Mousetrap.stopCallback() on a per-key level)
  // save the original callback
  const _callback = hotkey.callback;

  // create the new wrapper callback
  const callback = (event: KeyboardEvent) => {
    let shouldExecute = true;

    // if the callback is executed directly `hotkey.get('w').callback()`
    // there will be no event, so just execute the callback.
    if (event) {
      const target = (event.target || event.srcElement!) as Element | undefined; // srcElement is IE only
      const nodeName = target?.nodeName.toUpperCase();

      // check if the input has a mousetrap class, and skip checking preventIn if so
      if (target?.classList.contains('mousetrap')) {
        shouldExecute = true;
      } else {
        // don't execute callback if the event was fired from inside an element listed in preventIn
        for (const prevent of preventIn) {
          if (prevent === nodeName) {
            shouldExecute = false;
            break;
          }
        }
      }
    }

    if (shouldExecute) {
      _callback(event);
    }
  };

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

// TODO: replace mousetrap?

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
};

/**
 * loop through the f keys, f1 to f19 and add them to the map
 * programatically
 */
for (let i = 1; i < 20; ++i) {
  _MAP[111 + i] = 'f' + i;
}

/**
 * loop through to map numbers on the numeric keypad
 */
for (let i = 0; i <= 9; ++i) {
  // This needs to use a string cause otherwise since 0 is falsey
  // mousetrap will never fire for numpad 0 pressed as part of a keydown
  // event.
  //
  // @see https://github.com/ccampbell/mousetrap/pull/258
  _MAP[i + 96] = i.toString();
}

/**
 * mapping for special characters so they can support
 *
 * this dictionary is only used incase you want to bind a
 * keyup or keydown event to one of these keys
 *
 * @type {Object}
 */
const _KEYCODE_MAP: { [code: number]: string } = {
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

function handleKeyEvent(e: KeyboardEvent) {
  if (
    e.isComposing ||
    e.repeat ||
    (e.target instanceof HTMLElement &&
      (e.target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)))
  ) {
    return;
  }

  const combo = new Set();
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

  // Try the keycode version, which works for stuff like Shift+1
  const character =
    _MAP[e.which] ?? _KEYCODE_MAP[e.which] ?? String.fromCharCode(e.which).toLowerCase();
  const comboStr = [...combo, character].join('+');
  trigger(comboStr, e);

  // Then try the resolved key which works for stuff like ?. We don't need modifiers for that one.
  trigger(e.key, e);
}

export function trigger(comboStr: string, e: KeyboardEvent) {
  const callbacks = keyMap[comboStr];
  if (callbacks) {
    for (const callback of callbacks) {
      callback(e);
    }
  }
}

// document.addEventListener('keypress', handleKeyEvent);
document.addEventListener('keydown', handleKeyEvent);
