import { RootState } from './store/reducers';
import store from './store/store';

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
