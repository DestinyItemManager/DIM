(function() {
  'use strict';

  angular.module('dimApp')
    .controller('dimVendorCtrl', dimVendorCtrl);

  dimVendorCtrl.$inject = ['$scope', '$q', 'loadingTracker', 'dimVendorService', 'ngDialog', 'dimStoreService', '$timeout'];

  function dimVendorCtrl($scope, $q, loadingTracker, dimVendorService, ngDialog, dimStoreService, $timeout) {
    var vm = this;
    var vendors = [];
    var dialogResult = null;
    var detailItem = null;
    var detailItemElement = null;
    
    $scope.$on('ngDialog.opened', function (event, $dialog) {
      if (dialogResult) {
        $dialog.position({
          my: 'left top',
          at: 'left bottom+4',
          of: detailItemElement,
          collision: 'flip'
        });
      }
    });
    
    vm.vendors = dimVendorService.vendorItems;
    // dimVendorService.getVendorItems().then(function(val) {
      // vm.vendors = val;
      // console.log(val);
    // });
    
    angular.extend(vm, {
      itemClicked: function(item, e) {
        e.stopPropagation();
        if (dialogResult) {
          dialogResult.close();
        }

        if (detailItem !== item) {
          detailItem = item;
          detailItemElement = angular.element(e.currentTarget);

          var compareItems = _.flatten(dimStoreService.getStores().map(function(store) {
            return _.filter(store.items, { hash: item.hash });
          }));

          var compareItemCount = sum(compareItems, 'amount');

          dialogResult = ngDialog.open({
            template: [
              '<div class="move-popup" dim-click-anywhere-but-here="closeThisDialog()">',
              '  <div dim-move-item-properties="vm.item" dim-compare-item="vm.compareItem"></div>',
              '  <div class="item-details more-item-details" ng-if="vm.item.equipment && vm.compareItems.length">',
              '    <div>Compare with what you already have:</div>',
              '    <div class="compare-items">',
              '      <dim-simple-item ng-repeat="ownedItem in vm.compareItems track by ownedItem.index" item-data="ownedItem" ng-click="vm.setCompareItem(ownedItem)" ng-class="{ selected: (ownedItem.index === vm.compareItem.index) }"></dim-simple-item>',
              '    </div>',
              '  </div>',
              '  <div class="item-description" ng-if="!vm.item.equipment">You have {{vm.compareItemCount}} of these.</div>',
              '</div>'].join(''),
            plain: true,
            overlay: false,
            className: 'move-popup vendor-move-popup',
            showClose: false,
            scope: angular.extend($scope.$new(true), {
            }),
            controllerAs: 'vm',
            controller: ['$scope', function($scope) {
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
        } else {
          detailItem = null;
          dialogResult = null;
          detailItemElement = null;
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
