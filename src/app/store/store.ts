import { applyMiddleware, createStore, compose } from 'redux';
import allReducers from './reducers';

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__(options: any): typeof compose;
  }
}

const composeEnhancers =
  typeof window === 'object' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
    ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({ serialize: false })
    : compose;
const store = createStore(
  allReducers,
  composeEnhancers(
    applyMiddleware()
    // TODO: No middleware yet, but we'll probably use redux-saga and maybe redux-thunk here
  )
);

export default store;
