import { module } from 'angular';

import { D2InventoryComponent } from './d2-inventory.component';

export default module('destiny2Module', [])
  .component('inventory2', D2InventoryComponent)
  .name;
