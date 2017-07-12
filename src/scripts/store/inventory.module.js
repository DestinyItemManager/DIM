import angular from 'angular';

import inventoryComponent from './inventory.component';
import { RandomLoadoutComponent } from '../loadout/random/random-loadout.component';

export default angular
  .module('inventoryModule', [])
  .component('inventory', inventoryComponent)
  .component('randomLoadout', RandomLoadoutComponent)
  .config(($stateProvider) => {
    'ngInject';

    $stateProvider.state({
      name: 'inventory',
      parent: 'destiny1account',
      component: 'inventory',
      url: '/inventory'
    });
  })
  .name;
