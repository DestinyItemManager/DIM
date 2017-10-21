import template from './move-locations.html';
import './move-locations.scss';

export const MoveLocationsComponent = {
  template,
  controller,
  bindings: {
    item: '<'
  }
};

function controller($rootScope, dimSettingsService, dimItemMoveService, dimStoreService, D2StoresService) {
  'ngInject';
  const vm = this;

  function getStoreService() {
    return dimSettingsService.destinyVersion === 2 ? D2StoresService : dimStoreService;
  }

  const dragBox = document.getElementById('item-drag-box');
  vm.settings = dimSettingsService;

  $rootScope.$on('drag-start-item', (event, args) => {
    vm.item = args.item;
    vm.store = getStoreService().getStore(vm.item.owner);
    vm.stores = getStoreService().getStores();
    dragBox.style.top = `${args.element.target.getBoundingClientRect().top - args.element.target.offsetHeight}px`;
    $rootScope.$digest();
  });
  $rootScope.$on('drag-stop-item', (event, args) => {
    dragBox.style.top = '-200px';
    $rootScope.$digest();
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
    // Can't store into a vault
    if (buttonStore.isVault) {
      return false;
    }

    if (vm.item.notransfer) {
      // Can store an equiped item in same itemStore
      if (vm.item.equipped && vm.store.id === buttonStore.id) {
        return true;
      }
    } else if (vm.store.id !== buttonStore.id || vm.item.equipped) {
      // In Destiny2, only show one store for account wide items
      if (vm.item.destinyVersion === 2 && vm.item.bucket && vm.item.bucket.accountWide && !buttonStore.current) {
        return false;
      } else {
        return true;
      }
    }

    return false;
  };

  vm.moveItemTo = function(store, equip) {
    dimItemMoveService.moveItemTo(vm.item, store, equip, vm.moveAmount);
  };

  // drag stuff
  vm.onDrop = function(store, $event, equip) {
    vm.moveItemTo(store, equip);
    $event.target.parentElement.classList.remove('activated');
  };
}
