import angular from 'angular';
import ngReduxModule from 'ng-redux';
import dimAppModule from './dimApp.module';
import shellModule from './shell/shell.module';
import storeModule from './store/store.module';

import config from './app.config';
import appComponent from './app.component';

const appModule = angular
  .module('app', [
    dimAppModule,
    shellModule,
    ngReduxModule,
    storeModule
  ])
  .config(config)
  .component('app', appComponent)
  .name;

export default appModule;