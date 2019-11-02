import _ from 'lodash';

// https://github.com/timruffles/mobile-drag-drop/issues/77
// https://github.com/timruffles/mobile-drag-drop/issues/124
export function safariTouchFix() {
  // Test via a getter in the options object to see if the passive property is accessed
  let supportsPassive = false;
  try {
    const opts = Object.defineProperty({}, 'passive', {
      get() {
        supportsPassive = true;
        return supportsPassive;
      }
    });
    window.addEventListener('testPassive', _.noop, opts);
    window.removeEventListener('testPassive', _.noop, opts);
    // tslint:disable-next-line:no-empty
  } catch (e) {}

  supportsPassive
    ? window.addEventListener('touchmove', _.noop, { passive: false })
    : window.addEventListener('touchmove', _.noop);
}
