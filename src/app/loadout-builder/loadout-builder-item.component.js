import angular from 'angular';
import _ from 'underscore';
import { sum, flatMap } from '../util';
import template from './loadout-builder-item.html';
import dialogTemplate from './loadout-builder-item-dialog.html';

export const LoadoutBuilderItem = {
  controller: LoadoutBuilderItemCtrl,
  controllerAs: 'vm',
  bindings: {
    itemData: '<',
    shiftClickCallback: '='
  },
  template: template
};

function LoadoutBuilderItemCtrl($scope, $element, ngDialog, dimStoreService) {
  'ngInject';

  const vm = this;
  let dialogResult = null;

  angular.extend(vm, {
    itemClicked: function(item, e) {
      e.stopPropagation();

      if (dialogResult) {
        if (ngDialog.isOpen(dialogResult.id)) {
          dialogResult.close();
          dialogResult = null;
        }
      } else if (vm.shiftClickCallback && e.shiftKey) {
        vm.shiftClickCallback(vm.itemData);
      } else {
        const compareItems = flatMap(dimStoreService.getStores(), (store) => {
          return _.filter(store.items, { hash: item.hash });
        });

        const compareItemCount = sum(compareItems, 'amount');
        const itemElement = $element[0].getElementsByClassName('item')[0];

        dialogResult = ngDialog.open({
          template: dialogTemplate,
          overlay: false,
          className: 'move-popup-dialog vendor-move-popup',
          showClose: false,
          scope: angular.extend($scope.$new(true), {
          }),
          data: itemElement,
          controllerAs: 'vm',
          controller: [function() {
            const vm = this;
            angular.extend(vm, {
              item: item,
              compareItems: compareItems,
              compareItem: _.first(compareItems),
              compareItemCount: compareItemCount,
              setCompareItem: function(item) {
                this.compareItem = item;
              }
            });
          }],
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
    close: function() {
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

