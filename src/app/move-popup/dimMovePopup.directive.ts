import { settings } from '../settings/settings';
import template from './dimMovePopup.directive.html';
import './move-popup.scss';
import { IController } from 'angular';
import { DimStore, StoreServiceType } from '../inventory/store-types';
import { DimItem } from '../inventory/item-types';

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
  D2StoresService: StoreServiceType,
  dimStoreService: StoreServiceType,
  ngDialog,
  dimItemMoveService
) {
  'ngInject';
  const vm = this;
  vm.settings = settings;

  function getStoreService() {
    return vm.item.destinyVersion === 2 ? D2StoresService : dimStoreService;
  }

  vm.$onInit = () => {
    console.log("Move popup", this.item, this.store);
    vm.moveAmount = vm.item.amount;
    if (vm.item.maxStackSize > 1) {
      const store = getStoreService().getStore(vm.item.owner)!;
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
    dimItemMoveService.consolidate(vm.item, vm.store);
  };

  vm.distribute = () => {
    closeThisDialog();
    dimItemMoveService.distribute(vm.item);
  };
}
