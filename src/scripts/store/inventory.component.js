import template from './inventory.html';

export default {
  template,
  bindings: {
    destinyMembershipId: '<',
    platformType: '<'
  },
  controller: InventoryController
};

function InventoryController($scope, dimStoreService) {
  'ngInject';

  const vm = this;

  // TODO: This should probably be the top level destiny1 component

  this.$onInit = function() {
    console.log(vm.destinyMembershipId, vm.platformType);

    vm.stores = dimStoreService.getStores();
    if (!vm.stores.length ||
        dimStoreService.activePlatform.membershipId !== vm.destinyMembershipId ||
        dimStoreService.activePlatform.platformType !== vm.platformType) {
      dimStoreService.reloadStores({
        destinyMembershipId: vm.destinyMembershipId,
        platformType: vm.platformType
      });
      // TODO: currently this wires us up via the dim-stores-updated event
    }
  };

  $scope.$on('dim-stores-updated', (e, stores) => {
    vm.stores = stores.stores;
    vm.vault = dimStoreService.getVault();
  });
}