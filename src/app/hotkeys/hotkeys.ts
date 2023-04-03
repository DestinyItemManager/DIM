import { t, tl } from 'app/i18next-t';
import { StringLookup } from 'app/utils/util-types';
import Mousetrap from 'mousetrap';

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
        part = window.navigator?.platform.includes('Mac') ? 'command' : 'ctrl';
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
  action?: 'keypress' | 'keydown' | 'keyup';
  allowIn?: string[];
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

  // remove anything from preventIn that's present in allowIn
  if (hotkey.allowIn) {
    let index;
    for (let i = 0; i < hotkey.allowIn.length; i++) {
      hotkey.allowIn[i] = hotkey.allowIn[i].toUpperCase();
      index = preventIn.indexOf(hotkey.allowIn[i]);
      if (index !== -1) {
        preventIn.splice(index, 1);
      }
    }
  }

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
    Mousetrap.unbind(hotkey.combo);
  }
  // Move it to the end of the list
  const alreadyThereIndex = existingHotkeysForCombo.indexOf(hotkey);
  if (alreadyThereIndex >= 0) {
    existingHotkeysForCombo.splice(alreadyThereIndex, 1);
  }
  existingHotkeysForCombo.push(hotkey);

  if (hotkey.action) {
    Mousetrap.bind(hotkey.combo, callback, hotkey.action);
  } else {
    Mousetrap.bind(hotkey.combo, callback);
  }
  return hotkey;
}

function uninstallHotkey(hotkey: Hotkey) {
  Mousetrap.unbind(hotkey.combo);
  const allHotkeysForCombo = hotkeysByCombo[hotkey.combo]!;
  allHotkeysForCombo?.pop();
  if (allHotkeysForCombo.length) {
    installHotkey(allHotkeysForCombo[allHotkeysForCombo.length - 1]);
  } else {
    delete hotkeysByCombo[hotkey.combo];
  }
}

// TODO: replace mousetrap?
