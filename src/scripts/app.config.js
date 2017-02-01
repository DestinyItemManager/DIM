import { combineReducers } from 'redux';
import thunk from 'redux-thunk';
import { platforms, platform } from './shell/platform/platform.state';

const rootReducer = combineReducers({
  platforms,
  platform
});

export const config = function config($ngReduxProvider) {
  'ngInject';

  $ngReduxProvider.createStoreWith(rootReducer, [thunk]);
};