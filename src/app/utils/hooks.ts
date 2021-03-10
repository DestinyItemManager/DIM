import { useEffect, useState } from 'react';
import { EventBus, Observable } from './observable';

/**
 * Subscribe to an EventBus. Use useCallback on the subscribeFn to prevent it
 * changing on every render.
 */
export function useEventBusListener<T>(
  eventBus: EventBus<T> | Observable<T>,
  subscribeFn: (value: T) => void
) {
  useEffect(() => eventBus.subscribe(subscribeFn), [eventBus, subscribeFn]);
}

/**
 * Returns whether the shift key is held down (ignores focus)
 */
export function useShiftHeld() {
  const [shiftHeld, setShiftHeld] = useState(false);
  useEffect(() => {
    const shiftTrue = (e) => {
      e.shiftKey && setShiftHeld(true);
    };
    const shiftFalse = (e) => {
      !e.shiftKey && setShiftHeld(false);
    };
    document.addEventListener('keydown', shiftTrue);
    document.addEventListener('keyup', shiftFalse);
    return () => {
      document.removeEventListener('keydown', shiftTrue);
      document.removeEventListener('keyup', shiftFalse);
    };
  }, []);

  return shiftHeld;
}

/**
 * A hook version of ClickOutside - fires an event when an element outside of `ref` is clicked.
 *
 * You probably want to useCallback around the onClickOutside handler.
 */
export function useClickOutside(
  ref: React.RefObject<HTMLElement>,
  onClickOutside: (e: MouseEvent) => void,
  /** An optional second ref that will be excluded from being considered "outside". This is good for preventing the triggering button from double-counting clicks. */
  extraRef?: React.RefObject<HTMLElement>
) {
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        if (!extraRef?.current || !extraRef.current.contains(event.target as Node)) {
          onClickOutside(event);
        }
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [ref, onClickOutside, extraRef]);
}
