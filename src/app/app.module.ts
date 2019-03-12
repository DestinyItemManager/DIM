import { module } from 'angular';

import { DimAppModule } from './dimApp.module';

export const AppModule = module('app', [DimAppModule]).name;
