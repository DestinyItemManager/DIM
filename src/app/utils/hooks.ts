import { useEffect } from 'react';
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
