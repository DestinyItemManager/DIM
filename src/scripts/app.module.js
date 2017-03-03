import angular from 'angular';

import { DimAppModule } from './dimApp.module';
import { ShellModule } from './shell/shell.module';

import { AppComponent } from './app.component';

export const AppModule = angular
  .module('app', [
    DimAppModule,
    ShellModule
  ])
  .component('app', AppComponent)
  .name;