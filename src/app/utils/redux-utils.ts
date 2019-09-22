import { RootState } from '../store/reducers';
import store from '../store/store';

/**
 * Add an observer to a Redux store. Whenever the data selected by the selector parameter
 * changes, the onChange function will be called. This allows us to react to changes in the
 * store and update other things, such as saving to IndexedDB or updating CSS variables.
 */
export function observeStore<T>(
  select: (state: RootState) => T,
  onChange: (currentState: T, newState: T) => void
) {
  let currentState;

  function handleChange() {
    const nextState = select(store.getState());
    if (currentState !== nextState) {
      onChange(currentState, nextState);
      currentState = nextState;
    }
  }

  const unsubscribe = store.subscribe(handleChange);
  handleChange();
  return unsubscribe;
}
