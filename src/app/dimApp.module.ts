import { module } from 'angular';

import AriaModule from 'angular-aria';

import ngI18Next from 'ng-i18next';
import 'ngimport';
import ngimportMoreModule from './ngimport-more';
import ngSanitize from 'angular-sanitize';

import { ShellModule } from './shell/shell.module';

import config from './dimApp.config';
import run from './dimApp.run';

const dependencies = [
  AriaModule,
  ngI18Next,
  ngSanitize,
  ShellModule,
  'bcherny/ngimport',
  ngimportMoreModule
];

export const DimAppModule = module('dimApp', dependencies)
  .config(config)
  .run(run).name;
