import _ from 'lodash';
import { isNativeDragAndDropSupported, isiOSBrowser } from './utils/browsers';

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
    window.addEventListener('testPassive', _.noop, opts);
    window.removeEventListener('testPassive', _.noop, opts);
  } catch (e) {}

  supportsPassive
    ? window.addEventListener('touchmove', _.noop, { passive: false })
    : window.addEventListener('touchmove', _.noop);
}
