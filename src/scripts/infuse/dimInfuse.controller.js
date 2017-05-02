import angular from 'angular';
import _ from 'underscore';

angular.module('dimApp')
  .controller('dimInfuseCtrl', dimInfuseCtrl);


function dimInfuseCtrl($scope, dimStoreService, dimDefinitions, ngDialog, dimLoadoutService, toaster, $q, $translate) {
  var vm = this;

  vm.i18n = {};
  vm.icon = {};
  dimDefinitions.getDefinitions().then((defs) => {
    vm.i18n.exoticShard = defs.InventoryItem.get(452597397).itemName;
    vm.i18n.legendaryMarks = defs.InventoryItem.get(2534352370).itemName;
    vm.i18n.glimmer = defs.InventoryItem.get(3159615086).itemName;
    vm.i18n.mote = defs.InventoryItem.get(937555249).itemName;
    vm.i18n.weapon = defs.InventoryItem.get(1898539128).itemName;
    vm.i18n.armor = defs.InventoryItem.get(1542293174).itemName;
    vm.icon.mote = defs.InventoryItem.get(937555249).icon;
    vm.icon.weapon = defs.InventoryItem.get(1898539128).icon;
    vm.icon.armor = defs.InventoryItem.get(1542293174).icon;
  });

  if (_gaq) {
    // Disable sending pageviews on popups for now, over concerns that we'll go over our free GA limits.
    // Send a virtual pageview event, even though this is a popup
    // _gaq('send', 'pageview', { page: '/infuse' });
  }

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
      vm.stat = vm.source.primStat.stat;
      if (item.bucket.sort === 'General') {
        vm.wildcardMaterialIcon = vm.icon.mote; // || '/common/destiny_content/icons/2e026fc67d445e5b2630277aa794b4b1.jpg';
        vm.wildcardMaterialCost = 2;
        vm.wilcardMaterial = vm.i18n.mote;
      } else if (vm.stat.statIdentifier === 'STAT_DAMAGE') {
        vm.wildcardMaterialIcon = vm.icon.weapon; // || '/common/destiny_content/icons/f2572a4949fb16df87ba9760f713dac3.jpg';
        vm.wildcardMaterialCost = 10;
        vm.wilcardMaterial = vm.i18n.weapon;
      } else {
        vm.wildcardMaterialIcon = vm.icon.armor; // || '/common/destiny_content/icons/972ae2c6ccbf59cde293a2ed50a57a93.jpg';
        vm.wildcardMaterialCost = 10;
        vm.wilcardMaterial = vm.i18n.armor;
      }
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
            item.year !== 1 &&
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
        toaster.pop('error', $translate.instant('Infusion.NoTransfer', { target: vm.target.name }));
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
      } else if (vm.stat.statIdentifier === 'STAT_DAMAGE') {
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
        name: $translate.instant('Infusion.InfusionMaterials'),
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
