import { settings } from '../settings/settings';
import template from './dimMovePopup.directive.html';
import './move-popup.scss';
import { IController } from 'angular';
import { DimStore } from '../inventory/store-types';
import { DimItem } from '../inventory/item-types';
import { consolidate, distribute } from '../inventory/dimItemMoveService.factory';

export const MovePopupComponent = {
  controller: MovePopupController,
  controllerAs: 'vm',
  bindings: {
    store: '<',
    item: '<'
  },
  template
};

interface MovePopupControllerType {
  store: DimStore;
  item: DimItem;
  moveAmount: number;
  settings: typeof settings;
  maximum?: number;
  infuse(item: DimItem, e);
  consolidate();
  distribute();
}

function MovePopupController(
  this: IController & MovePopupControllerType,
  $scope,
  ngDialog
) {
  'ngInject';
  const vm = this;
  vm.settings = settings;

  vm.$onInit = () => {
    vm.moveAmount = vm.item.amount;
    if (vm.item.maxStackSize > 1) {
      const store = vm.item.getStoresService().getStore(vm.item.owner)!;
      vm.maximum = store.amountOfItem(vm.item);
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
      template: '<infuse query="item"></infuse>',
      className: 'app-settings',
      appendClassName: 'modal-dialog',
      controller($scope) {
        'ngInject';
        $scope.item = item;
      }
    });
  };

  function closeThisDialog() {
    $scope.$parent.closeThisDialog();
  }

  vm.consolidate = () => {
    closeThisDialog();
    consolidate(vm.item, vm.store);
  };

  vm.distribute = () => {
    closeThisDialog();
    distribute(vm.item);
  };
}
