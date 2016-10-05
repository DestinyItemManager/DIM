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
            <label class="dim-button" ng-click="vm.compareSimilar('archetype')">Compare in archetype</label>
            <label class="dim-button" ng-click="vm.compareSimilar()">Compare all {{ vm.similarTypes[0].typeName }}s</label>
            <label class="dim-button" ng-click="vm.cancel()">Close Compare</label>
          </p>
          <div class="compare-bucket">
            <span ng-repeat="item in vm.comparisons track by item.index" class="compare-item">
              <div ng-bind="::item.name"></div>
              <div ng-bind="::item.typeName"></div>
              <div class="stat-box-row" ng-repeat="stat in item.stats track by $index">
                <span ng-bind="::(stat.value + ' ' + stat.name)"></span>
              </div>
              <dim-talent-grid ng-if="item.talentGrid" talent-grid="item.talentGrid"></dim-talent-grid>
              <div class="close" ng-click="vm.remove(item, $event); vm.form.name.$rollbackViewValue(); $event.stopPropagation();"></div>
            </span>
          </div>
        </div>
      `
    };
  }

  CompareCtrl.$inject = ['$scope', 'dimCompareService', 'dimItemService'];

  function CompareCtrl($scope, dimCompareService, dimItemService) {
    var vm = this;
    vm.show = dimCompareService.dialogOpen;

    vm.comparisons = [];

    $scope.$on('dim-store-item-compare', function(event, args) {
      vm.show = true;
      dimCompareService.dialogOpen = true;

      vm.add(args);
    });

    vm.cancel = function cancel() {
      vm.comparisons = [];
      vm.show = false;
      dimCompareService.dialogOpen = false;
    };

    vm.compareSimilar = function(type) {
      vm.comparisons = _.union(vm.comparisons, type === 'archetype' ? vm.archeTypes : vm.similarTypes);
    };

    vm.add = function add(args) {
      if ((!args.item.location.inWeapons && !args.item.location.inArmor) || !args.item.talentGrid || !args.item.equipment) {
        return;
      }

      if (args.dupes) {
        vm.similarTypes = _.where(dimItemService.getItems(), { typeName: args.item.typeName });
        vm.archeTypes = _.filter(dimItemService.getItems(), function(item) {
          var arch = _.find(item.stats, { statHash: 4284893193 });
          if(!arch) {
            return false;
          }
          return item.typeName === args.item.typeName && arch.base === _.find(args.item.stats, { statHash: 4284893193 }).base;
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
      }
    };
  }
})();
