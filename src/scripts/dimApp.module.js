import angular from 'angular';

import ariaModule from 'angular-aria';
import dialogModule from 'ng-dialog';
import dragAndDropModule from 'angular-native-dragdrop';
import localStorageModule from 'angular-local-storage';
import messagesModule from 'angular-messages';
import momentModule from 'angular-moment';
import rateLimiterModule from 'ng-http-rate-limiter';
import sliderModule from 'angularjs-slider';
import toasterModule from 'angularjs-toaster';
import translateModule from 'angular-translate';
import translateMessageFormatModule from 'angular-translate-interpolation-messageformat';
import uiRouterModule from 'angular-ui-router';
import 'angular-hotkeys';
import 'angular-promise-tracker';
import 'angular-timer';
import 'angular-uuid2/dist/angular-uuid2.js';

import config from './dimApp.config';
import routes from './dimApp.routes';
import run from './dimApp.run';
import featureFlags from './feature-flags';
import loadingTracker from './services/dimLoadingTracker.factory';

const dimAppModule = angular
  .module('dimApp', [
    ariaModule,
    dialogModule,
    dragAndDropModule,
    localStorageModule,
    messagesModule,
    momentModule,
    rateLimiterModule,
    sliderModule,
    toasterModule,
    translateModule,
    translateMessageFormatModule,
    uiRouterModule,
    'timer',
    'angularUUID2',
    'ajoslin.promise-tracker',
    'cfp.hotkeys',
    'dim-oauth'
  ])
  .config(config)
  .config(routes)
  .run(run)
  .value('dimFeatureFlags', featureFlags)
  .factory('loadingTracker', loadingTracker)
  .name;

export default dimAppModule;