import angular from 'angular';
import _ from 'underscore';
import { sum } from '../util';
import template from './vendor-item.html';
import dialogTemplate from './vendor-item-dialog.html';

export const VendorItem = {
  bindings: {
    saleItem: '<',
    totalCoins: '<'
  },
  template: template,
  controller: VendorItemCtrl
};

let otherDialog = null;

function VendorItemCtrl($scope, $element, ngDialog, dimStoreService, dimDestinyTrackerService) {
  'ngInject';

  const vm = this;

  let dialogResult = null;

  vm.clicked = function(e) {
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

      const compareItems = _.flatten(dimStoreService.getStores().map((store) => {
        return _.filter(store.items, { hash: item.hash });
      }));

      const compareItemCount = sum(compareItems, 'amount');

      const itemElement = $element[0].getElementsByClassName('item')[0];

      dialogResult = ngDialog.open({
        template: dialogTemplate,
        overlay: false,
        className: `move-popup-dialog vendor-move-popup ${vm.extraMovePopupClass || ''}`,
        showClose: false,
        scope: angular.extend($scope.$new(true), {
        }),
        data: itemElement, // Dialog anchor
        controllerAs: 'vm',
        controller: function() {
          const innerVm = this;
          angular.extend(innerVm, {
            settings: innerVm.settings,
            item: item,
            saleItem: vm.saleItem,
            unlockStores: vm.saleItem.unlockedByCharacter.map((id) => _.find(dimStoreService.getStores(), { id })),
            compareItems: compareItems,
            compareItem: _.first(compareItems),
            compareItemCount: compareItemCount,
            setCompareItem: function(item) {
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

      dimDestinyTrackerService.getItemReviews(item);
    }
  };

  vm.$onDestroy = function() {
    if (dialogResult) {
      dialogResult.close();
    }
  };
}
