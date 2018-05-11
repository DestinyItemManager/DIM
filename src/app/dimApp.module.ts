import { module } from 'angular';

import AriaModule from 'angular-aria';
import 'ng-dialog';
import DragAndDropModule from 'angular-native-dragdrop';

import MessagesModule from 'angular-messages';
import TouchModule from 'angular-touch';

import 'angularjs-slider';
import ToasterModule from 'angularjs-toaster';
import UIRouterModule from '@uirouter/angularjs';
import ngI18Next from 'ng-i18next';
import 'angular-hotkeys';
import 'angular-promise-tracker';
import ocLazyLoadModule from 'oclazyload';
import 'ngimport';
import ngimportMoreModule from './ngimport-more';
import ngSanitize from 'angular-sanitize';

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
import whatsNewModule from './whats-new/whats-new.module';

import config from './dimApp.config';
import routes from './dimApp.routes';
import run from './dimApp.run';

const dependencies = [
  AriaModule,
  DragAndDropModule,
  MessagesModule,
  TouchModule,
  ngI18Next,
  ngSanitize,
  ocLazyLoadModule,
  ShellModule,
  'rzModule',
  ToasterModule,
  UIRouterModule,
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
  whatsNewModule,
  'ajoslin.promise-tracker',
  'cfp.hotkeys',
  'bcherny/ngimport',
  'ngDialog',
  ngimportMoreModule
];

if ($DIM_FLAVOR === 'dev') {
  // tslint:disable-next-line
  dependencies.push(require('./developer/developer.module').default);
}

if ($featureFlags.sentry) {
  // tslint:disable-next-line
  dependencies.push(require('raven-js/plugins/angular').moduleName);
}

export const DimAppModule = module('dimApp', dependencies)
  .config(config)
  .config(routes)
  .run(run)
  .name;
