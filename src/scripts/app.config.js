import { combineReducers } from 'redux';
import thunk from 'redux-thunk';
import platform from './shell/platform/platform.reducers';
import store from './store/store.reducers';

const rootReducer = combineReducers({
  platform,
  store
});

const config = function config($ngReduxProvider) {
  'ngInject';

  $ngReduxProvider.createStoreWith(rootReducer, [thunk]);
};

export default config;