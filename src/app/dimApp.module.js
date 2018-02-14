import angular from 'angular';

import AriaModule from 'angular-aria';
import DialogModule from 'ng-dialog';
import DragAndDropModule from 'angular-native-dragdrop';
import ngSanitize from 'angular-sanitize';

import MessagesModule from 'angular-messages';
import TouchModule from 'angular-touch';

import RateLimiterModule from 'ng-http-rate-limiter';
import SliderModule from 'angularjs-slider';
import ToasterModule from 'angularjs-toaster';
import UIRouterModule from '@uirouter/angularjs';
import ngI18Next from 'ng-i18next';
import 'angular-hotkeys';
import 'angular-promise-tracker';
import ocLazyLoadModule from 'oclazyload';
import 'ngimport';

import accountsModule from './accounts/accounts.module';
import { ShellModule } from './shell/shell.module';
import inventoryModule from './inventory/inventory.module';
import itemReviewModule from './item-review/item-review.module';
import loginModule from './login/login.module';
import compareModule from './compare/compare.module';
import infuseModule from './infuse/infuse.module';
import farmingModule from './farming/farming.module';
import settingsModule from './settings/settings.module';
import oauthModule from './oauth/oauth.module';
import storageModule from './storage/storage.module';
import loadoutModule from './loadout/loadout.module';
import movePopupModule from './move-popup/move-popup.module';
import searchModule from './search/search.module';
import destiny2Module from './destiny2/destiny2.module';
import { progressModule } from './progress/progress.module';

import config from './dimApp.config';
import routes from './dimApp.routes';
import run from './dimApp.run';
import loadingTracker from './services/dimLoadingTracker.factory';

const dependencies = [
  AriaModule,
  DialogModule,
  DragAndDropModule,
  MessagesModule,
  TouchModule,
  ngI18Next,
  ocLazyLoadModule,
  ngSanitize,
  RateLimiterModule,
  ShellModule,
  SliderModule,
  ToasterModule,
  UIRouterModule,
  accountsModule,
  inventoryModule,
  itemReviewModule,
  loginModule,
  compareModule,
  infuseModule,
  farmingModule,
  settingsModule,
  oauthModule,
  storageModule,
  loadoutModule,
  movePopupModule,
  searchModule,
  destiny2Module,
  progressModule,
  'ajoslin.promise-tracker',
  'cfp.hotkeys',
  'bcherny/ngimport'
];

if ($DIM_FLAVOR === 'dev') {
  dependencies.push(require('./developer/developer.module').default);
}

if ($featureFlags.sentry) {
  dependencies.push(require('raven-js/plugins/angular').moduleName);
}

export const DimAppModule = angular
  .module('dimApp', dependencies)
  .config(config)
  .config(routes)
  .run(run)
  .factory('loadingTracker', loadingTracker)
  .name;
