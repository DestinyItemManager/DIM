import angular from 'angular';

import inventoryComponent from './inventory.component';
import { RandomLoadoutComponent } from '../loadout/random/random-loadout.component';

export default angular
  .module('inventoryModule', [])
  .component('inventory', inventoryComponent)
  .component('randomLoadout', RandomLoadoutComponent)
  .config(($stateProvider) => {
    'ngInject';

    const states = [{
      name: 'inventory',
      parent: 'content',
      component: 'inventory',
      url: '/inventory'
    }];

    states.forEach((state) => {
      $stateProvider.state(state);
    });
  })
  .name;
