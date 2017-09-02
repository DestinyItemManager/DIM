import template from './d2-inventory.html';
import { subscribeOnScope } from '../rx-utils';

export const D2InventoryComponent = {
  template,
  bindings: {
    account: '<'
  },
  controller: D2InventoryController
};

function D2InventoryController($scope, D2StoreService) {
  'ngInject';

  const vm = this;

  this.$onInit = function() {
    subscribeOnScope($scope, D2StoreService.getStoresStream(vm.account), (stores) => {
      vm.stores = stores;
    });
  };

  $scope.$on('dim-refresh', () => {
    D2StoreService.reloadStores();
  });
}
