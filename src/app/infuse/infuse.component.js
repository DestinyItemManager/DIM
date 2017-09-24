import angular from 'angular';
import _ from 'underscore';
import { flatMap, sum } from '../util';
import template from './infuse.html';
import './infuse.scss';

export const InfuseComponent = {
  template,
  bindings: {
    source: '<'
  },
  controller: InfuseCtrl,
  controllerAs: 'vm'
};

function InfuseCtrl($scope, dimStoreService, D2StoresService, dimDefinitions, D2Definitions, dimLoadoutService, toaster, $q, $i18next) {
  'ngInject';

  const vm = this;

  vm.items = {};
  if (vm.source.destinyVersion === 1) {
    dimDefinitions.getDefinitions().then((defs) => {
      [
        452597397,
        2534352370,
        3159615086,
        937555249,
        1898539128,
        1542293174
      ].forEach((hash) => {
        vm.items[hash] = defs.InventoryItem.get(hash);
      });
    });
  }

  angular.extend(vm, {
    getAllItems: true,
    showLockedItems: false,
    target: null,
    exotic: false,
    infused: 0,
    infusable: [],
    transferInProgress: false,

    $onInit: function() {
      // Set the source and reset the targets
      vm.infused = 0;
      vm.target = null;
      vm.exotic = vm.source.tier === 'Exotic';
      vm.stat = vm.source.primStat.stat;
      if (vm.source.bucket.sort === 'General') {
        vm.wildcardMaterialCost = 2;
        vm.wildcardMaterialHash = 937555249;
      } else if (vm.stat.statIdentifier === 'STAT_DAMAGE') {
        vm.wildcardMaterialCost = 10;
        vm.wildcardMaterialHash = 1898539128;
      } else {
        vm.wildcardMaterialCost = 10;
        vm.wildcardMaterialHash = 1542293174;
      }

      vm.getItems();
    },

    selectItem: function(item, e) {
      if (e) {
        e.stopPropagation();
      }
      vm.target = item;
      vm.infused = vm.target.primStat.value;

      if (vm.source.destinyVersion === 2) {
        /*
        // Rules taken from https://bungie-net.github.io/multi/schema_Destiny-Definitions-Items-DestinyItemTierTypeInfusionBlock.html#schema_Destiny-Definitions-Items-DestinyItemTierTypeInfusionBlock
        const sourceBasePower = vm.source.basePower;
        const targetBasePower = vm.target.basePower;
        const powerDiff = Math.max(0, targetBasePower - sourceBasePower);
        const quality = vm.target.infusionProcess;
        const transferAmount = powerDiff * quality.baseQualityTransferRatio;
        const increase = Math.min(powerDiff, Math.max(transferAmount, quality.minimumQualityIncrement));
        vm.infused = vm.source.primStat.value + increase;
        */

        // Folks report that that formula isn't really what's used,
        // and that you just always get the full value.
        // https://github.com/DestinyItemManager/DIM/issues/2215
        console.log(vm.target.infusionProcess.baseQualityTransferRatio);
        vm.infused = vm.source.basePower;
      }
    },

    // get Items for infusion
    getItems: function() {
      let stores = vm.source.destinyVersion === 1 ? dimStoreService.getStores() : D2StoresService.getStores();

      // If we want ALL our weapons, including vault's one
      if (!vm.getAllItems) {
        stores = _.filter(stores, (store) => {
          return store.id === vm.source.owner;
        });
      }

      // all stores
      let allItems = flatMap(stores, (store) => {
        // all items in store
        return _.filter(store.items, (item) => {
          if (item.name === 'Rat King') {
            console.log(item.name, item.infusionQuality);
          }
          return item.primStat &&
            item.year !== 1 &&
            (!item.locked || vm.showLockedItems) &&
            (vm.source.destinyVersion === 1
              ? (item.type === vm.source.type)
              : (item.infusionQuality && (item.infusionQuality.infusionCategoryName === vm.source.infusionQuality.infusionCategoryName))) &&
            item.primStat.value > vm.source.primStat.value;
        });
      });

      allItems = _.sortBy(allItems, (item) => {
        return item.primStat.value + (item.talentGrid ? ((item.talentGrid.totalXP / item.talentGrid.totalXPRequired) * 0.5) : 0);
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
        toaster.pop('error', $i18next.t('Infusion.NoTransfer', { target: vm.target.name }));
        return $q.resolve();
      }
      const store = dimStoreService.getStore(vm.source.owner);
      const items = {};
      const key = vm.target.type.toLowerCase();
      items[key] = items[key] || [];
      const itemCopy = angular.copy(vm.target);
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

      const loadout = {
        classType: -1,
        name: $i18next.t('Infusion.InfusionMaterials'),
        items: items
      };

      vm.transferInProgress = true;
      return dimLoadoutService.applyLoadout(store, loadout).then(() => {
        vm.transferInProgress = false;
      });
    }
  });
}
