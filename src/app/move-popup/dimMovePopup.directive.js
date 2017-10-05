import template from './dimMovePopup.directive.html';
import './move-popup.scss';

export const MovePopupComponent = {
  controller: MovePopupController,
  controllerAs: 'vm',
  bindings: {
    store: '<',
    item: '<'
  },
  template
};

function MovePopupController($scope, D2StoresService, dimStoreService, ngDialog, $timeout, dimSettingsService, dimItemMoveService) {
  'ngInject';
  const vm = this;

  function getStoreService(item) {
    return item.destinyVersion === 2 ? D2StoresService : dimStoreService;
  }

  vm.moveAmount = vm.item.amount;
  vm.settings = dimSettingsService;

  if (vm.item.maxStackSize > 1) {
    const store = getStoreService(vm.item).getStore(vm.item.owner);
    vm.maximum = store.amountOfItem(vm.item);
  }

  /*
  * Open up the dialog for infusion by passing
  * the selected item
  */
  vm.infuse = function infuse(item, e) {
    e.stopPropagation();

    // Close the move-popup
    $scope.$parent.closeThisDialog();

    // Open the infuse window
    ngDialog.open({
      template: '<infuse source="item"></infuse>',
      className: 'app-settings',
      appendClassName: 'modal-dialog',
      controller: function($scope) {
        'ngInject';
        $scope.item = item;
      }
    });
  };

  function closeThisDialog() {
    $scope.$parent.closeThisDialog();
  }

  vm.consolidate = function() {
    dimItemMoveService.consolidate(vm.item, vm.store, closeThisDialog);
  };

  vm.distribute = function() {
    dimItemMoveService.distribute(vm.item, vm.store, closeThisDialog);
  };

  vm.moveItemTo = function(store, equip) {
    dimItemMoveService.moveItemTo(vm.item, store, equip, vm.moveAmount, closeThisDialog);
  };

  vm.stores = getStoreService(vm.item).getStores();

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

  vm.canShowStore = function canShowStore(item, itemStore, buttonStore) {
    // Can't store into a vault
    if (buttonStore.isVault) {
      return false;
    }

    if (item.notransfer) {
      // Can store an equiped item in same itemStore
      if (item.equipped && itemStore.id === buttonStore.id) {
        return true;
      }
    } else if (itemStore.id !== buttonStore.id || item.equipped) {
      // In Destiny2, only show one store for account wide items
      if (item.destinyVersion === 2 && item.bucket && item.bucket.accountWide && !buttonStore.current) {
        return false;
      } else {
        return true;
      }
    }

    return false;
  };
}
