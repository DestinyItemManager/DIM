(function() {
  'use strict';

  var VendorItem = {
    bindings: {
      saleItem: '<',
      cost: '<',
      totalCoins: '<',
      itemClicked: '&'
    },
    template: [
      '<div class="vendor-item">',
      '  <dim-simple-item id="vendor-{{::$ctrl.saleItem.hash}}" item-data="$ctrl.saleItem" ng-click="$ctrl.itemClicked({ $event: $event })" ng-class="{ \'search-hidden\': !$ctrl.saleItem.visible }"></dim-simple-item>',
      '  <div class="cost" ng-class="{notenough: ($ctrl.totalCoins[$ctrl.cost.currency.itemHash] < $ctrl.cost.cost)}">',
      '    {{::$ctrl.cost.cost}}/{{$ctrl.totalCoins[$ctrl.cost.currency.itemHash]}}',
      '    <span class="currency"><img ng-src="{{::$ctrl.cost.currency.icon | bungieIcon}}" title="{{::$ctrl.cost.currency.name}}"></span>',
      '  </div>',
      '</div>'
    ].join('')
  };

  var VendorItems = {
    controller: VendorItemsCtrl,
    controllerAs: 'vm',
    bindings: {
      stores: '<storesData',
      vendors: '=vendorsData',
      vendorHashes: '<vendorHashes',
      totalCoins: '<totalCoins'
    },
    template: [
      '<div class="vendor-char-items" ng-repeat="(idx, vendorHash) in vm.vendorHashes" ng-init="firstVendor = vm.vendors[0][vendorHash]">',
      ' <div ng-if="firstVendor">',
      '   <div class="vendor-header">',
      '     <div class="title">',
      '     {{firstVendor.vendorName}}',
      '     <img class="vendor-icon" ng-src="{{::firstVendor.vendorIcon | bungieIcon}}" />',
      '     <timer class="vendor-timer" ng-if="firstVendor.nextRefreshDate[0] !== \'9\'" end-time="firstVendor.nextRefreshDate" max-time-unit="\'day\'" interval="1000">{{days}} day{{daysS}} {{hhours}}:{{mminutes}}:{{sseconds}}</timer>',
      '     </div>',
      '   </div>',
      '   <div class="vendor-row">',
      '     <div class="char-cols store-cell" ng-repeat="store in vm.stores | sortStores:vm.settings.characterOrder track by store.id">',
      '       <div ng-if="store.vendors[vendorHash].items.armor.length">',
      '         <h3 ng-if="store.vendors[vendorHash].items.armor.length && store.vendors[vendorHash].items.weapons.length" translate="Armor"></h3>',
      '         <div class="vendor-armor">',
      '           <dim-vendor-item ng-repeat="saleItem in store.vendors[vendorHash].items.armor" sale-item="saleItem" cost="store.vendors[vendorHash].costs[saleItem.hash]" total-coins="vm.totalCoins" item-clicked="vm.itemClicked(saleItem, $event)"></dim-vendor-item>',
      '         </div>',
      '       </div>',
      '       <div ng-if="store.vendors[vendorHash].items.weapons.length">',
      '         <h3 ng-if="store.vendors[vendorHash].items.armor.length && store.vendors[vendorHash].items.weapons.length" translate="Weapons"></h3>',
      '         <div class="vendor-weaps">',
      '           <dim-vendor-item ng-repeat="saleItem in store.vendors[vendorHash].items.weapons" sale-item="saleItem" cost="store.vendors[vendorHash].costs[saleItem.hash]" total-coins="vm.totalCoins" item-clicked="vm.itemClicked(saleItem, $event)"></dim-vendor-item>',
      '         </div>',
      '       </div>',
      '     </div>',
      '   </div>',
      ' </div>',
      '</div>'
    ].join('')
  };

  var VendorItemsCombined = {
    controller: VendorItemsCtrl,
    controllerAs: 'vm',
    bindings: {
      stores: '<storesData',
      vendors: '=vendorsData',
      vendorHashes: '<vendorHashes',
      totalCoins: '<totalCoins'
    },
    template: [
      '<div class="vendor-char-items" ng-init="firstVendor = vm.vendors[0][vm.vendorHashes[0]]">',
      '  <div ng-if="firstVendor">',
      '    <div class="vendor-header">',
      '      <div class="title">',
      '        <span translate="Vanguard"></span>',
      '        <img class="vendor-icon" ng-src="{{::firstVendor.vendorIcon | bungieIcon}}" />',
      '        <timer class="vendor-timer" ng-if="firstVendor.nextRefreshDate[0] !== \'9\'" end-time="firstVendor.nextRefreshDate" max-time-unit="\'day\'" interval="1000">{{days}} day{{daysS}} {{hhours}}:{{mminutes}}:{{sseconds}}</timer>',
      '      </div>',
      '    </div>',
      '    <div class="vendor-row">',
      '      <div class="char-cols store-cell" ng-repeat="store in vm.stores | sortStores:vm.settings.characterOrder track by store.id">',
      '        <div ng-repeat="(idx, vendorHash) in vm.vendorHashes">',
      '          <h3 ng-if="store.vendors[vendorHash].items.armor.length && store.vendors[vendorHash].items.weapons.length" translate="Armor"></h3>',
      '          <div class="vendor-armor">',
      '            <dim-vendor-item ng-repeat="saleItem in store.vendors[vendorHash].items.armor" sale-item="saleItem" cost="store.vendors[vendorHash].costs[saleItem.hash]" total-coins="vm.totalCoins" item-clicked="vm.itemClicked(saleItem, $event)"></dim-vendor-item>',
      '          </div>',
      '          <h3 ng-if="store.vendors[vendorHash].items.armor.length && store.vendors[vendorHash].items.weapons.length" translate="Weapons"></h3>',
      '          <div class="vendor-weaps">',
      '            <dim-vendor-item ng-repeat="saleItem in store.vendors[vendorHash].items.weapons" sale-item="saleItem" cost="store.vendors[vendorHash].costs[saleItem.hash]" total-coins="vm.totalCoins" item-clicked="vm.itemClicked(saleItem, $event)"></dim-vendor-item>',
      '          </div>',
      '        </div>',
      '      </div>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('')
  };

  angular.module('dimApp')
    .component('dimVendorItem', VendorItem)
    .component('dimVendorItems', VendorItems)
    .component('dimVendorItemsCombined', VendorItemsCombined)
    .filter('sortStores', function() {
      return function sortStores(stores, order) {
        if (order === 'mostRecent') {
          return _.sortBy(stores, 'lastPlayed').reverse();
        } else if (order === 'mostRecentReverse') {
          return _.sortBy(stores, function(store) {
            if (store.isVault) {
              return Infinity;
            } else {
              return store.lastPlayed;
            }
          });
        } else {
          return _.sortBy(stores, 'id');
        }
      };
    });

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
