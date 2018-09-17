import { module } from 'angular';

import recordBooksModule from '../record-books/record-books.module';
import activitiesModule from '../activities/activities.module';
import loadoutBuilderModule from '../loadout-builder/loadout-builder.module';
import vendorsModule from '../vendors/vendors.module';
import { D1InventoryComponent } from './d1-inventory.component';

export { states } from './routes';

const mod = module('destiny1Module', [
  recordBooksModule,
  activitiesModule,
  loadoutBuilderModule,
  vendorsModule
]);

if (!$featureFlags.reactInventory) {
  mod.component('inventory1', D1InventoryComponent);
}

export const angularModule = mod;
