import { module } from 'angular';

import AriaModule from 'angular-aria';
import 'ng-dialog';
import DragAndDropModule from 'angular-native-dragdrop';

import 'angularjs-slider';
import ToasterModule from 'angularjs-toaster';
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
import compareModule from './compare/compare.module';
import infuseModule from './infuse/infuse.module';
import farmingModule from './farming/farming.module';
import oauthModule from './oauth/oauth.module';
import loadoutModule from './loadout/loadout.module';
import movePopupModule from './move-popup/move-popup.module';
import searchModule from './search/search.module';

import config from './dimApp.config';
import run from './dimApp.run';

const dependencies = [
  AriaModule,
  DragAndDropModule,
  ngI18Next,
  ngSanitize,
  ocLazyLoadModule,
  ShellModule,
  'rzModule',
  ToasterModule,
  inventoryModule,
  itemReviewModule,
  compareModule,
  infuseModule,
  farmingModule,
  oauthModule,
  loadoutModule,
  movePopupModule,
  searchModule,
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
  .run(run).name;
