(function() {
  'use strict';

  var VendorItems = {
    controllerAs: 'vm',
    bindings: {
      stores: '<storesData',
      vendors: '<vendorsData',
      vendorHashes: '<vendorHashes',
      totalCoins: '<totalCoins'
    },
    template: [
      '<div class="vendor-char-items" ng-repeat="(idx, vendorHash) in vm.vendorHashes" ng-init="firstVendor = vm.vendors[0][vendorHash]">',
      ' <div ng-if="firstVendor">',
      '   <div class="vendor-header">',
      '     <div class="title">',
      '     {{firstVendor.vendorName}}',
      '     <img class="vendor-icon" ng-src="{{firstVendor.vendorIcon}}" />',
      '     <timer class="vendor-timer" ng-if="firstVendor.nextRefreshDate[0] !== \'9\'" end-time="firstVendor.nextRefreshDate" max-time-unit="\'day\'" interval="1000">{{days}} day{{daysS}} {{hhours}}:{{mminutes}}:{{sseconds}}</timer>',
      '     </div>',
      '   </div>',
      '   <div class="vendor-row">',
      '     <div class="char-cols store-cell" ng-repeat="store in vm.stores | sortStores:vm.settings.characterOrder track by store.id" ng-init="armor = store.vendors[vendorHash].items.armor; weapons = store.vendors[vendorHash].items.weapons; costs = store.vendors[vendorHash].costs">',
      '       <h3 ng-if="armor.length">Armor</h3>',
      '       <div class="vendor-armor">',
      '         <div class="vendor-item" ng-repeat="saleItem in armor">',
      '           <dim-simple-item  id="vendor-{{::saleItem.hash}}" item-data="saleItem" ng-click="vm.itemClicked(saleItem, $event)" ng-class="{ \'search-hidden\': !saleItem.visible }"></dim-simple-item>',
      '           <div class="cost" ng-class="{notenough: (vm.totalCoins[costs[saleItem.hash].currency.itemHash] < costs[saleItem.hash].cost)}">',
      '             {{::costs[saleItem.hash].cost}}/{{vm.totalCoins[costs[saleItem.hash].currency.itemHash]}}',
      '             <span class="currency"><img dim-bungie-image-fallback="::costs[saleItem.hash].currency.icon" title="{{::costs[saleItem.itemHash].currency.name}}"></span>',
      '           </div>',
      '         </div>',
      '       </div>',
      '       <h3 ng-if="weapons.length">Weapons</h3>',
      '       <div class="vendor-weaps">',
      '         <div class="vendor-item" ng-repeat="saleItem in weapons">',
      '           <dim-simple-item  id="vendor-{{::saleItem.hash}}" item-data="saleItem" ng-click="vm.itemClicked(saleItem, $event)" ng-class="{ \'search-hidden\': !saleItem.visible }"></dim-simple-item>',
      '           <div class="cost" ng-class="{notenough: (vm.totalCoins[costs[saleItem.hash].currency.itemHash] < costs[saleItem.hash].cost)}">',
      '             {{::costs[saleItem.hash].cost}}/{{vm.totalCoins[costs[saleItem.hash].currency.itemHash]}}',
      '             <span class="currency"><img dim-bungie-image-fallback="::costs[saleItem.hash].currency.icon" title="{{::costs[saleItem.itemHash].currency.name}}"></span>',
      '           </div>',
      '         </div>',
      '       </div>',
      '     </div>',
      '   </div>',
      ' </div>',
      '</div>'
    ].join('')
  };

  angular.module('dimApp')
    .component('dimVendorItems', VendorItems);
})();
