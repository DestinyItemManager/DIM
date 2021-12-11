import { applyMiddleware, compose, createStore } from 'redux';
import thunk from 'redux-thunk';
import allReducers from './reducers';
import { RootState } from './types';

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__(options: any): typeof compose;
  }
}

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
  ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
      serialize: false,
      actionsBlacklist: ['inventory/UPDATE', 'manifest/D1', 'manifest/D2'],
      stateSanitizer: (state: RootState) =>
        state.inventory ? { ...state, inventory: '<<EXCLUDED>>', manifest: '<<EXCLUDED>>' } : state,
    })
  : compose;

const store = createStore<RootState, any, {}, {}>(
  allReducers,
  composeEnhancers(applyMiddleware(thunk))
);

// Allow hot-reloading reducers
if (module.hot) {
  module.hot.accept('./reducers', () => {
    store.replaceReducer(allReducers);
  });
}

export default store;
