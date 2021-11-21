import { EventBus } from 'app/utils/observable';

export const refresh$ = new EventBus<undefined>();

export function refresh(e?: React.MouseEvent | KeyboardEvent) {
  // Individual pages should listen to this event and decide what to refresh,
  // and their services should decide how to cache/dedupe refreshes.
  // This event should *NOT* be listened to by services!
  if (e) {
    e.preventDefault();
  }
  refresh$.next(undefined);
}
