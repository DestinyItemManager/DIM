import { useEffect, useState } from 'react';
import { Subscription } from 'rxjs';

/**
 * Subscribe to an Observable, unsubscribing on changes. Use
 * useCallback on the subscribeFn to prevent it changing on every
 * render.
 */
export function useSubscription(subscribeFn: () => Subscription) {
  useEffect(() => {
    const subscription = subscribeFn();
    return () => subscription.unsubscribe();
  }, [subscribeFn]);
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
