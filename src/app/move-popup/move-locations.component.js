import template from './move-locations.html';
import './move-locations.scss';

export const MoveLocationsComponent = {
  controller: MoveLocationsController,
  controllerAs: 'vm',
  bindings: {
    item: '<'
  },
  template: template
};

function MoveLocationsController($rootScope, dimSettingsService, dimItemMoveService, dimStoreService, D2StoresService) {
  'ngInject';
  const vm = this;

  function getStoreService() {
    return dimSettingsService.destinyVersion === 2 ? D2StoresService : dimStoreService;
  }

  vm.settings = dimSettingsService;

  $rootScope.$on('drag-start-item', (event, args) => {
    vm.item = args.item;
    vm.store = getStoreService().getStore(vm.item.owner);
    vm.stores = getStoreService().getStores();
  });

  if (vm.item) {
    vm.store = getStoreService().getStore(vm.item.owner);
    vm.stores = getStoreService().getStores();
  }

  vm.canShowVault = function canShowVault(item, itemStore, buttonStore) {
    // If my itemStore is the vault, don't show a vault button.
    // Can't vault a vaulted item.
    if (itemStore.isVault) {
      return false;
    }

    // If my buttonStore is the vault, then show a vault button.
    if (!buttonStore.isVault) {
      return false;
    }

    // Can't move this item away from the current itemStore.
    if (item.notransfer) {
      return false;
    }

    return true;
  };

  vm.canShowStore = function canShowStore(buttonStore) {
    if (buttonStore.isVault) {
      return false;
    }

    if (vm.item.notransfer) {
      if (vm.item.equipped && vm.store.id === buttonStore.id) {
        return true;
      }
    } else if (vm.store.id !== buttonStore.id || vm.item.equipped) {
      return true;
    }

    return false;
  };

  vm.moveItemTo = function(store, equip) {
    dimItemMoveService.moveItemTo(vm.item, store, equip, vm.moveAmount);
  };

  // drag stuff
  const dragHelp = document.getElementById('item-drag-box');
  vm.onDragEnter = function() {
    dragHelp.classList.add('drag-dwell-activated');
  };
  vm.onDragLeave = function() {
    dragHelp.classList.remove('drag-dwell-activated');
  };
  vm.onDrop = function(store, event, equip) {
    vm.moveItemTo(store, equip);
    dragHelp.classList.remove('drag-dwell-activated');
  };
}
