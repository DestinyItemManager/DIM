import angular from 'angular';
import ngReduxModule from 'ng-redux';
import { DimAppModule } from './dimApp.module';
import { ShellModule } from './shell/shell.module';

import { config } from './app.config';
import { AppComponent } from './app.component';

const appModule = angular
  .module('app', [
    DimAppModule,
    ShellModule,
    ngReduxModule
  ])
  .config(config)
  .component('app', AppComponent)
  .name;

export default appModule;