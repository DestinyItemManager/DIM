const angular = require('angular');

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
  'pascalprecht.translate'
]);
