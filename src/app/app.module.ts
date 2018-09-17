import { module } from 'angular';

import { DimAppModule } from './dimApp.module';
import { ShellModule } from './shell/shell.module';

export const AppModule = module('app', [DimAppModule, ShellModule]).name;
