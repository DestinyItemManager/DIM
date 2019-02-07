import { module } from 'angular';

import AriaModule from 'angular-aria';

import ToasterModule from 'angularjs-toaster';
import ngI18Next from 'ng-i18next';
import 'angular-hotkeys';
import 'ngimport';
import ngimportMoreModule from './ngimport-more';
import ngSanitize from 'angular-sanitize';

import { ShellModule } from './shell/shell.module';
import itemReviewModule from './item-review/item-review.module';

import config from './dimApp.config';
import run from './dimApp.run';

const dependencies = [
  AriaModule,
  ngI18Next,
  ngSanitize,
  ShellModule,
  ToasterModule,
  itemReviewModule,
  'cfp.hotkeys',
  'bcherny/ngimport',
  ngimportMoreModule
];

export const DimAppModule = module('dimApp', dependencies)
  .config(config)
  .run(run).name;
