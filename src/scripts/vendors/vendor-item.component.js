import angular from 'angular';
import _ from 'underscore';
import { sum } from '../util';
import template from './vendor-item.html';
import dialogTemplate from './vendor-item-dialog.html';
import Popper from 'popper.js';

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

  let dialog = null;
  $scope.$on('ngDialog.opened', (event, $dialog) => {
    dialog = $dialog;
    vm.reposition();
  });

  let popper;

  // TODO: gotta make a vendor item popup directive

  // Reposition the popup as it is shown or if its size changes
  vm.reposition = function() {
    if (dialogResult && dialog[0].id === dialogResult.id) {
      if (popper) {
        popper.scheduleUpdate();
      } else {
        popper = new Popper($element[0].getElementsByClassName('item')[0], dialog, {
          placement: 'top-start',
          eventsEnabled: false,
          modifiers: {
            preventOverflow: {
              priority: ['bottom', 'top', 'right', 'left']
            },
            flip: {
              behavior: ['top', 'bottom', 'right', 'left']
            },
            offset: {
              offset: '0,7px'
            },
            arrow: {
              element: '.arrow'
            }
          }
        });
        popper.scheduleUpdate(); // helps fix arrow position
      }
    }
  };

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
        popper.destroy();
        popper = null;
      }
    } else {
      const item = vm.saleItem.item;

      const compareItems = _.flatten(dimStoreService.getStores().map((store) => {
        return _.filter(store.items, { hash: item.hash });
      }));

      const compareItemCount = sum(compareItems, 'amount');

      dialogResult = ngDialog.open({
        template: dialogTemplate,
        overlay: false,
        className: `move-popup-dialog vendor-move-popup ${vm.extraMovePopupClass || ''}`,
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
            },
            reposition: vm.reposition
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
        popper.destroy();
        popper = null;
      });

      dimDestinyTrackerService.getItemReviews(item);
    }
  };

  vm.$onDestroy = function() {
    if (dialogResult) {
      dialogResult.close();
    }
    if (popper) {
      popper.destroy();
    }
  };
}
