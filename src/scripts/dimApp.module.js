import angular from 'angular';

import AriaModule from 'angular-aria';
import DialogModule from 'ng-dialog';
import DragAndDropModule from 'angular-native-dragdrop';
import MessagesModule from 'angular-messages';
import RateLimiterModule from 'ng-http-rate-limiter';
import SliderModule from 'angularjs-slider';
import ToasterModule from 'angularjs-toaster';
import TranslateModule from 'angular-translate';
import TranslateMessageFormatModule from 'angular-translate-interpolation-messageformat';
import UIRouterModule from '@uirouter/angularjs';
import 'angular-hotkeys';
import 'angular-promise-tracker';

import bungieApiModule from './bungie-api/bungie-api.module';
import accountsModule from './accounts/accounts.module';
import { ShellModule } from './shell/shell.module';
import inventoryModule from './store/inventory.module';
import recordBooksModule from './record-books/record-books.module';
import activitiesModule from './activities/activities.module';
import vendorsModule from './vendors/vendors.module';
import itemReviewModule from './item-review/item-review.module';
import loadoutBuilderModule from './loadout-builder/loadout-builder.module';
import loginModule from './login/login.module';
import compareModule from './compare/compare.module';
import infuseModule from './infuse/infuse.module';
import farmingModule from './farming/farming.module';
import settingsModule from './settings/settings.module';
import oauthModule from './oauth/oauth.module';
import storageModule from './storage/storage.module';

import config from './dimApp.config';
import routes from './dimApp.routes';
import run from './dimApp.run';
import state from './state';
import loadingTracker from './services/dimLoadingTracker.factory';

const dependencies = [
  AriaModule,
  DialogModule,
  DragAndDropModule,
  MessagesModule,
  RateLimiterModule,
  ShellModule,
  SliderModule,
  ToasterModule,
  TranslateModule,
  TranslateMessageFormatModule,
  UIRouterModule,
  bungieApiModule,
  accountsModule,
  inventoryModule,
  recordBooksModule,
  activitiesModule,
  vendorsModule,
  itemReviewModule,
  loadoutBuilderModule,
  loginModule,
  compareModule,
  infuseModule,
  farmingModule,
  settingsModule,
  oauthModule,
  storageModule,
  'ajoslin.promise-tracker',
  'cfp.hotkeys'
];

if ($DIM_FLAVOR === 'dev') {
  dependencies.push(require('./developer/developer.module').default);
}

export const DimAppModule = angular
  .module('dimApp', dependencies)
  .config(config)
  .config(routes)
  .run(run)
  .value('dimState', state)
  .factory('loadingTracker', loadingTracker)
  .name;
