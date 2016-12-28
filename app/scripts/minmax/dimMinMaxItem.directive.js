(function() {
  'use strict';

  var MinMaxItem = {
    controller: MinMaxItemCtrl,
    controllerAs: 'vm',
    bindings: {
      itemData: '<',
      storeData: '<',
      shiftClickCallback: '='
    },
    templateUrl: 'scripts/minmax/dimMinMaxItem.directive.html'
  };

  angular.module('dimApp')
    .component('dimMinMaxItem', MinMaxItem);

  MinMaxItemCtrl.$inject = ['$scope', 'ngDialog', 'dimStoreService'];

  function MinMaxItemCtrl($scope, ngDialog, dimStoreService) {
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

          var compareItems = flatMap(dimStoreService.getStores(), function(store) {
            return _.filter(store.items, { hash: item.hash });
          });

          var compareItemCount = sum(compareItems, 'amount');

          dialogResult = ngDialog.open({
            template: 'scripts/minmax/dimMinMaxItem.directive-2.html',
            overlay: false,
            className: 'move-popup vendor-move-popup',
            showClose: false,

            scope: angular.extend($scope.$new(true), {
            }),

            controllerAs: 'vm',

            controller: [function() {
              var vm = this;
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
})();
