(function() {
  'use strict';

  angular.module('dimApp').directive('dimCompare', Compare);

  Compare.$inject = [];

  function Compare() {
    return {
      controller: CompareCtrl,
      controllerAs: 'vm',
      bindToController: true,
      scope: {},
      templateUrl: 'scripts/compare/dimCompare.directive.html'
    };
  }

  CompareCtrl.$inject = ['$scope', 'toaster', 'dimCompareService', 'dimItemService', 'dimFeatureFlags', '$translate'];

  function CompareCtrl($scope, toaster, dimCompareService, dimItemService, dimFeatureFlags, $translate) {
    var vm = this;
    vm.featureFlags = dimFeatureFlags;
    vm.show = dimCompareService.dialogOpen;

    vm.comparisons = [];
    vm.statRanges = {};

    $scope.$on('dim-store-item-compare', function(event, args) {
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
      vm.comparisons = _.sortBy(_.sortBy(_.sortBy(vm.comparisons, 'index'), 'name').reverse(), function(item) {
        return _.findWhere(item.stats, { statHash: statHash }).value;
      }).reverse();
    };

    vm.add = function add(args) {
      if (!args.item.talentGrid || !args.item.equipment) {
        return;
      }

      if (vm.comparisons.length && vm.comparisons[0].typeName && args.item.typeName !== vm.comparisons[0].typeName) {
        if (vm.comparisons[0].classType && args.item.classType !== vm.comparisons[0].classType) {
          toaster.pop('warning', args.item.name, $translate.instant(Compare.Error.Class, vm.comparisons[0].classType));
          return;
        }
        toaster.pop('warning', args.item.name, $translate.instant(Compare.Error.Archetype, vm.comparisons[0].typeName));
        return;
      }

      if (args.dupes) {
        vm.compare = args.item;
        vm.similarTypes = _.where(dimItemService.getItems(), { typeName: vm.compare.typeName });
        var armorSplit;
        if (!vm.compare.location.inWeapons) {
          vm.similarTypes = _.where(vm.similarTypes, { classType: vm.compare.classType });
          armorSplit = _.reduce(vm.compare.stats, function(memo, stat) {
            return memo + (stat.base === 0 ? 0 : stat.statHash);
          }, 0);
        }

        vm.archeTypes = _.filter(vm.similarTypes, function(item) {
          if (item.location.inWeapons) {
            var arch = _.find(item.stats, { statHash: vm.compare.stats[0].statHash });
            if (!arch) {
              return false;
            }
            return arch.base === _.find(vm.compare.stats, { statHash: vm.compare.stats[0].statHash }).base;
          }
          return _.reduce(item.stats, function(memo, stat) {
            return memo + (stat.base === 0 ? 0 : stat.statHash);
          }, 0) === armorSplit;
        });
        vm.comparisons = _.where(dimItemService.getItems(), { hash: vm.compare.hash });
      } else if (!_.findWhere(vm.comparisons, { hash: args.item.hash, id: args.item.id })) {
        vm.comparisons.push(args.item);
      }
    };

    vm.remove = function remove(item) {
      vm.comparisons = vm.comparisons.filter(function(compare) {
        return compare.index !== item.index;
      });

      if (!vm.comparisons.length) {
        vm.cancel();
        return;
      }
    };

    $scope.$watch('vm.comparisons', function() {
      var statBuckets = {};

      _.each(vm.comparisons, function(item) {
        _.each(item.stats, function(stat) {
          (statBuckets[stat.statHash] = statBuckets[stat.statHash] || []).push(stat.value);
        });
      });

      vm.statRanges = {};
      _.each(statBuckets, function(bucket, hash) {
        vm.statRanges[hash] = {
          min: Math.min(...bucket),
          max: Math.max(...bucket)
        };
      });
    }, true);
  }
})();
