import { isNativeDragAndDropSupported, isiOSBrowser } from './utils/browsers';
import { noop } from './utils/functions';

// This can likely be removed now, but definitely after we minimally support iOS 15
// https://github.com/timruffles/mobile-drag-drop/issues/77
// https://github.com/timruffles/mobile-drag-drop/issues/124
export function safariTouchFix() {
  if (!isiOSBrowser() || isNativeDragAndDropSupported()) {
    return;
  }

  // Test via a getter in the options object to see if the passive property is accessed
  let supportsPassive = false;
  try {
    const opts: AddEventListenerOptions = Object.defineProperty({}, 'passive', {
      get() {
        supportsPassive = true;
        return supportsPassive;
      },
    });
    window.addEventListener('testPassive', noop, opts);
    window.removeEventListener('testPassive', noop, opts);
  } catch {}

  supportsPassive
    ? window.addEventListener('touchmove', noop, { passive: false })
    : window.addEventListener('touchmove', noop);
}
