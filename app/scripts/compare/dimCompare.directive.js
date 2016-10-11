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
      template: `
        <div id="loadout-drawer" ng-if="vm.show">
          <p>
            <label ng-if="vm.archeTypes.length > 1" class="dim-button" ng-click="vm.compareSimilar('archetype')">{{ vm.similarTypes[0].location.inWeapons ? 'Compare in archetype' : 'Compare similar splits' }} ({{ vm.archeTypes.length }})</label>
            <label ng-if="vm.similarTypes.length > 1" class="dim-button" ng-click="vm.compareSimilar()">Compare all {{ vm.similarTypes[0].typeName }}{{ vm.similarTypes[0].typeName === 'Gauntlets' ? '' : 's'}} ({{ vm.similarTypes.length }})</label>
            <label class="dim-button" ng-click="vm.cancel()">Close Compare</label>
          </p>
          <div class="compare-bucket" ng-mouseleave="vm.highlight = null">
            <span class="compare-item fixed-left">
              <div>&nbsp;</div>
              <div>&nbsp;</div>
              <div ng-class="{highlight: vm.highlight === stat.statHash, sorted: vm.sortedHash === stat.statHash}" ng-mouseover="vm.highlight = stat.statHash" ng-click="vm.sort(stat.statHash)" ng-repeat="stat in vm.comparisons[0].stats track by $index" ng-bind="::stat.name"></div>
            </span>
            <span ng-repeat="item in vm.comparisons track by item.index" class="compare-item">
              <dim-item-tag ng-if="vm.featureFlags.tagsEnabled" item="item"></dim-item-tag>
              <div ng-bind="::item.name"></div>
              <div ng-class="{highlight: vm.highlight === stat.statHash}" ng-mouseover="vm.highlight = stat.statHash" ng-click="vm.sort(stat.statHash)" ng-repeat="stat in item.stats track by $index" ng-style="vm.similarTypes[0].location.inWeapons ? (stat.value === vm.statRanges[stat.statHash].max ? 100 : (100 * stat.value - vm.statRanges[stat.statHash].min) / vm.statRanges[stat.statHash].max) : (stat.qualityPercentage.min) | qualityColor:'color'">
                <span ng-bind="::stat.value"></span>
                <span ng-if="::stat.qualityPercentage.range" class="range">({{::stat.qualityPercentage.range}})</span>
              </div>
              <dim-talent-grid ng-if="item.talentGrid" talent-grid="item.talentGrid"></dim-talent-grid>
              <div class="close" ng-click="vm.remove(item);"></div>
            </span>
          </div>
        </div>
      `
    };
  }

  CompareCtrl.$inject = ['$scope', 'toaster', 'dimCompareService', 'dimItemService', 'dimFeatureFlags'];

  function CompareCtrl($scope, toaster, dimCompareService, dimItemService, dimFeatureFlags) {
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
          toaster.pop('warning', args.item.name, 'Can not compare this item as it is not for a ' + vm.comparisons[0].classType + '.');
          return;
        }
        toaster.pop('warning', args.item.name, 'Can not compare this item as it is not a ' + vm.comparisons[0].typeName + '.');
        return;
      }

      if (args.dupes) {
        vm.similarTypes = _.where(dimItemService.getItems(), { typeName: args.item.typeName });
        var armorSplit;
        if (!vm.similarTypes[0].location.inWeapons) {
          vm.similarTypes = _.where(vm.similarTypes, { classType: args.item.classType });
          armorSplit = _.reduce(args.item.stats, function(memo, stat) {
            return memo + (stat.base === 0 ? 0 : stat.statHash);
          }, 0);
        }

        vm.archeTypes = _.filter(vm.similarTypes, function(item) {
          if (item.location.inWeapons) {
            var arch = _.find(item.stats, { statHash: args.item.stats[0].statHash });
            if (!arch) {
              return false;
            }
            return arch.base === _.find(args.item.stats, { statHash: args.item.stats[0].statHash }).base;
          }
          return _.reduce(item.stats, function(memo, stat) {
            return memo + (stat.base === 0 ? 0 : stat.statHash);
          }, 0) === armorSplit;
        });
        vm.comparisons = _.where(dimItemService.getItems(), { hash: args.item.hash });
      } else {
        var dupe = _.findWhere(vm.comparisons, { hash: args.item.hash, id: args.item.id });
        if (!dupe) {
          vm.comparisons.push(args.item);
        }
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
