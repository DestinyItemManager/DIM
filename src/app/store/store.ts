import { applyMiddleware, createStore, compose } from 'redux';
import allReducers, { RootState } from './reducers';
import thunk from 'redux-thunk';
import { getType } from 'typesafe-actions';
import { update } from '../inventory/actions';

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__(options: any): typeof compose;
  }
}

const composeEnhancers =
  typeof window === 'object' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
    ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
        serialize: false,
        actionsBlacklist: [getType(update)],
        stateSanitizer: (state: RootState) =>
          state.inventory ? { ...state, inventory: '<<EXCLUDED>>' } : state
      })
    : compose;

const store = createStore<RootState, any, {}, {}>(
  allReducers,
  composeEnhancers(applyMiddleware(thunk))
);

export default store;
