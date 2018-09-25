import { RootState } from './store/reducers';
import store from './store/store';

export function observeStore<T>(
  select: (state: RootState) => T,
  onChange: (currentState: T, newState: T) => void
) {
  let currentState;

  function handleChange() {
    // TODO: this can assume immutable now
    const nextState = select(store.getState());
    onChange(currentState, nextState);
    // tslint:disable-next-line:prefer-object-spread
    currentState = Object.assign({}, nextState);
  }

  const unsubscribe = store.subscribe(handleChange);
  handleChange();
  return unsubscribe;
}
