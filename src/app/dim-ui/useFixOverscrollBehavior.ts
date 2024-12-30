import useResizeObserver from '@react-hook/resize-observer';

/*
 * There is a bug in all browsers where overflow-behavior does not apply when an
 * item that has overflow: auto is not tall enough to actually need to scroll.
 * In those cases, scrolling "chains" to the main viewport, leading to an effect
 * of touching the sheet but scrolling what's behind it. In the past we used
 * libraries like body-scroll-lock to fix this, but a more targeted fix is here.
 * We watch the size of the element, and if it's big enough to scroll we turn on
 * overflow: auto. If they're not, we have to turn them to overflow: hidden so
 * they no longer count as a user-scrollable item. For this to work, the initial
 * styles must also start with overflow: hidden or overflow: auto, or else we
 * can't tell if we are overflowing the container initially. Also - if we have
 * -webkit-overflow-scrolling: touch, we get unwanted scroll chaining. But the
 * original reason to have that (native-style scrolling) is the default now. See
 * https://github.com/w3c/csswg-drafts/issues/3349#issuecomment-492721871 and
 * https://bugs.chromium.org/p/chromium/issues/detail?id=813094
 */
export function useFixOverscrollBehavior(ref: React.RefObject<HTMLElement | null>) {
  useResizeObserver(ref, (entry) => {
    const elem = entry.target as HTMLElement;
    if (elem.scrollHeight > elem.clientHeight) {
      // Scrollable contents
      elem.style.overflowY = 'auto';
      elem.style.touchAction = '';
    } else {
      // Non-scrollable contents
      elem.style.overflowY = 'hidden';
      elem.style.touchAction = 'none';
    }
  });
}
