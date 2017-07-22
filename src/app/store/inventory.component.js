import template from './inventory.html';

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
    dimStoreService.storesStream(vm.account).subscribe((stores) => {
      vm.stores = stores;
    });
  };

  $scope.$on('dim-refresh', () => {
    dimStoreService.reloadStores(vm.account);
  });
}
