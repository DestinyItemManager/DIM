import { combineReducers } from 'redux';
import thunk from 'redux-thunk';
import platform from './shell/platform/platform.reducers';

const rootReducer = combineReducers({
  platform
});

const config = function config($ngReduxProvider) {
  'ngInject';

  $ngReduxProvider.createStoreWith(rootReducer, [thunk]);
};

export default config;