(function() {
  'use strict';

  var VendorItem = {
    bindings: {
      saleItem: '<',
      totalCoins: '<',
      itemClicked: '&'
    },
    template: [
      '<div class="vendor-item">',
      '  <div ng-if="!$ctrl.saleItem.unlocked" class="locked-overlay"></div>',
      '  <dim-simple-item id="vendor-{{::$ctrl.saleItem.hash}}" item-data="$ctrl.saleItem.item" ng-click="$ctrl.itemClicked({ $event: $event })" ng-class="{ \'search-hidden\': !$ctrl.saleItem.item.visible }"></dim-simple-item>',
      '  <div class="vendor-costs">',
      '    <div ng-repeat="cost in $ctrl.saleItem.costs track by cost.currency.itemHash" class="cost" ng-class="{notenough: ($ctrl.totalCoins[saleItem.cost.currency.itemHash] < saleItem.cost.value)}">',
      '      {{::cost.value}}',
      '      <span class="currency"><img ng-src="{{::cost.currency.icon | bungieIcon}}" title="{{::cost.currency.itemName}}"></span>',
      '    </div>',
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
      types: '<displayTypes',
      totalCoins: '<',
      activeTab: '<'
    },
    template: [
      '<div class="vendor-char-items" ng-repeat="(vendorHash, vendor) in vm.vendors | values | vendorTab:vm.activeTab | orderBy:[\'-eventVendor\',\'vendorOrder\'] track by vendor.hash">',
      '   <div class="vendor-header">',
      '     <div class="title">',
      '     {{vendor.name}}',
      '     <img class="vendor-icon" ng-src="{{::vendor.icon | bungieIcon}}" />',
      '     <timer class="vendor-timer" ng-if="vendor.nextRefreshDate[0] !== \'9\'" end-time="vendor.nextRefreshDate" max-time-unit="\'day\'" interval="1000">{{days}} day{{daysS}} {{hhours}}:{{mminutes}}:{{sseconds}}</timer>',
      '     </div>',
      '   </div>',
      '   <dim-vendor-currencies vendor-categories="vendor.categories | vendorTab:vm.activeTab" total-coins="vm.totalCoins"></dim-vendor-currencies>',
      '   <div class="vendor-row">',
      '     <div class="char-cols">',
      '       <div class="vendor-category" ng-repeat="category in vendor.categories | vendorTab:vm.activeTab track by category.index">',
      '          <h3 class="category-title">{{category.title}}</h3>',
      '          <div class="vendor-items">',
      '            <dim-vendor-item ng-repeat="saleItem in category.saleItems | vendorTabItems:vm.activeTab track by saleItem.index" sale-item="saleItem" total-coins="vm.totalCoins" item-clicked="vm.itemClicked(saleItem, $event)"></dim-vendor-item>',
      '          </div>',
      '        </div>',
      '      </div>',
      '    </div>',
      '</div>'
    ].join('')
  };

  angular.module('dimApp')
    .component('dimVendorItem', VendorItem)
    .component('dimVendorItems', VendorItems)
    .filter('vendorTab', function() {
      return function vendorTab(categories, prop) {
        return _.filter(categories, prop);
      };
    })
    .filter('vendorTabItems', function() {
      return function vendorTab(items, prop) {
        return _.filter(items, {
          hasArmorWeaps: (saleItem) => (saleItem.item.bucket.sort === 'Weapons' || saleItem.item.bucket.sort === 'Armor' || saleItem.item.type === 'Artifact' || saleItem.item.type === 'Ghost'),
          hasVehicles: (saleItem) => (saleItem.item.type === 'Ship' || saleItem.item.type === 'Vehicle'),
          hasShadersEmbs: (saleItem) => (saleItem.item.type === "Emblem" || saleItem.item.type === "Shader"),
          hasEmotes: (saleItem) => (saleItem.item.type === "Emote"),
          hasConsumables: (saleItem) => (saleItem.item.type === "Material" || saleItem.item.type === "Consumable"),
          hasBounties: (saleItem) => (saleItem.item.type === 'Bounties')
        }[prop]);
      };
    })
    .filter('values', function() {
      return function values(obj) {
        return _.values(obj);
      };
    });

  // TODO: separate out class-specific stuff?

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
      itemClicked: function(saleItem, e) {
        e.stopPropagation();
        if (dialogResult) {
          dialogResult.close();
        }

        const item = saleItem.item;
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
              '  <div class="item-details">',
              '    <div>Available on:</div>',
              '    <div class="unlocked-character" ng-repeat="store in vm.unlockStores | sortStores:vm.settings.characterOrder track by store.id">',
              '      <div class="emblem" ng-style="{ \'background-image\': \'url(\' + store.icon + \')\' }"></div>',
              '      {{store.name}}',
              '    </div>',
              '  </div>',
              '</div>'].join(''),
            plain: true,
            overlay: false,
            className: 'move-popup vendor-move-popup',
            showClose: false,
            scope: angular.extend($scope.$new(true), {
            }),
            controllerAs: 'vm',
            controller: [function() {
              var innerVm = this;
              angular.extend(innerVm, {
                settings: innerVm.settings,
                item: item,
                unlockStores: saleItem.unlockedByCharacter.map((id) => _.find(dimStoreService.getStores(), { id })),
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
