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

function VendorItemCtrl($scope, ngDialog, dimStoreService) {
  'ngInject';

  const vm = this;

  let dialogResult = null;
  let detailItem = null;
  let detailItemElement = null;

  $scope.$on('ngDialog.opened', (event, $dialog) => {
    if (dialogResult && $dialog[0].id === dialogResult.id) {
      $dialog.position({
        my: 'left top',
        at: 'left bottom+2',
        of: detailItemElement,
        collision: 'flip flip'
      });
    }
  });

  vm.clicked = function(e) {
    e.stopPropagation();
    if (dialogResult) {
      dialogResult.close();
    }

    if (otherDialog) {
      if (ngDialog.isOpen(otherDialog.id)) {
        otherDialog.close();
      }
      otherDialog = null;
    }

    const item = vm.saleItem.item;
    if (detailItem === item) {
      detailItem = null;
      dialogResult = null;
      detailItemElement = null;
    } else {
      detailItem = item;
      detailItemElement = angular.element(e.currentTarget);

      const compareItems = _.flatten(dimStoreService.getStores().map((store) => {
        return _.filter(store.items, { hash: item.hash });
      }));

      const compareItemCount = sum(compareItems, 'amount');

      dialogResult = ngDialog.open({
        template: dialogTemplate,
        overlay: false,
        className: `move-popup vendor-move-popup ${vm.extraMovePopupClass || ''}`,
        showClose: false,
        scope: angular.extend($scope.$new(true), {
        }),
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
    }
  };

  vm.$onDestroy = function() {
    if (dialogResult) {
      dialogResult.close();
    }
  };
}
