import template from './inventory.html';
import { subscribeOnScope } from '../rx-utils';
import { getBuckets } from '../destiny1/d1-buckets.service';

export const InventoryComponent = {
  template,
  bindings: {
    account: '<'
  },
  controller: InventoryController
};

function InventoryController($scope, dimStoreService) {
  'ngInject';

  const vm = this;

  this.$onInit = function() {
    getBuckets().then((buckets) => {
      vm.buckets = buckets;
      subscribeOnScope($scope, dimStoreService.getStoresStream(vm.account), (stores) => {
        if (stores) {
          vm.stores = stores;
        }
      });
    });
  };

  $scope.$on('dim-refresh', () => {
    dimStoreService.reloadStores();
  });
}
