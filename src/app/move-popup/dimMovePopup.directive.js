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

  function getStoreService() {
    return vm.item.destinyVersion === 2 ? D2StoresService : dimStoreService;
  }

  vm.moveAmount = vm.item.amount;
  vm.settings = dimSettingsService;

  if (vm.item.maxStackSize > 1) {
    const store = getStoreService().getStore(vm.item.owner);
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
}
