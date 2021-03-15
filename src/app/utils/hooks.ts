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
