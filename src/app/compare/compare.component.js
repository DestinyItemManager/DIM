import angular from 'angular';
import _ from 'underscore';
import template from './compare.html';
import './compare.scss';

export function StatRangeFilter() {
  // Turns a stat and a list of ranges into a 0-100 scale
  return function(stat, statRanges) {
    const statRange = statRanges[stat.statHash];
    if (stat.qualityPercentage) {
      return stat.qualityPercentage.min;
    }

    if (!statRange.enabled) {
      return -1;
    }

    return 100 * (stat.value - statRange.min) / (statRange.max - statRange.min);
  };
}

export const CompareComponent = {
  controller: CompareCtrl,
  controllerAs: 'vm',
  template
};

function CompareCtrl($scope, toaster, dimCompareService, dimStoreService, D2StoresService, $i18next) {
  'ngInject';

  const vm = this;

  function getStoreService(item) {
    return item.destinyVersion === 2 ? D2StoresService : dimStoreService;
  }

  vm.tagsEnabled = $featureFlags.tagsEnabled;
  vm.show = dimCompareService.dialogOpen;

  vm.comparisons = [];
  vm.statRanges = {};

  $scope.$on('dim-store-item-compare', (event, args) => {
    vm.show = true;
    dimCompareService.dialogOpen = true;

    vm.add(args);
  });

  vm.cancel = function cancel() {
    vm.comparisons = [];
    vm.statRanges = {};
    vm.similarTypes = [];
    vm.archeTypes = [];
    vm.highlight = null;
    vm.sortedHash = null;
    vm.show = false;
    dimCompareService.dialogOpen = false;
  };

  vm.compareSimilar = function(type) {
    vm.comparisons = type === 'archetype' ? vm.archeTypes : vm.similarTypes;
  };

  vm.sort = function(statHash) {
    vm.sortedHash = statHash;
    vm.comparisons = _.sortBy(_.sortBy(_.sortBy(vm.comparisons, 'index'), 'name').reverse(), (item) => {
      const stat = _.find(item.stats, { statHash: statHash }) || item.primStat;
      return stat.value;
    }).reverse();
  };

  vm.add = function add(args) {
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
      vm.similarTypes = _.filter(allItems, { typeName: vm.compare.typeName });
      let armorSplit;
      if (!vm.compare.location.inWeapons) {
        vm.similarTypes = _.filter(vm.similarTypes, { classType: vm.compare.classType });
        armorSplit = _.reduce(vm.compare.stats, (memo, stat) => {
          return memo + (stat.base === 0 ? 0 : stat.statHash);
        }, 0);
      }

      // 4284893193 is RPM in D2
      const archetypeStat = _.find(vm.compare.stats, {
        statHash: (vm.compare.destinyVersion === 1
          ? vm.compare.stats[0].statHash
          : 4284893193)
      });
      if (archetypeStat) {
        vm.archeTypes = _.filter(vm.similarTypes, (item) => {
          if (item.location.inWeapons) {
            const archetypeMatch = _.find(item.stats, {
              statHash: (vm.compare.destinyVersion === 1
                ? vm.compare.stats[0].statHash
                : 4284893193)
            });
            if (!archetypeMatch) {
              return false;
            }
            return archetypeMatch.base === archetypeStat.base;
          }
          return _.reduce(item.stats, (memo, stat) => {
            return memo + (stat.base === 0 ? 0 : stat.statHash);
          }, 0) === armorSplit;
        });
      }

      vm.comparisons = _.filter(allItems, { hash: vm.compare.hash });
    } else if (!_.findWhere(vm.comparisons, { hash: args.item.hash, id: args.item.id })) {
      vm.comparisons.push(args.item);
    }
  };

  vm.remove = function remove(item) {
    vm.comparisons = vm.comparisons.filter((compare) => {
      return compare.index !== item.index;
    });

    if (!vm.comparisons.length) {
      vm.cancel();
    }
  };

  vm.itemClick = function itemClick(item) {
    const element = angular.element(document.getElementById(item.index));
    const elementRect = element[0].getBoundingClientRect();
    const absoluteElementTop = elementRect.top + window.pageYOffset;
    window.scrollTo(0, absoluteElementTop - 150);
    element.addClass('item-pop');
    element.on('webkitAnimationEnd oanimationend msAnimationEnd animationend', () => {
      element.removeClass('item-pop');
    });
  };

  $scope.$watch('vm.comparisons', () => {
    const statBuckets = {};

    function bucketStat(stat) {
      (statBuckets[stat.statHash] = statBuckets[stat.statHash] || []).push(stat.value);
    }

    vm.comparisons.forEach((item) => {
      if (item.stats) {
        item.stats.forEach(bucketStat);
        bucketStat(item.primStat);
      }
    });

    vm.statRanges = {};
    _.each(statBuckets, (bucket, hash) => {
      const statRange = {
        min: Math.min(...bucket),
        max: Math.max(...bucket)
      };
      statRange.enabled = statRange.min !== statRange.max;
      vm.statRanges[hash] = statRange;
    });
  }, true);
}
