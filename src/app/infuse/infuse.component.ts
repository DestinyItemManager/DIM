import { extend, copy, IComponentOptions, IController, IQService } from 'angular';
import * as _ from 'underscore';
import { flatMap } from '../util';
import { getDefinitions } from '../destiny1/d1-definitions.service';
import template from './infuse.html';
import './infuse.scss';
import { StoreServiceType } from '../inventory/d2-stores.service';
import { LoadoutServiceType, Loadout } from '../loadout/loadout.service';

export const InfuseComponent: IComponentOptions = {
  template,
  bindings: {
    query: '<'
  },
  controller: InfuseCtrl,
  controllerAs: 'vm'
};

function InfuseCtrl(
  this: IController,
  $scope,
  dimStoreService: StoreServiceType,
  D2StoresService: StoreServiceType,
  dimLoadoutService: LoadoutServiceType,
  toaster,
  $q: IQService,
  $i18next
) {
  'ngInject';

  const vm = this;

  vm.items = {};
  if (vm.query.destinyVersion === 1) {
    getDefinitions().then((defs) => {
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

  extend(vm, {
    getAllItems: true,
    showLockedItems: false,
    source: null,
    target: null,
    infused: 0,
    sourceItems: [],
    targetItems: [],
    transferInProgress: false,

    $onInit() {
      // Set the source and reset the targets
      vm.infused = 0;
      vm.target = null;

      vm.getItems();
    },

    setSourceAndTarget(source, target, e) {
      if (e) {
        e.stopPropagation();
      }
      vm.source = source;
      vm.target = target;

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
        vm.infused = vm.target.basePower + (vm.source.primStat.value - vm.source.basePower);
      } else if (vm.source.bucket.sort === 'General') {
        vm.wildcardMaterialCost = 2;
        vm.wildcardMaterialHash = 937555249;
      } else if (vm.source.primStat.stat.statIdentifier === 'STAT_DAMAGE') {
        vm.wildcardMaterialCost = 10;
        vm.wildcardMaterialHash = 1898539128;
      } else {
        vm.wildcardMaterialCost = 10;
        vm.wildcardMaterialHash = 1542293174;
      }

      vm.result = copy(vm.source);
      vm.result.primStat.value = vm.infused;
    },

    // get Items for infusion
    getItems() {
      let stores = vm.query.destinyVersion === 1 ? dimStoreService.getStores() : D2StoresService.getStores();

      // If we want ALL our weapons, including vault's one
      if (!vm.getAllItems) {
        stores = _.filter(stores, (store) => {
          return store.id === vm.query.owner;
        });
      }

      if (vm.query.infusable) {
        let targetItems = flatMap(stores, (store) => {
          return _.filter(store.items, (item) => {
            return (!item.locked || vm.showLockedItems) && vm.isInfusable(vm.query, item);
          });
        });

        targetItems = _.sortBy(targetItems, vm.itemToSortKey);

        vm.targetItems = targetItems;
      }

      let sourceItems = flatMap(stores, (store) => {
        return _.filter(store.items, (item) => {
          return (!item.locked || vm.showLockedItems) && vm.isInfusable(item, vm.query);
        });
      });

      sourceItems = _.sortBy(sourceItems, vm.itemToSortKey);

      vm.sourceItems = sourceItems;

      vm.target = null;
      vm.infused = 0;
    },

    isInfusable(source, target) {
      if (!source.infusable || !target.infusionFuel) {
        return false;
      }

      if (source.destinyVersion !== target.destinyVersion) {
        return false;
      }

      if (source.destinyVersion === 1) {
        return (source.type === target.type) && (source.primStat.value < target.primStat.value);
      }

      if (source.destinyVersion === 2) {
        return source.infusionQuality && target.infusionQuality &&
               (source.infusionQuality.infusionCategoryHashes.some((h) => target.infusionQuality.infusionCategoryHashes.includes(h))) &&
               (source.basePower < target.basePower);
      }

      // Don't try to apply logic for unknown Destiny versions.
      return false;
    },

    itemToSortKey(item) {
      return -((item.basePower || item.primStat.value) +
      (item.talentGrid ? ((item.talentGrid.totalXP / item.talentGrid.totalXPRequired) * 0.5) : 0));
    },

    closeDialog() {
      $scope.$parent.closeThisDialog();
    },

    transferItems() {
      if (vm.target.notransfer || vm.source.notransfer) {
        const name = vm.source.notransfer ? vm.source.name : vm.target.name;

        toaster.pop('error', $i18next.t('Infusion.NoTransfer', { target: name }));
        return $q.resolve();
      }

      const store = (vm.source.destinyVersion === 1 ? dimStoreService : D2StoresService).getStore(vm.query.owner)!;
      const items: { [key: string]: any[] } = {};
      const targetKey = vm.target.type.toLowerCase();
      items[targetKey] = items[targetKey] || [];
      const itemCopy = copy(vm.target);
      itemCopy.equipped = false;
      items[targetKey].push(itemCopy);
      // Include the source, since we wouldn't want it to get moved out of the way
      const sourceKey = vm.source.type.toLowerCase();
      items[sourceKey] = items[sourceKey] || [];
      items[sourceKey].push(vm.source);

      items.material = [];
      if (vm.target.bucket.sort === 'General') {
        // Mote of Light
        items.material.push({
          id: '0',
          hash: 937555249,
          amount: 2,
          equipped: false
        });
      } else if (vm.source.primStat.stat.statIdentifier === 'STAT_DAMAGE') {
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
      if (vm.source.isExotic) {
        // Exotic shard
        items.material.push({
          id: '0',
          hash: 452597397,
          amount: 1,
          equipped: false
        });
      }

      const loadout: Loadout = {
        classType: -1,
        name: $i18next.t('Infusion.InfusionMaterials'),
        items
      };

      vm.transferInProgress = true;
      return dimLoadoutService.applyLoadout(store, loadout).then(() => {
        vm.transferInProgress = false;
      });
    }
  });
}
