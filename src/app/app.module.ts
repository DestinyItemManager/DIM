import { module } from 'angular';

import { DimAppModule } from './dimApp.module';
import { ShellModule } from './shell/shell.module';

import { AppComponent } from './app.component';

export const AppModule =
  module('app', [
    DimAppModule,
    ShellModule
  ])
  .component('app', AppComponent)
  .name;
