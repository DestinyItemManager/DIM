(function() {
  'use strict';

  var VendorItem = {
    bindings: {
      saleItem: '<',
      costs: '<',
      totalCoins: '<',
      itemClicked: '&'
    },
    template: [
      '<div class="vendor-item">',
      '  <dim-simple-item id="vendor-{{::$ctrl.saleItem.hash}}" item-data="$ctrl.saleItem" ng-click="$ctrl.itemClicked({ $event: $event })" ng-class="{ \'search-hidden\': !$ctrl.saleItem.visible }"></dim-simple-item>',
      '  <div ng-repeat="cost in $ctrl.costs" class="cost" ng-class="{notenough: ($ctrl.totalCoins[cost.currency.itemHash] < cost.value)}">',
      '    {{::cost.value}}/{{$ctrl.totalCoins[cost.currency.itemHash]}}',
      '    <span class="currency"><img ng-src="{{::cost.currency.icon | bungieIcon}}" title="{{::cost.currency.itemName}}"></span>',
      '  </div>',
      '</div>'
    ].join('')
  };

  // TODO: use a filter to implement tabs!!

  var VendorItems = {
    controller: VendorItemsCtrl,
    controllerAs: 'vm',
    bindings: {
      stores: '<storesData',
      vendors: '=vendorsData',
      types: '<displayTypes',
      vendorHashes: '<vendorHashes',
      totalCoins: '<totalCoins'
    },
    template: [
      '<div class="vendor-char-items" ng-repeat="vendorHash in vm.vendorHashes">',
      ' <div ng-if="vm.vendors[0][vendorHash]">',
      '   <div class="vendor-header">',
      '     <div class="title">',
      '     {{vm.vendors[0][vendorHash].name}}',
      '     <img class="vendor-icon" ng-src="{{::vm.vendors[0][vendorHash].icon | bungieIcon}}" />',
      '     <timer class="vendor-timer" ng-if="vm.vendors[0][vendorHash].nextRefreshDate[0] !== \'9\'" end-time="vm.vendors[0][vendorHash].nextRefreshDate" max-time-unit="\'day\'" interval="1000">{{days}} day{{daysS}} {{hhours}}:{{mminutes}}:{{sseconds}}</timer>',
      '     </div>',
      '   </div>',
      '   <div class="vendor-row">',
      '     <div class="char-cols store-cell" ng-repeat="store in vm.stores | sortStores:vm.settings.characterOrder track by store.id">',
      '       <div ng-repeat="category in store.vendors[vendorHash].categories">',
      '          <h3>{{category.title}}</h3>',
      '          <div class="vendor-armor">',
      '            <dim-vendor-item ng-repeat="saleItem in category.items" sale-item="saleItem.item" costs="saleItem.costs" total-coins="vm.totalCoins" item-clicked="vm.itemClicked(saleItem, $event)"></dim-vendor-item>',
      '          </div>',
      '        </div>',
      '      </div>',
      '    </div>',
      ' </div>',
      '</div>'
    ].join('')
  };

  angular.module('dimApp')
    .component('dimVendorItem', VendorItem)
    .component('dimVendorItems', VendorItems);

  VendorItemsCtrl.$inject = ['$scope', 'ngDialog', 'dimStoreService', 'dimSettingsService'];

  function VendorItemsCtrl($scope, ngDialog, dimStoreService, dimSettingsService) {
    var vm = this;
    var dialogResult = null;
    var detailItem = null;
    var detailItemElement = null;

    vm.settings = dimSettingsService;

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
      eachHasItems: function(items, types) {
        return types.length > 1 && _.every(types, function(type) { return items[type].length; });
      },
      getFirstVendorCombined: function(vendors, vendorHash) {
        if (vendors) {
          const vendor = _.find(vendors, function(vendor) {
            return vendor[vendorHash];
          });
          if (vendor) {
            return vendor[vendorHash];
          }
        }
        return null;
      },
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

          // TODO: gotta fix this too
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
