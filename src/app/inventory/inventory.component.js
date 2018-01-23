import template from './inventory.html';
import { subscribeOnScope } from '../rx-utils';

export const InventoryComponent = {
  template,
  bindings: {
    account: '<'
  },
  controller: InventoryController
};

function InventoryController($scope, dimStoreService, dimBucketService) {
  'ngInject';

  const vm = this;

  this.$onInit = function() {
    dimBucketService.getBuckets().then((buckets) => {
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
