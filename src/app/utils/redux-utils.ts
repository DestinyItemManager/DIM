import { RootState } from 'app/store/types';
import store from '../store/store';

/**
 * Add an observer to a Redux store. Whenever the data selected by the selector parameter
 * changes, the onChange function will be called. This allows us to react to changes in the
 * store and update other things, such as saving to IndexedDB or updating CSS variables.
 */
export function observeStore<T>(
  select: (state: RootState) => T,
  onChange: (currentState: T, newState: T, state: RootState) => void
) {
  let currentState: T;

  function handleChange() {
    const state = store.getState();
    const nextState = select(state);
    if (currentState !== nextState) {
      onChange(currentState, nextState, state);
      currentState = nextState;
    }
  }

  const unsubscribe = store.subscribe(handleChange);
  handleChange();
  return unsubscribe;
}

/**
 * Turn a selector output from reselect's createSelector which depends on some input
 * other than state, into a function that produces a selector function based on that
 * input. This makes it nicer to use in useSelector.
 *
 * Example:
 *
 * const upperStoreIdSelector = createSelector(
 *   (state: RootState, storeId: string) => storeId,
 *   (storeId) => storeId.toUpperCase()
 * )
 *
 * // Hard to put into useSelector:
 * const upperStoreId = useSelector((state: RootState) => upperStoreIdSelector(state, storeId))
 *
 * const curriedUpperStoreIdSelector = currySelector(upperStoreIdSelector)
 *
 * // Nice:
 * const upperStoreId = useSelector(curriedUpperStoreIdSelector(storeId))
 */
export function currySelector<K, R>(
  selector: (state: RootState, props: K) => R
): (props: K) => (state: RootState) => R {
  return (props: K) => (state: RootState) => selector(state, props);
}
