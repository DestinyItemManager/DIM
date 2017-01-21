import angular from 'angular';

import config from './dimApp.config';
import routes from './dimApp.routes';

import run from './dimApp.run';

import featureFlags from './feature-flags';
import state from './state';

import loadingTracker from './services/dimLoadingTracker.factory';

// Declare all of the external angular dependencies first
require('angular-aria');
require('angular-chrome-storage/angular-chrome-storage');
require('angular-hotkeys');
require('angular-messages');
require('angular-moment');
require('angular-native-dragdrop');
require('angular-promise-tracker');
require('angular-timer');
require('angular-translate');
require('angular-translate-interpolation-messageformat');
require('angular-ui-router');
require('angular-uuid2/dist/angular-uuid2.js');
require('angularjs-slider');
require('angularjs-toaster');
require('ng-dialog');
require('ng-http-rate-limiter');
require('angular-local-storage');

angular.module('dimApp', [
  'ui.router',
  'timer',
  'ngAria',
  'ngDialog',
  'ngMessages',
  'ang-drag-drop',
  'angularUUID2',
  'toaster',
  'ajoslin.promise-tracker',
  'cfp.hotkeys',
  'rzModule',
  'ngHttpRateLimiter',
  'pascalprecht.translate',
  'dim-oauth',
  'LocalStorageModule'
])
  .config(config)
  .config(routes)
  .run(run)
  .value('dimFeatureFlags', featureFlags)
  .value('dimState', state)
  .factory('loadingTracker', loadingTracker);
