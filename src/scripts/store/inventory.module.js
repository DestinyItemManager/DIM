import angular from 'angular';

import inventoryComponent from './inventory.component';

export default angular
  .module('inventoryModule', [])
  .component('inventory', inventoryComponent)
  .config(($stateProvider) => {
    'ngInject';

    const states = [{
      name: 'inventory',
      parent: 'destiny1account',
      component: 'inventory',
      url: '/inventory'
    }];

    states.forEach((state) => {
      $stateProvider.state(state);
    });
  })
  .name;
