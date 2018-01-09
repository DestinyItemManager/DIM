import angular from 'angular';

import { Destiny2Component } from './destiny2.component';
import { D2InventoryComponent } from './d2-inventory.component';
import { D2BucketsService } from './d2-buckets.service';
import { D2Definitions } from './d2-definitions.service';

export default angular
  .module('destiny2Module', [])
  .factory('D2BucketsService', D2BucketsService)
  .factory('D2Definitions', D2Definitions)
  .component('destiny2', Destiny2Component)
  .component('inventory2', D2InventoryComponent)
  .config(($stateProvider) => {
    'ngInject';

    // Root state for Destiny 2 views
    $stateProvider.state({
      name: 'destiny2',
      parent: 'destiny-account',
      redirectTo: 'destiny2.inventory',
      url: '/d2',
      component: 'destiny2'
    });

    $stateProvider.state({
      name: 'destiny2.inventory',
      url: '/inventory',
      component: 'inventory2'
    });
  })
  .name;
