import { settings } from '../settings/settings';
import template from './dimMovePopup.directive.html';
import './move-popup.scss';
import { IController } from 'angular';
import { DimStore } from '../inventory/store-types';
import { DimItem } from '../inventory/item-types';
import { consolidate, distribute } from '../inventory/dimItemMoveService.factory';
import { ItemPopupExtraInfo, hideItemPopup } from '../item-popup/item-popup';

export const MovePopupComponent = {
  controller: MovePopupController,
  controllerAs: 'vm',
  bindings: {
    store: '<',
    item: '<',
    collectible: '<',
    failureStrings: '<',
    owned: '<',
    acquired: '<',
    rewards: '<'
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
  this: IController & MovePopupControllerType & ItemPopupExtraInfo,
  $scope,
  ngDialog
) {
  'ngInject';
  const vm = this;
  $scope.$watch(
    () => settings,
    () => {
      vm.settings = settings;
    }
  );

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

    hideItemPopup();

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

  vm.consolidate = () => {
    hideItemPopup();
    consolidate(vm.item, vm.store);
  };

  vm.distribute = () => {
    hideItemPopup();
    distribute(vm.item);
  };
}
