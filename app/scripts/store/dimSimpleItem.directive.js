(function() {
  'use strict';

  angular.module('dimApp').component('dimSimpleItem', {
    replace: true,
    bindings: {
      item: '=itemData'
    },
    template: `
      <div title="{{ vm.item.primStat.value }} {{:: vm.item.name }}" alt="{{ vm.item.primStat.value }} {{:: vm.item.name }}" class="item">
        <div class="item-elem" ng-class="{ complete: vm.item.complete }">
          <div class="img" dim-bungie-image-fallback="::vm.item.icon">
          <div ng-if="vm.item.quality" class="item-stat item-quality" ng-style="vm.item.quality.min | qualityColor">{{ vm.item.quality.min }}%</div>
          <div class="item-stat item-equipment stat-damage-{{::vm.item.dmg}}" ng-class="{\'item-stat-no-bg\': (vm.item.quality && vm.item.quality.min > 0) }" ng-if="vm.item.primStat.value || vm.item.maxStackSize > 1">{{ vm.item.primStat.value || vm.item.amount }}</div>
          </div>
        </div>
      </div>
    `,
    controllerAs: 'vm'
  });
})();
