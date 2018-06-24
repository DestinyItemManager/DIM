import {
  applyMiddleware,
  createStore as reduxCreateStore,
  compose
} from 'redux';
import thunkMiddleware from 'redux-thunk';
import promiseMiddleware from 'redux-promise';
import allReducers, { initialState } from './reducers';

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__: typeof compose;
  }
}

function createStore() {
  const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
  return reduxCreateStore(
    allReducers,
    initialState,
    composeEnhancers(
      applyMiddleware(
        thunkMiddleware,
        promiseMiddleware
      )
    )
  );
}

const store = createStore();

export default store;
