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

function MovePopupController($scope, dimStoreService, ngDialog, $timeout, dimSettingsService, dimItemMoveService) {
  'ngInject';
  const vm = this;
  vm.moveAmount = vm.item.amount;
  vm.settings = dimSettingsService;

  if (vm.item.maxStackSize > 1) {
    const store = dimStoreService.getStore(vm.item.owner);
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

  vm.stores = dimStoreService.getStores();

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
    if (buttonStore.isVault) {
      return false;
    }

    if (item.notransfer) {
      if (item.equipped && itemStore.id === buttonStore.id) {
        return true;
      }
    } else if (itemStore.id !== buttonStore.id || item.equipped) {
      return true;
    }

    return false;
  };
}
