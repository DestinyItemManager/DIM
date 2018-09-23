import { module } from 'angular';

import recordBooksModule from '../record-books/record-books.module';
import activitiesModule from '../activities/activities.module';
import loadoutBuilderModule from '../loadout-builder/loadout-builder.module';
import vendorsModule from '../vendors/vendors.module';

export { states } from './routes';

const mod = module('destiny1Module', [
  recordBooksModule,
  activitiesModule,
  loadoutBuilderModule,
  vendorsModule
]);

export const angularModule = mod;
