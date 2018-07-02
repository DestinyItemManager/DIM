import {
  applyMiddleware,
  createStore,
  compose
} from 'redux';
import allReducers, { initialState } from './reducers';

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__: typeof compose;
  }
}

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const store = createStore(
  allReducers,
  initialState,
  composeEnhancers(
    applyMiddleware(
    )
  )
);

export default store;
