import template from './d2-inventory.html';
import { subscribeOnScope } from '../rx-utils';

export const D2InventoryComponent = {
  template,
  bindings: {
    account: '<'
  },
  controller: D2InventoryController
};

function D2InventoryController($scope, D2StoresService, D2BucketsService) {
  'ngInject';

  const vm = this;

  vm.featureFlags = {
    dnd: $featureFlags.dnd
  };

  this.$onInit = function() {
    D2BucketsService.getBuckets().then((buckets) => {
      vm.buckets = buckets;
      subscribeOnScope($scope, D2StoresService.getStoresStream(vm.account), (stores) => {
        vm.stores = stores;
      });
    });
  };

  $scope.$on('dim-refresh', () => {
    D2StoresService.reloadStores();
  });
}
