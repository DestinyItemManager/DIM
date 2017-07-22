import template from './inventory.html';
import { subscribeOnScope } from '../rx-utils';

export default {
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
    subscribeOnScope($scope, dimStoreService.getStoresStream(vm.account), (stores) => {
      vm.stores = stores;
    });
  };

  $scope.$on('dim-refresh', () => {
    dimStoreService.reloadStores();
  });
}
