import { settings } from '../settings/settings';
import template from './dimMovePopup.directive.html';
import './move-popup.scss';
import { requestAdvancedWriteActionToken } from '../bungie-api/destiny2-api';
import { getActivePlatform } from '../accounts/platform.service';
import { DimItem } from '../inventory/store/d2-item-factory.service';
import { DimStore } from '../inventory/store/d2-store-factory.service';
import { StoreServiceType } from '../inventory/d2-stores.service';
import { AwaType } from 'bungie-api-ts/destiny2';

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
  testAwa();
}

function MovePopupController(
  this: MovePopupControllerType,
  $scope,
  D2StoresService: StoreServiceType,
  dimStoreService: StoreServiceType,
  ngDialog,
  dimItemMoveService
) {
  'ngInject';
  const vm = this;

  function getStoreService() {
    return vm.item.destinyVersion === 2 ? D2StoresService : dimStoreService;
  }

  vm.moveAmount = vm.item.amount;
  vm.settings = settings;

  if (vm.item.maxStackSize > 1) {
    const store = getStoreService().getStore(vm.item.owner)!;
    vm.maximum = store.amountOfItem(vm.item);
  }

  vm.testAwa = () => {
    requestAdvancedWriteActionToken(getActivePlatform()!, AwaType.InsertPlugs);
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
