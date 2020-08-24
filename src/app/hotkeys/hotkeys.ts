import Mousetrap from 'mousetrap';
import _ from 'lodash';

// A unique ID generator
let componentId = 0;
export const getHotkeyId = () => componentId++;

const map = {
  command: '\u2318', // ⌘
  shift: '\u21E7', // ⇧
  left: '\u2190', // ←
  right: '\u2192', // →
  up: '\u2191', // ↑
  down: '\u2193', // ↓
  return: '\u23CE', // ⏎
  backspace: '\u232B', // ⌫
};

/**
 * Convert strings like cmd into symbols like ⌘
 */
function symbolize(combo: string) {
  const parts = combo.split('+');

  return parts
    .map((part) => {
      // try to resolve command / ctrl based on OS:
      if (part === 'mod') {
        part = window.navigator?.platform.indexOf('Mac') >= 0 ? 'command' : 'ctrl';
      }

      return map[part] || part;
    })
    .join(' + ');
}

function format(hotkey: Hotkey) {
  // Don't show all the possible key combos, just the first one.  Not sure
  // of usecase here, so open a ticket if my assumptions are wrong
  const combo = hotkey.combo;

  const sequence = combo.split(/[\s]/);
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
  callback(event: KeyboardEvent): void;
}

class HotkeyRegistry {
  private hotkeys: { [componentId: number]: Hotkey[] } = {};

  register(componentId: number, hotkeys: Hotkey[]) {
    if (hotkeys?.length) {
      hotkeys.forEach(installHotkey);
      this.hotkeys[componentId] = hotkeys;
    }
  }

  unregister(componentId: number) {
    if (this.hotkeys[componentId]) {
      for (const hotkey of this.hotkeys[componentId]) {
        Mousetrap.unbind(hotkey.combo);
      }
      delete this.hotkeys[componentId];
    }
  }

  getAllHotkeys() {
    const combos: { [combo: string]: string } = {};
    _.forIn(this.hotkeys, (hotkeys) => {
      for (const hotkey of hotkeys) {
        const combo = format(hotkey);
        combos[combo] = hotkey.description;
      }
    });
    return combos;
  }
}

const hotkeys = new HotkeyRegistry();
export default hotkeys;

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
      const target = (event.target || event.srcElement!) as Element; // srcElement is IE only
      const nodeName = target.nodeName.toUpperCase();

      // check if the input has a mousetrap class, and skip checking preventIn if so
      if (target.classList.contains('mousetrap')) {
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

  if (hotkey.action) {
    Mousetrap.bind(hotkey.combo, callback, hotkey.action);
  } else {
    Mousetrap.bind(hotkey.combo, callback);
  }
  return hotkey;
}
