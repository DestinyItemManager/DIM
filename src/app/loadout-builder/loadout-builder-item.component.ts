import * as _ from 'lodash';

import template from './loadout-builder-item.html';
import dialogTemplate from './loadout-builder-item-dialog.html';
import { IController } from 'angular';
import { DimItem } from '../inventory/item-types';
import { D1StoresService } from '../inventory/d1-stores.service';

export const LoadoutBuilderItem = {
  controller: LoadoutBuilderItemCtrl,
  controllerAs: 'vm',
  bindings: {
    itemData: '<',
    shiftClickCallback: '='
  },
  template
};

function LoadoutBuilderItemCtrl(
  this: IController & {
    itemData: DimItem;
  },
  $scope,
  $element,
  ngDialog
) {
  'ngInject';

  const vm = this;
  let dialogResult: any = null;

  Object.assign(vm, {
    itemClicked(item: DimItem, e) {
      e.stopPropagation();

      if (dialogResult) {
        if (ngDialog.isOpen(dialogResult.id)) {
          dialogResult.close();
          dialogResult = null;
        }
      } else if (vm.shiftClickCallback && e.shiftKey) {
        vm.shiftClickCallback(vm.itemData);
      } else {
        const compareItems = _.flatMap(D1StoresService.getStores(), (store) => {
          return store.items.filter((i) => i.hash === item.hash);
        });

        const compareItemCount = _.sumBy(compareItems, (i) => i.amount);
        const itemElement = $element[0].getElementsByClassName('item')[0];

        dialogResult = ngDialog.open({
          template: dialogTemplate,
          overlay: false,
          className: 'move-popup-dialog vendor-move-popup',
          showClose: false,
          scope: $scope.$new(true),
          data: itemElement,
          controllerAs: 'vm',
          controller() {
            const vm = this;
            Object.assign(vm, {
              item,
              compareItems,
              compareItem: _.take(compareItems),
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

        dialogResult.closePromise.then(() => {
          dialogResult = null;
        });
      }
    },
    close() {
      if (dialogResult) {
        dialogResult.close();
      }
      $scope.closeThisDialog();
    },

    $onDestroy() {
      if (dialogResult) {
        dialogResult.close();
      }
    }
  });
}
