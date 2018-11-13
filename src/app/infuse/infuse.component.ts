import { IComponentOptions, IController, IQService } from 'angular';
import copy from 'fast-copy';
import * as _ from 'lodash';
import { getDefinitions } from '../destiny1/d1-definitions.service';
import template from './infuse.html';
import './infuse.scss';
import { dimLoadoutService } from '../loadout/loadout.service';
import { DimItem } from '../inventory/item-types';
import { chainComparator, compareBy, reverseComparator } from '../comparators';
import { newLoadout } from '../loadout/loadout-utils';

export const InfuseComponent: IComponentOptions = {
  template,
  bindings: {
    query: '<'
  },
  controller: InfuseCtrl,
  controllerAs: 'vm'
};

function InfuseCtrl(
  this: IController & {
    query: DimItem;
    source: DimItem | null;
    target: DimItem | null;
  },
  $scope,
  toaster,
  $q: IQService,
  $i18next
) {
  'ngInject';

  const vm = this;

  Object.assign(vm, {
    items: {},
    getAllItems: true,
    showLockedItems: false,
    source: null,
    target: null,
    infused: 0,
    sourceItems: [],
    targetItems: [],
    sourceItemDupes: [],
    targetItemDupes: [],
    transferInProgress: false,

    $onInit() {
      // Set the source and reset the targets
      vm.infused = 0;
      vm.target = null;

      if (vm.query.destinyVersion === 1) {
        getDefinitions().then((defs) => {
          [452597397, 2534352370, 3159615086, 937555249, 1898539128, 1542293174].forEach((hash) => {
            vm.items[hash] = defs.InventoryItem.get(hash);
          });
        });
      }

      vm.getItems();
    },

    setSourceAndTarget(source, target, e) {
      if (e) {
        e.stopPropagation();
      }
      if (!source || !target) {
        return;
      }
      vm.source = source;
      vm.target = target;

      vm.infused = target.primStat.value;

      if (vm.source!.destinyVersion === 2) {
        vm.infused = target.basePower + (source.primStat.value - source.basePower);
      } else if (source.bucket.sort === 'General') {
        vm.wildcardMaterialCost = 2;
        vm.wildcardMaterialHash = 937555249;
      } else if (source.primStat.stat.statIdentifier === 'STAT_DAMAGE') {
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
      let stores = vm.query.getStoresService().getStores();

      // If we want ALL our weapons, including vault's one
      if (!vm.getAllItems) {
        stores = _.filter(stores, (store) => {
          return store.id === vm.query.owner;
        });
      }

      if (vm.query.infusable) {
        let targetItems = _.flatMap(stores, (store) => {
          return store.items.filter((item) => {
            return (!item.locked || vm.showLockedItems) && vm.isInfusable(vm.query, item);
          });
        });
        targetItems = targetItems.sort(this.itemComparator);

        vm.targetItemDupes = targetItems.filter((item) => item.hash === vm.query.hash);
        vm.targetItems = targetItems.filter((item) => item.hash !== vm.query.hash);
      }

      if (vm.query.infusionFuel) {
        let sourceItems = _.flatMap(stores, (store) => {
          return store.items.filter((item) => {
            return vm.isInfusable(item, vm.query);
          });
        });
        sourceItems = sourceItems.sort(this.itemComparator);

        vm.sourceItemDupes = sourceItems.filter((item) => item.hash === vm.query.hash);
        vm.sourceItems = sourceItems.filter((item) => item.hash !== vm.query.hash);
      }

      vm.target = null;
      vm.infused = 0;
    },

    /**
     * Can source be infused into target?
     */
    isInfusable(source: DimItem, target: DimItem) {
      if (!source.infusable || !target.infusionFuel) {
        return false;
      }

      if (source.destinyVersion !== target.destinyVersion) {
        return false;
      }

      if (source.isDestiny1()) {
        return source.type === target.type && source.primStat!.value < target.primStat!.value;
      } else if (source.isDestiny2() && target.isDestiny2()) {
        return (
          source.infusionQuality &&
          target.infusionQuality &&
          source.infusionQuality.infusionCategoryHashes.some((h) =>
            target.infusionQuality!.infusionCategoryHashes.includes(h)
          ) &&
          source.basePower < target.basePower
        );
      }

      // Don't try to apply logic for unknown Destiny versions.
      return false;
    },

    itemComparator: chainComparator(
      reverseComparator(compareBy((item: DimItem) => item.basePower)),
      reverseComparator(compareBy((item: DimItem) => item.primStat!.value)),
      compareBy((item: DimItem) =>
        item.isDestiny1() && item.talentGrid
          ? (item.talentGrid.totalXP / item.talentGrid.totalXPRequired) * 0.5
          : 0
      )
    ),

    closeDialog() {
      $scope.$parent.closeThisDialog();
    },

    transferItems() {
      const target = vm.target!;
      const source = vm.source!;
      if (target.notransfer || source.notransfer) {
        const name = source.notransfer ? source.name : target.name;

        toaster.pop('error', $i18next.t('Infusion.NoTransfer', { target: name }));
        return $q.resolve();
      }

      const store = source.getStoresService().getActiveStore()!;
      const items: { [key: string]: any[] } = {};
      const targetKey = target.type.toLowerCase();
      items[targetKey] = items[targetKey] || [];
      const itemCopy = copy(target);
      itemCopy.equipped = false;
      items[targetKey].push(itemCopy);
      // Include the source, since we wouldn't want it to get moved out of the way
      const sourceKey = source.type.toLowerCase();
      items[sourceKey] = items[sourceKey] || [];
      items[sourceKey].push(source);

      items.material = [];
      if (target.bucket.sort === 'General') {
        // Mote of Light
        items.material.push({
          id: '0',
          hash: 937555249,
          amount: 2,
          equipped: false
        });
      } else if (source.isDestiny1() && source.primStat!.stat.statIdentifier === 'STAT_DAMAGE') {
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
      if (source.isExotic) {
        // Exotic shard
        items.material.push({
          id: '0',
          hash: 452597397,
          amount: 1,
          equipped: false
        });
      }

      const loadout = newLoadout($i18next.t('Infusion.InfusionMaterials'), items);

      vm.transferInProgress = true;
      return dimLoadoutService.applyLoadout(store, loadout).then(() => {
        vm.transferInProgress = false;
      });
    }
  });
}
