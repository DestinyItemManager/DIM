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
          <p><label class="dim-button" ng-click="vm.cancel()">Close Compare</label></p>
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

//      vm.comparisons = _.find(dimItemService.getItems(), { hash: args.item.hash });
      vm.add(args.item, args.clickEvent);
    });

    vm.cancel = function cancel() {
      vm.comparisons = [];
      vm.show = false;
      dimCompareService.dialogOpen = false;
    };

    vm.add = function add(item, $event) {
      if ((!item.location.inWeapons && !item.location.inArmor) || !item.talentGrid || !item.equipment) {
        return;
      }

      var clone = angular.copy(item);
      var dupe = _.findWhere(vm.comparisons, { hash: clone.hash, id: clone.id });
      if(!dupe) {
        vm.comparisons.push(clone);
      }
    };

    vm.remove = function remove(item, $event) {
      vm.comparisons = vm.comparisons.filter(function(compare) {
        return compare.index !== item.index;
      });

      if (!vm.comparisons.length) {
        vm.cancel();
      }
    };
  }
})();
