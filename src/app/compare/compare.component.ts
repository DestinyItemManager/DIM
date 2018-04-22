import * as _ from 'underscore';
import template from './compare.html';
import './compare.scss';
import { element as angularElement, IController, IComponentOptions, IScope } from 'angular';
import { sum } from '../util';
import { DimItem } from '../inventory/item-types';
import { StoreServiceType } from '../inventory/store-types';

export function StatRangeFilter() {
  // Turns a stat and a list of ranges into a 0-100 scale
  return (stat, statRanges) => {
    if (!stat) {
      return -1;
    }
    const statRange = statRanges[stat.statHash];
    if (stat.qualityPercentage) {
      return stat.qualityPercentage.min;
    }

    if (!statRange || !statRange.enabled) {
      return -1;
    }

    return 100 * (stat.value - statRange.min) / (statRange.max - statRange.min);
  };
}

export const CompareComponent: IComponentOptions = {
  controller: CompareCtrl,
  controllerAs: 'vm',
  template
};

function CompareCtrl(
  this: IController & {
    comparisons: DimItem[];
    compare: DimItem;
  },
  $scope: IScope,
  toaster,
  dimCompareService,
  dimStoreService: StoreServiceType,
  D2StoresService: StoreServiceType,
  $i18next
) {
  'ngInject';

  const vm = this;

  function getStoreService(item: DimItem) {
    return item.destinyVersion === 2 ? D2StoresService : dimStoreService;
  }

  function addMissingStats(item: DimItem): DimItem {
    if (!item.stats) {
      return item;
    }

    if (!vm.comparisons[0]) {
      item.stats.forEach((stat, idx) => {
        vm.statsMap[stat.id] = { index: idx, name: stat.name };
      });
      return item;
    }
    const itemStatsMap = {};
    item.stats.forEach((stat, idx) => {
      itemStatsMap[stat.id] = { index: idx, name: stat.name };
    });

    _.difference(Object.keys(vm.statsMap), Object.keys(itemStatsMap)).forEach((statId) => {
      item.stats!.splice(vm.statsMap[statId].index, 0, {
        value: undefined,
        id: Number(statId),
        statHash: Number(statId),
        name: vm.statsMap[statId].name,
        missingStat: true,
        // Fill in other required stat values
        base: 0,
        bonus: 0,
        sort: 0,
        maximumValue: 0,
        bar: true
      });
      vm.statRanges[statId] = { min: 0, max: 0, enabled: false };
    });

    _.difference(Object.keys(itemStatsMap), Object.keys(vm.statsMap)).forEach((statId) => {
      Object.keys(vm.statsMap).forEach((statMapId) => {
        if (vm.statsMap[statMapId].index >= itemStatsMap[statId].index) {
          vm.statsMap[statMapId].index++;
        }
      });
      vm.statsMap[statId] = itemStatsMap[statId];

      const missingStatItemIdx = vm.comparisons.findIndex((compItem: DimItem) => !(compItem.stats || []).some((stat) => stat.id === Number(statId)));
      if (missingStatItemIdx >= 0) {
        vm.comparisons[missingStatItemIdx].stats!.splice(vm.statsMap[statId].index, 0, {
          value: undefined,
          id: Number(statId),
          statHash: Number(statId),
          name: itemStatsMap[statId].name,
          missingStat: true,
          // Fill in other required stat values
          base: 0,
          bonus: 0,
          sort: 0,
          maximumValue: 0,
          bar: true
        });
      }
    });
    return item;
  }

  // TODO: Rather than mutating the actual item stats, keep a separate array of just what we need!
  function removeMissingStats() {
    vm.comparisons.forEach((compItem: DimItem) => {
      if (compItem.stats) {
        const statIndex = compItem.stats.findIndex((stat) => Boolean(stat.missingStat));
        if (statIndex >= 0) {
          compItem.stats.splice(statIndex, 1);
        }
      }
    });
  }

  vm.show = dimCompareService.dialogOpen;

  vm.comparisons = [];
  vm.statRanges = {};
  vm.statsMap = {};

  $scope.$on('dim-store-item-compare', (_event, args) => {
    vm.show = true;
    dimCompareService.dialogOpen = true;

    vm.add(args);
  });

  vm.cancel = function cancel() {
    removeMissingStats();
    vm.comparisons = [];
    vm.statRanges = {};
    vm.statsMap = {};
    vm.similarTypes = [];
    vm.archeTypes = [];
    vm.highlight = null;
    vm.sortedHash = null;
    vm.show = false;
    dimCompareService.dialogOpen = false;
  };

  vm.compareSimilar = (type) => {
    vm.comparisons = type === 'archetype' ? vm.archeTypes : vm.similarTypes;
    vm.comparisons.forEach(addMissingStats);
  };

  vm.sort = (statHash) => {
    vm.sortedHash = statHash;
    vm.comparisons = _.sortBy(_.sortBy(_.sortBy(vm.comparisons, 'index'), 'name').reverse(), (item: DimItem) => {
      const stat = (item.primStat && statHash === item.primStat.statHash)
        ? item.primStat
        : (vm.sortedHash === 'Rating'
          ? { value: (item.dtrRating || "0") }
          : (item.stats || []).find((s) => s.statHash === statHash));
      return (stat && stat.value) || -1;
    }).reverse();
  };

  vm.add = function add(args: { item: DimItem; dupes: boolean }) {
    if (!args.item.equipment) {
      return;
    }

    if (vm.comparisons.length && vm.comparisons[0].typeName && args.item.typeName !== vm.comparisons[0].typeName) {
      if (vm.comparisons[0].classType && args.item.classType !== vm.comparisons[0].classType) {
        toaster.pop('warning', args.item.name, $i18next.t('Compare.Error.Class', { class: vm.comparisons[0].classTypeNameLocalized }));
        return;
      }
      toaster.pop('warning', args.item.name, $i18next.t('Compare.Error.Archetype', { type: vm.comparisons[0].typeName }));
      return;
    }

    if (args.dupes) {
      vm.compare = args.item;
      const allItems = getStoreService(args.item).getAllItems();
      vm.similarTypes = allItems.filter((i) => i.typeName === vm.compare.typeName);
      let armorSplit;
      if (!vm.compare.location.inWeapons) {
        vm.similarTypes = vm.similarTypes.filter((i) => i.classType === vm.compare.classType);
        armorSplit = sum(vm.compare.stats!, (stat) => stat.base === 0 ? 0 : stat.statHash);
      }

      // 4284893193 is RPM in D2
      const archetypeStat = _.find(vm.compare.stats!, {
        statHash: (vm.compare.destinyVersion === 1
          ? vm.compare.stats![0].statHash
          : 4284893193)
      });
      if (archetypeStat) {
        vm.archeTypes = vm.similarTypes.filter((item: DimItem) => {
          if (item.location.inWeapons) {
            const archetypeMatch = item.stats!.find((s) =>
              s.statHash === (vm.compare.destinyVersion === 1
                ? vm.compare.stats![0].statHash
                : 4284893193)
            );
            if (!archetypeMatch) {
              return false;
            }
            return archetypeMatch.base === archetypeStat.base;
          }
          return sum(item.stats!, (stat) => stat.base === 0 ? 0 : stat.statHash) === armorSplit;
        });
      }
      vm.comparisons = allItems.filter((i) => i.hash === vm.compare.hash).map(addMissingStats);
    } else if (!_.findWhere(vm.comparisons, { hash: args.item.hash, id: args.item.id })) {
      addMissingStats(args.item);
      vm.comparisons.push(args.item);
    }
  };

  vm.remove = function remove(item: DimItem) {
    vm.comparisons = vm.comparisons.filter((compare) => {
      return compare.index !== item.index;
    });

    if (!vm.comparisons.length) {
      vm.cancel();
    }
  };

  vm.itemClick = function itemClick(item: DimItem) {
    const element = angularElement(document.getElementById(item.index)!);
    if (!element || !element[0]) {
      throw new Error(`No element with id ${item.index}`);
    }
    const elementRect = element[0].getBoundingClientRect();
    const absoluteElementTop = elementRect.top + window.pageYOffset;
    window.scrollTo(0, absoluteElementTop - 150);
    element.addClass('item-pop');
    element.on('webkitAnimationEnd oanimationend msAnimationEnd animationend', () => {
      element.removeClass('item-pop');
    });
  };

  $scope.$watchCollection('vm.comparisons', () => {
    const statBuckets = {};

    function bucketStat(stat: { statHash: number; value?: number }) {
      if (stat && stat.value) {
        (statBuckets[stat.statHash] = statBuckets[stat.statHash] || []).push(stat.value);
      }
    }

    vm.comparisons.forEach((item: DimItem) => {
      if (item.stats && item.primStat) {
        item.stats.forEach(bucketStat);
        bucketStat(item.primStat);
        bucketStat({ statHash: 0, value: (item.dtrRating || 0) });
      }
    });

    vm.statRanges = {};
    _.each(statBuckets, (bucket: any, hash) => {
      const statRange = {
        min: Math.min(...bucket),
        max: Math.max(...bucket),
        enabled: false
      };
      statRange.enabled = statRange.min !== statRange.max;
      vm.statRanges[hash] = statRange;
    });
  });
}
