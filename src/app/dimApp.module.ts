import { module } from 'angular';

import AriaModule from 'angular-aria';
import 'ng-dialog';
import DragAndDropModule from 'angular-native-dragdrop';

import 'angularjs-slider';
import ToasterModule from 'angularjs-toaster';
import ngI18Next from 'ng-i18next';
import 'angular-hotkeys';
import ocLazyLoadModule from 'oclazyload';
import 'ngimport';
import ngimportMoreModule from './ngimport-more';
import ngSanitize from 'angular-sanitize';

import { ShellModule } from './shell/shell.module';
import inventoryModule from './inventory/inventory.module';
import itemReviewModule from './item-review/item-review.module';
import infuseModule from './infuse/infuse.module';
import farmingModule from './farming/farming.module';
import movePopupModule from './move-popup/move-popup.module';

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
  infuseModule,
  farmingModule,
  movePopupModule,
  'cfp.hotkeys',
  'bcherny/ngimport',
  'ngDialog',
  ngimportMoreModule
];

export const DimAppModule = module('dimApp', dependencies)
  .config(config)
  .run(run).name;
