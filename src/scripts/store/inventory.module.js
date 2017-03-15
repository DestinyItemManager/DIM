import angular from 'angular';

import inventoryComponent from './inventory.component';

export default angular
  .module('inventoryModule', [])
  .component('inventory', inventoryComponent)
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
