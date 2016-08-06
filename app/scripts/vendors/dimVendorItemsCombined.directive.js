(function() {
  'use strict';

  var VendorItemsCombined = {
    controller: VendorItemsCtrl,
    controllerAs: 'vm',
    bindings: {
      stores: '<storesData',
      vendors: '<vendorsData',
      vendorHashes: '<vendorHashes',
      totalCoins: '<totalCoins'
    },
    template: [
      '<div class="vendor-char-items" ng-init="firstVendor = vm.vendors[0][vm.vendorHashes[0]]">',
      '  <div ng-if="firstVendor">',
      '    <div class="vendor-header">',
      '      <div class="title">',
      '        Vanguard',
      '        <img class="vendor-icon" ng-src="{{firstVendor.vendorIcon}}" />',
      '        <timer class="vendor-timer" ng-if="firstVendor.nextRefreshDate[0] !== \'9\'" style="float:right" end-time="firstVendor.nextRefreshDate" max-time-unit="\'day\'" interval="1000">{{days}} day{{daysS}} {{hhours}}:{{mminutes}}:{{sseconds}}</timer>',
      '      </div>',
      '    </div>',
      '    <div class="vendor-row">',
      '      <div class="char-cols store-cell" ng-repeat="store in vm.stores | sortStores:vm.settings.characterOrder track by store.id">',
      '        <div ng-repeat="(idx, vendorHash) in vm.vendorHashes" ng-init="armor = store.vendors[vendorHash].items.armor; weapons = store.vendors[vendorHash].items.weapons; costs = store.vendors[vendorHash].costs">',
      '          <div ng-if="store.vendors[vendorHash].items.armor.length">',
      '            <h3>Armor</h3>',
      '            <div class="vendor-armor">',
      '              <div class="vendor-item" ng-repeat="saleItem in armor">',
      '                <dim-simple-item  id="vendor-{{::saleItem.hash}}" item-data="saleItem" ng-click="vm.itemClicked(saleItem, $event)" ng-class="{ \'search-hidden\': !saleItem.visible }"></dim-simple-item>',
      '                <div class="cost" ng-class="{notenough: (vm.totalCoins[costs[saleItem.hash].currency.itemHash] < costs[saleItem.hash].cost)}">',
      '                  {{::costs[saleItem.hash].cost}}/{{vm.totalCoins[costs[saleItem.hash].currency.itemHash]}}',
      '                  <span class="currency"><img dim-bungie-image-fallback="::costs[saleItem.hash].currency.icon" title="{{::costs[saleItem.itemHash].currency.name}}"></span>',
      '                </div>',
      '              </div>',
      '            </div>',
      '            <h3 ng-if="weapons.length">Weapons</h3>',
      '            <div class="vendor-weaps">',
      '              <div class="vendor-item" ng-repeat="saleItem in weapons">',
      '                <dim-simple-item  id="vendor-{{::saleItem.hash}}" item-data="saleItem" ng-click="vm.itemClicked(saleItem, $event)" ng-class="{ \'search-hidden\': !saleItem.visible }"></dim-simple-item>',
      '                <div class="cost" ng-class="{notenough: (vm.totalCoins[costs[saleItem.hash].currency.itemHash] < costs[saleItem.hash].cost)}">',
      '                  {{::costs[saleItem.hash].cost}}/{{vm.totalCoins[costs[saleItem.hash].currency.itemHash]}}',
      '                  <span class="currency"><img dim-bungie-image-fallback="::costs[saleItem.hash].currency.icon" title="{{::costs[saleItem.itemHash].currency.name}}"></span>',
      '                </div>',
      '              </div>',
      '            </div>',
      '          </div>',
      '        </div>',
      '      </div>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('')
  };

  angular.module('dimApp')
    .component('dimVendorItemsCombined', VendorItemsCombined);
    
  VendorItemsCtrl.$inject = ['$scope', 'ngDialog', 'dimStoreService'];
    
  function VendorItemsCtrl($scope, ngDialog, dimStoreService) {
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
