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
    // TODO: can I get rid of all getStores?
    vm.stores = dimStoreService.getStores();
    // TODO: OK, need to push this check into store service
    // TODO: we also need to have an expiration so we don't spam reload while switching views
    if (!vm.stores.length ||
        dimStoreService.activePlatform.membershipId !== vm.account.membershipId ||
        dimStoreService.activePlatform.platformType !== vm.account.platformType) {
      dimStoreService.reloadStores(vm.account);
      // TODO: currently this wires us up via the dim-stores-updated event
    }
  };

  $scope.$on('dim-refresh', () => {
    dimStoreService.reloadStores(vm.account);
  });

  // TODO: break characters out into their own thing!
  $scope.$on('dim-stores-updated', (e, stores) => {
    vm.stores = stores.stores;
  });
}
