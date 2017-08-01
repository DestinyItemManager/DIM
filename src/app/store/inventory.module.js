import angular from 'angular';

import inventoryComponent from './inventory.component';

export default angular
  .module('inventoryModule', [])
  .component('inventory', inventoryComponent)
  .config(($stateProvider) => {
    'ngInject';

    $stateProvider.state({
      name: 'destiny1.inventory',
      component: 'inventory',
      url: '/inventory'
    });
  })
  .name;
