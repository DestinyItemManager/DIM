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

    // TODO: can I get rid of all getStores?
    vm.stores = dimStoreService.getStores();
    // TODO: OK, need to push this check into store service
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

  // TODO: break characters out into their own thing!
  $scope.$on('dim-stores-updated', (e, stores) => {
    vm.stores = stores.stores;
  });
}
