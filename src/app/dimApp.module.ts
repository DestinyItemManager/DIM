import { module } from 'angular';

import AriaModule from 'angular-aria';
import 'ng-dialog';

import ToasterModule from 'angularjs-toaster';
import ngI18Next from 'ng-i18next';
import 'angular-hotkeys';
import ocLazyLoadModule from 'oclazyload';
import 'ngimport';
import ngimportMoreModule from './ngimport-more';
import ngSanitize from 'angular-sanitize';

import { ShellModule } from './shell/shell.module';
import itemReviewModule from './item-review/item-review.module';
import infuseModule from './infuse/infuse.module';

import config from './dimApp.config';
import run from './dimApp.run';

const dependencies = [
  AriaModule,
  ngI18Next,
  ngSanitize,
  ocLazyLoadModule,
  ShellModule,
  ToasterModule,
  itemReviewModule,
  infuseModule,
  'cfp.hotkeys',
  'bcherny/ngimport',
  'ngDialog',
  ngimportMoreModule
];

export const DimAppModule = module('dimApp', dependencies)
  .config(config)
  .run(run).name;
