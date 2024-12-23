import { Dispatch, isAction, Middleware, MiddlewareAPI } from 'redux';
import { createAction, createCustomAction, isActionOf } from 'typesafe-actions';
import { RootState } from './types';

export interface StoreObserver<T> {
  /**
   * A unique string for the observer, this must be globally unique.
   */
  id: string;
  /**
   * A custom equality function. It not provided Objest.is will be used.
   */
  equals?: (a: unknown, b: unknown) => boolean;
  /**
   * Whether the side effect should be run initially before any state changes are observed.
   */
  runInitially?: boolean;
  /**
   * Function to create "something" which will be used to determine if the side effect should run.
   * Object.is is used for equality by default, so if creating new objects or arrays, provide a
   * suitable equality function.
   */
  getObserved: (rootState: RootState) => T;
  /**
   * Runs the side effect providing both the previous and current version of the derived state.
   * When the `runInitially` flag is true, previous will be undefined on first run.
   */
  sideEffect: (states: { previous: T | undefined; current: T; rootState: RootState }) => void;
}

/**
 * This is needed as the typesafe actions library throws a validation error for the observe action
 * when created with `createCustomAction`.
 * See https://github.com/DestinyItemManager/DIM/pull/10195/files#r1438195519
 */
function isObserveAction(action: unknown): action is ReturnType<typeof observe> {
  return (
    typeof action === 'object' &&
    action !== null &&
    'type' in action &&
    action.type === 'observer/OBSERVE'
  );
}

// Need to user a higher order function to get the correct typings and inference, it will now correctly
// type the value of T based on what the getObserved returns
export const observe = <T>(storeObserver: StoreObserver<T>) =>
  createCustomAction('observer/OBSERVE', (storeObserver: StoreObserver<T>) => ({ storeObserver }))(
    storeObserver,
  );
export const unobserve = createAction('observer/UNOBSERVE')<string>();
export const clearObservers = createAction('observer/CLEAR_OBSERVERS')();

export function observerMiddleware<D extends Dispatch>(
  api: MiddlewareAPI<D, RootState>,
): ReturnType<Middleware> {
  const observers = new Map<string, StoreObserver<unknown>>();
  return (next) => (action) => {
    // Taken from the redux listener middleware, apparently some actions may not
    // be action objects, https://github.com/reduxjs/redux-toolkit/blob/0d1f7101e83865714cb512c850bc53ffaee2d5e5/packages/toolkit/src/listenerMiddleware/index.ts#L438-L440
    if (!isAction(action)) {
      return next(action);
    }

    if (isObserveAction(action)) {
      const { storeObserver } = action;
      observers.set(storeObserver.id, storeObserver);

      if (storeObserver.runInitially) {
        storeObserver.sideEffect({
          previous: undefined,
          current: storeObserver.getObserved(api.getState()),
          rootState: api.getState(),
        });
      }

      return;
    }

    if (isActionOf(unobserve, action)) {
      observers.delete(action.payload);
      return;
    }

    if (isActionOf(clearObservers, action)) {
      observers.clear();
      return;
    }

    const previousRootState = api.getState();
    // Forward the state model so that we can compare and look for changes.
    const result = next(action);
    const currentRootState = api.getState();

    for (const [_id, observer] of observers) {
      // Grab the slice or derivation the given observer cares about.
      const previous = observer.getObserved(previousRootState);
      const current = observer.getObserved(currentRootState);
      const equals = observer.equals || Object.is;
      if (!equals(previous, current)) {
        observer.sideEffect({ previous, current, rootState: currentRootState });
      }
    }

    return result;
  };
}
