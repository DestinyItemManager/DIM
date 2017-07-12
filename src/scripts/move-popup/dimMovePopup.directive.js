import angular from 'angular';
import template from './dimMovePopup.directive.html';
import Popper from 'popper.js';

angular.module('dimApp')
  .directive('dimMovePopup', MovePopup);

function MovePopup() {
  return {
    controller: MovePopupController,
    controllerAs: 'vm',
    bindToController: true,
    restrict: 'E',
    scope: {
      store: '=',
      item: '='
    },
    replace: true,
    template: template
  };
}


function MovePopupController($scope, dimStoreService, ngDialog, $timeout, dimSettingsService, dimItemMoveService) {
  const vm = this;
  vm.moveAmount = vm.item.amount;
  vm.settings = dimSettingsService;

  if (vm.item.maxStackSize > 1) {
    const store = dimStoreService.getStore(vm.item.owner);
    vm.maximum = store.amountOfItem(vm.item);
  }

  // Capture the dialog element
  let dialog = null;
  $scope.$on('ngDialog.opened', (event, $dialog) => {
    dialog = $dialog;
    vm.reposition();
  });

  let popper;
  $scope.$on('$destroy', () => {
    if (popper) {
      popper.destroy();
    }
  });

  // Reposition the popup as it is shown or if its size changes
  vm.reposition = function() {
    const element = $scope.$parent.ngDialogData;
    if (element) {
      if (popper) {
        popper.scheduleUpdate();
      } else {
        const boundariesElement = document.getElementsByClassName('store-bounds')[0];
        popper = new Popper(element, dialog, {
          placement: 'top-start',
          eventsEnabled: false,
          modifiers: {
            preventOverflow: {
              priority: ['bottom', 'top', 'right', 'left'],
              boundariesElement
            },
            flip: {
              behavior: ['top', 'bottom', 'right', 'left'],
              boundariesElement
            },
            offset: {
              offset: '0,5px'
            },
            arrow: {
              element: '.arrow'
            }
          }
        });
        popper.scheduleUpdate(); // helps fix arrow position
      }
    }
  };

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
