import template from './inventory.html';

export default {
  template,
  bindings: {
    account: '<'
  },
  controller: InventoryController
};

function InventoryController($scope, dimStoreService, $state) {
  'ngInject';

  const vm = this;

  // TODO: This should probably be the top level destiny1 component

  this.$onInit = function() {
    console.log(vm.account);

    if (!vm.account) {
      $state.go('destiny1');
    }

    // TODO: can I get rid of all getStores?
    vm.stores = dimStoreService.getStores();
    // TODO: OK, need to push this check into store service
    if (!vm.stores.length ||
        dimStoreService.activePlatform.membershipId !== vm.account.membershipId ||
        dimStoreService.activePlatform.platformType !== vm.account.platformType) {
      dimStoreService.reloadStores(vm.account);
      // TODO: currently this wires us up via the dim-stores-updated event
    }
  };

  // TODO: break characters out into their own thing!
  $scope.$on('dim-stores-updated', (e, stores) => {
    vm.stores = stores.stores;
  });
}
