import angular from 'angular';

import inventoryComponent from './inventory.component';

export default angular
  .module('inventoryModule', [])
  .component('inventory', inventoryComponent)
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
