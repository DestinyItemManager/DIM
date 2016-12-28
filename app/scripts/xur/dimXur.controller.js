(function() {
  'use strict';

  angular.module('dimApp')
    .controller('dimXurCtrl', dimXurCtrl);

  dimXurCtrl.$inject = ['$scope', 'dimXurService', 'ngDialog', 'dimStoreService'];

  function dimXurCtrl($scope, dimXurService, ngDialog, dimStoreService) {
    var vm = this;
    var dialogResult = null;
    var detailItem = null;
    var detailItemElement = null;

    function countCurrencies() {
      var currencies = _.chain(dimXurService.itemCategories)
            .values()
            .flatten()
            .pluck('currency')
            .pluck('itemHash')
            .unique()
            .value();
      vm.totalCoins = {};
      currencies.forEach(function(currencyHash) {
        vm.totalCoins[currencyHash] = sum(dimStoreService.getStores(), function(store) {
          return store.amountOfItem({ hash: currencyHash });
        });
      });
    }

    countCurrencies();
    $scope.$on('dim-stores-updated', function() {
      countCurrencies();
    });

    $scope.$on('ngDialog.opened', function(event, $dialog) {
      if (dialogResult) {
        $dialog.position({
          my: 'left top',
          at: 'left bottom+2',
          of: detailItemElement,
          collision: 'flip'
        });
      }
    });

    $scope.$on('$destroy', function() {
      if (dialogResult) {
        dialogResult.close();
      }
    });

    angular.extend(vm, {
      itemCategories: dimXurService.itemCategories,
      categoryOrder: [
        'Exotic Gear',
        'Curios',
        'Material Exchange'
      ],
      itemClicked: function(item, e) {
        e.stopPropagation();
        if (dialogResult) {
          dialogResult.close();
        }

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
            template: 'scripts/xur/dimXur.controller.html',
            overlay: false,
            className: 'move-popup xur-move-popup',
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
            }]
          });
        }
      },
      close: function() {
        $scope.closeThisDialog();
      }
    });
  }
})();
