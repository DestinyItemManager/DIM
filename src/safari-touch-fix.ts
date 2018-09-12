// https://github.com/timruffles/mobile-drag-drop/issues/77
// https://github.com/timruffles/mobile-drag-drop/issues/124
export function safariTouchFix() {
  const noop = () => {
    return;
  };

  // Test via a getter in the options object to see if the passive property is accessed
  let supportsPassive = false;
  try {
    const opts = Object.defineProperty({}, 'passive', {
      get() {
        supportsPassive = true;
      }
    });
    window.addEventListener('testPassive', noop, opts);
    window.removeEventListener('testPassive', noop, opts);
    // tslint:disable-next-line:no-empty
  } catch (e) {}

  supportsPassive
    ? window.addEventListener('touchmove', noop, { passive: false })
    : window.addEventListener('touchmove', noop);
}
