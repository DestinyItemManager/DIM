import { IComponentOptions, IController, extend } from 'angular';
import * as _ from 'underscore';
import { sum, flatMap } from '../util';
import template from './vendor-item.html';
import dialogTemplate from './vendor-item-dialog.html';
import { StoreServiceType } from '../inventory/store-types';

export const VendorItem: IComponentOptions = {
  bindings: {
    saleItem: '<',
    totalCoins: '<'
  },
  template,
  controller: VendorItemCtrl
};

let otherDialog: any = null;

function VendorItemCtrl(
  this: IController,
  $scope,
  $element,
  ngDialog,
  dimStoreService: StoreServiceType
) {
  'ngInject';

  const vm = this;

  let dialogResult: any = null;

  vm.clicked = (e) => {
    e.stopPropagation();

    if (otherDialog) {
      if (ngDialog.isOpen(otherDialog.id)) {
        otherDialog.close();
      }
      otherDialog = null;
    }

    if (dialogResult) {
      if (ngDialog.isOpen(dialogResult.id)) {
        dialogResult.close();
        dialogResult = null;
      }
    } else {
      const item = vm.saleItem.item;

      const compareItems = flatMap(dimStoreService.getStores(), (store) => {
        return store.items.filter((i) => i.hash === item.hash);
      });

      const compareItemCount = sum(compareItems, (i) => i.amount);

      const itemElement = $element[0].getElementsByClassName('item')[0];

      dialogResult = ngDialog.open({
        template: dialogTemplate,
        overlay: false,
        className: `move-popup-dialog vendor-move-popup ${vm.extraMovePopupClass || ''}`,
        showClose: false,
        scope: extend($scope.$new(true), {
        }),
        data: itemElement, // Dialog anchor
        controllerAs: 'vm',
        controller() {
          extend(this, {
            settings: this.settings,
            item,
            saleItem: vm.saleItem,
            unlockStores: vm.saleItem.unlockedByCharacter.map((id) => _.find(dimStoreService.getStores(), { id })),
            compareItems,
            compareItem: _.first(compareItems),
            compareItemCount,
            setCompareItem(item) {
              this.compareItem = item;
            }
          });
        },
        // Setting these focus options prevents the page from
        // jumping as dialogs are shown/hidden
        trapFocus: false,
        preserveFocus: false
      });

      otherDialog = dialogResult;

      dialogResult.closePromise.then(() => {
        dialogResult = null;
      });
    }
  };

  vm.$onDestroy = () => {
    if (dialogResult) {
      dialogResult.close();
    }
  };
}
