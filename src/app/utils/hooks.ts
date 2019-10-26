import { useEffect } from 'react';
import { Subscription } from 'rxjs';

export function useSubscription(subscribeFn: () => Subscription) {
  useEffect(() => {
    const subscription = subscribeFn();
    return () => subscription.unsubscribe();
  }, [subscribeFn]);
}
