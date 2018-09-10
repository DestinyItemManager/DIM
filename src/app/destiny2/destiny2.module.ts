import { module } from 'angular';

import { D2InventoryComponent } from './d2-inventory.component';

const mod = module('destiny2Module', []);

if (!$featureFlags.reactInventory) {
  mod.component('inventory2', D2InventoryComponent);
}

export default mod.name;
