(function() {
  'use strict';

  angular.module('dimApp')
    .controller('dimInfuseCtrl', dimInfuseCtrl);

  dimInfuseCtrl.$inject = ['$scope', 'dimStoreService', 'dimItemService', 'ngDialog', 'dimLoadoutService', 'toaster', '$q'];

  function dimInfuseCtrl($scope, dimStoreService, dimItemService, ngDialog, dimLoadoutService, toaster, $q) {
    var vm = this;

    angular.extend(vm, {
      getAllItems: true,
      showLockedItems: false,
      target: null,
      exotic: false,
      infused: 0,
      infusable: [],
      transferInProgress: false,

      setSourceItem: function(item) {
        // Set the source and reset the targets
        vm.source = item;
        vm.infused = 0;
        vm.target = null;
        vm.exotic = item.tier === 'Exotic';
        vm.statType =
          vm.source.primStat.statHash === 3897883278 ? 'Defense' // armor item
          : vm.source.primStat.statHash === 368428387 ? 'Attack' // weapon item
          : 'Unknown'; // new item?
        vm.wildcardMaterialIcon = item.bucket.sort === 'General' ? '2e026fc67d445e5b2630277aa794b4b1'
          : vm.statType === 'Attack' ? 'f2572a4949fb16df87ba9760f713dac3'
          : '972ae2c6ccbf59cde293a2ed50a57a93';
        vm.wildcardMaterialIcon = '/common/destiny_content/icons/' + vm.wildcardMaterialIcon + '.jpg';
        // 2 motes, or 10 armor/weapon materials
        vm.wildcardMaterialCost = item.bucket.sort === 'General' ? 2 : 10;
      },

      selectItem: function(item, e) {
        if (e) {
          e.stopPropagation();
        }
        vm.target = item;
        vm.infused = vm.target.primStat.value;
      },

      // get Items for infusion
      getItems: function() {
        var stores = dimStoreService.getStores();
        var allItems = [];

        // If we want ALL our weapons, including vault's one
        if (!vm.getAllItems) {
          stores = _.filter(stores, function(store) {
            return store.id === vm.source.owner;
          });
        }

        // all stores
        stores.forEach(function(store) {
          // all items in store
          var items = _.filter(store.items, function(item) {
            return item.primStat &&
              (!item.locked || vm.showLockedItems) &&
              item.type === vm.source.type &&
              item.primStat.value > vm.source.primStat.value;
          });

          allItems = allItems.concat(items);
        });

        allItems = _.sortBy(allItems, function(item) {
          return item.primStat.value + ((item.talentGrid.totalXP / item.talentGrid.totalXPRequired) * 0.5);
        });

        vm.infusable = allItems;
        if (allItems.length) {
          vm.selectItem(allItems[allItems.length - 1]);
        } else {
          vm.target = null;
          vm.infused = 0;
        }
      },

      closeDialog: function() {
        $scope.$parent.closeThisDialog();
      },

      transferItems: function() {
        if (vm.target.notransfer) {
          toaster.pop('error', 'Transfer infusion material', vm.target.name + " can't be moved.");
          return $q.resolve();
        }
        var store = dimStoreService.getStore(vm.source.owner);
        var items = {};
        var key = vm.target.type.toLowerCase();
        items[key] = items[key] || [];
        var itemCopy = angular.copy(vm.target);
        itemCopy.equipped = false;
        items[key].push(itemCopy);
        // Include the source, since we wouldn't want it to get moved out of the way
        items[vm.source.type.toLowerCase()].push(vm.source);

        items.material = [];
        if (vm.target.bucket.sort === 'General') {
          // Mote of Light
          items.material.push({
            id: '0',
            hash: 937555249,
            amount: 2,
            equipped: false
          });
        } else if (vm.statType === 'Attack') {
          // Weapon Parts
          items.material.push({
            id: '0',
            hash: 1898539128,
            amount: 10,
            equipped: false
          });
        } else {
          // Armor Materials
          items.material.push({
            id: '0',
            hash: 1542293174,
            amount: 10,
            equipped: false
          });
        }
        if (vm.exotic) {
          // Exotic shard
          items.material.push({
            id: '0',
            hash: 452597397,
            amount: 1,
            equipped: false
          });
        }

        var loadout = {
          classType: -1,
          name: 'Infusion Materials',
          items: items
        };

        vm.transferInProgress = true;
        return dimLoadoutService.applyLoadout(store, loadout).then(function() {
          vm.transferInProgress = false;
        });
      }
    });

    vm.setSourceItem($scope.$parent.ngDialogData);
    vm.getItems();
  }
})();
