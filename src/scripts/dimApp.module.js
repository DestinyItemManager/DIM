import angular from 'angular';
import aria from 'angular-aria';
import rateLimiter from 'ng-http-rate-limiter';
import dialog from 'ng-dialog';
import draganddrop from 'angular-native-dragdrop';
import localStorage from 'angular-local-storage';
import messages from 'angular-messages';
import moment from 'angular-moment';
import router from './blocks/router/router.module';
import slider from 'angularjs-slider';
import toaster from 'angularjs-toaster';
import translate from 'angular-translate';
import translateInterpolate from 'angular-translate-interpolation-messageformat';
import uiRouter from 'angular-ui-router';
import 'angular-hotkeys';
import 'angular-promise-tracker';
import 'angular-timer';
import 'angular-uuid2/dist/angular-uuid2.js';

import shell from './shell/dimShell.module';

import config from './dimApp.config';
import routes from './dimApp.routes';
import run from './dimApp.run';
import featureFlags from './feature-flags';
import state from './state';
import loadingTracker from './services/dimLoadingTracker.factory';

angular
  .module('dimApp', [
    aria,
    dialog,
    draganddrop,
    localStorage,
    messages,
    moment,
    rateLimiter,
    router,
    slider,
    toaster,
    translate,
    translateInterpolate,
    uiRouter,
    'timer',
    'angularUUID2',
    'ajoslin.promise-tracker',
    'cfp.hotkeys',
    'dim-oauth',
    shell
  ])
  .config(config)
  .run(routes)
  .run(run)
  .value('dimFeatureFlags', featureFlags)
  .value('dimState', state)
  .factory('loadingTracker', loadingTracker);