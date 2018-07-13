import {
  applyMiddleware,
  createStore,
  compose
} from 'redux';
import allReducers from './reducers';

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__(options: any): typeof compose;
  }
}

const composeEnhancers = typeof window === 'object' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
  ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({ serialize: false })
  : compose;
const store = createStore(
  allReducers,
  composeEnhancers(
    applyMiddleware(
    )
  )
);

export default store;
