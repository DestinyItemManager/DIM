import angular from 'angular';

import { AppComponent } from './app.component';
import { DimAppModule } from './dimApp.module';

export const AppModule = angular
  .module('app', [
    DimAppModule
  ])
  .component('app', AppComponent)
  .name;