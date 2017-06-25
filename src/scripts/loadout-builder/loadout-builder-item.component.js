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

function LoadoutBuilderItemCtrl($scope, ngDialog, dimStoreService) {
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

  angular.extend(vm, {
    itemClicked: function(item, e) {
      e.stopPropagation();
      if (dialogResult) {
        dialogResult.close();
      }

      if (vm.shiftClickCallback && e.shiftKey) {
        vm.shiftClickCallback(vm.itemData);
        return;
      }

      if (detailItem === item) {
        detailItem = null;
        dialogResult = null;
        detailItemElement = null;
      } else {
        detailItem = item;
        detailItemElement = angular.element(e.currentTarget);

        const compareItems = flatMap(dimStoreService.getStores(), (store) => {
          return _.filter(store.items, { hash: item.hash });
        });

        const compareItemCount = sum(compareItems, 'amount');

        dialogResult = ngDialog.open({
          template: dialogTemplate,
          overlay: false,
          className: 'move-popup vendor-move-popup',
          showClose: false,
          scope: angular.extend($scope.$new(true), {
          }),
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
      }
    },
    close: function() {
      if (dialogResult) {
        dialogResult.close();
      }
      $scope.closeThisDialog();
    }
  });
}

