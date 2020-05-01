import { applyMiddleware, createStore, compose } from 'redux';
import allReducers, { RootState } from './reducers';
import thunk from 'redux-thunk';
import { getType } from 'typesafe-actions';
import { update } from '../inventory/actions';
import { setD1Manifest, setD2Manifest } from '../manifest/actions';
import { createBrowserHistory } from 'history';
import { routerMiddleware } from 'connected-react-router';

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__(options: any): typeof compose; // eslint-disable-line no-undef
  }
}

export const history = createBrowserHistory();

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
  ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
      serialize: false,
      actionsBlacklist: [getType(update), getType(setD1Manifest), getType(setD2Manifest)],
      stateSanitizer: (state: RootState) =>
        state.inventory ? { ...state, inventory: '<<EXCLUDED>>', manifest: '<<EXCLUDED>>' } : state
    })
  : compose;

const store = createStore<RootState, any, {}, {}>(
  allReducers(history),
  composeEnhancers(applyMiddleware(routerMiddleware(history), thunk))
);

// Allow hot-reloading reducers
if (module.hot) {
  module.hot.accept('./reducers', () => {
    store.replaceReducer(allReducers(history));
  });
}

export default store;
