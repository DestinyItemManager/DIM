import angular from 'angular';

import AriaModule from 'angular-aria';
import DialogModule from 'ng-dialog';
import DragAndDropModule from 'angular-native-dragdrop';
import ngSanitize from 'angular-sanitize';
import i18next from 'i18next';
import LocalStorageModule from 'angular-local-storage';
import MessagesModule from 'angular-messages';

import RateLimiterModule from 'ng-http-rate-limiter';
import SliderModule from 'angularjs-slider';
import ToasterModule from 'angularjs-toaster';
import UIRouterModule from '@uirouter/angularjs';
import 'ng-i18next';
import 'angular-hotkeys';
import 'angular-promise-tracker';
import 'angular-uuid2/dist/angular-uuid2.js';

import { ShellModule } from './shell/shell.module';
import inventoryModule from './store/inventory.module';
import recordBooksModule from './record-books/record-books.module';
import vendorsModule from './vendors/vendors.module';
import itemReviewModule from './item-review/item-review.module';
import loadoutBuilderModule from './loadout-builder/loadout-builder.module';
import oauthModule from './oauth/oauth.module';

import config from './dimApp.config';
import routes from './dimApp.routes';
import run from './dimApp.run';
import state from './state';
import loadingTracker from './services/dimLoadingTracker.factory';

export const DimAppModule = angular
  .module('dimApp', [
    AriaModule,
    DialogModule,
    DragAndDropModule,
    i18next,
    LocalStorageModule,
    MessagesModule,
    ngSanitize,
    RateLimiterModule,
    ShellModule,
    SliderModule,
    ToasterModule,
    UIRouterModule,
    inventoryModule,
    recordBooksModule,
    vendorsModule,
    itemReviewModule,
    loadoutBuilderModule,
    oauthModule,
    'angularUUID2',
    'ajoslin.promise-tracker',
    'cfp.hotkeys',
    'ng-i18next'
  ])
  .config(config)
  .config(routes)
  .run(run)
  .value('dimState', state)
  .factory('loadingTracker', loadingTracker)
  .name;
