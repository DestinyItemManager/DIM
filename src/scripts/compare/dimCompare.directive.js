import angular from 'angular';
import _ from 'underscore';
import template from './dimCompare.directive.html';

angular.module('dimApp')
  .directive('dimCompare', Compare)
  .filter('statRange', () => {
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
  });


function Compare() {
  return {
    controller: CompareCtrl,
    controllerAs: 'vm',
    bindToController: true,
    scope: {},
    template: template
  };
}


function CompareCtrl($scope, toaster, dimCompareService, dimItemService, $translate) {
  const vm = this;
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
    vm.comparisons = _.union(vm.comparisons, type === 'archetype' ? vm.archeTypes : vm.similarTypes);
  };

  vm.sort = function(statHash) {
    vm.sortedHash = statHash;
    vm.comparisons = _.sortBy(_.sortBy(_.sortBy(vm.comparisons, 'index'), 'name').reverse(), (item) => {
      const stat = _.find(item.stats, { statHash: statHash }) || item.primStat;
      return stat.value;
    }).reverse();
  };

  vm.add = function add(args) {
    if (!args.item.talentGrid || !args.item.equipment) {
      return;
    }

    if (vm.comparisons.length && vm.comparisons[0].typeName && args.item.typeName !== vm.comparisons[0].typeName) {
      if (vm.comparisons[0].classType && args.item.classType !== vm.comparisons[0].classType) {
        toaster.pop('warning', args.item.name, $translate.instant('Compare.Error.Class', { class: vm.comparisons[0].classTypeNameLocalized }));
        return;
      }
      toaster.pop('warning', args.item.name, $translate.instant('Compare.Error.Archetype', { type: vm.comparisons[0].typeName }));
      return;
    }

    if (args.dupes) {
      vm.compare = args.item;
      vm.similarTypes = _.where(dimItemService.getItems(), { typeName: vm.compare.typeName });
      let armorSplit;
      if (!vm.compare.location.inWeapons) {
        vm.similarTypes = _.where(vm.similarTypes, { classType: vm.compare.classType });
        armorSplit = _.reduce(vm.compare.stats, (memo, stat) => {
          return memo + (stat.base === 0 ? 0 : stat.statHash);
        }, 0);
      }

      vm.archeTypes = _.filter(vm.similarTypes, (item) => {
        if (item.location.inWeapons) {
          const arch = _.find(item.stats, { statHash: vm.compare.stats[0].statHash });
          if (!arch) {
            return false;
          }
          return arch.base === _.find(vm.compare.stats, { statHash: vm.compare.stats[0].statHash }).base;
        }
        return _.reduce(item.stats, (memo, stat) => {
          return memo + (stat.base === 0 ? 0 : stat.statHash);
        }, 0) === armorSplit;
      });
      vm.comparisons = _.where(dimItemService.getItems(), { hash: vm.compare.hash });
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
    const element = angular.element(`#${item.index}`);
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
      item.stats.forEach(bucketStat);
      bucketStat(item.primStat);
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
