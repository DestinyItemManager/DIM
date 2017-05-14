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

var otherDialog = null;

function VendorItemCtrl($scope, ngDialog, dimStoreService) {
  'ngInject';

  var vm = this;

  var dialogResult = null;
  var detailItem = null;
  var detailItemElement = null;

  $scope.$on('ngDialog.opened', function(event, $dialog) {
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

      var compareItems = _.flatten(dimStoreService.getStores().map(function(store) {
        return _.filter(store.items, { hash: item.hash });
      }));

      var compareItemCount = sum(compareItems, 'amount');

      dialogResult = ngDialog.open({
        template: dialogTemplate,
        overlay: false,
        className: 'move-popup vendor-move-popup ' + (vm.extraMovePopupClass || ''),
        showClose: false,
        scope: angular.extend($scope.$new(true), {
        }),
        controllerAs: 'vm',
        controller: function() {
          var innerVm = this;
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

      dialogResult.closePromise.then(function() {
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
