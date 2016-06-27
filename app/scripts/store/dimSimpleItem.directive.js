(function() {
  'use strict';

  angular.module('dimApp')
    .directive('dimSimpleItem', dimItem);

  dimItem.$inject = ['dimStoreService', 'dimItemService'];

  function dimItem(dimStoreService, dimItemService) {
    return {
      replace: true,
      scope: {
        'item': '=itemData'
      },
      restrict: 'E',
      template: [
        '<div title="{{ vm.item.primStat.value }} {{:: vm.item.name }}" alt="{{ vm.item.primStat.value }} {{:: vm.item.name }}" class="item">',
        '  <div class="item-elem" ng-class="{ complete: vm.item.complete }">',
        '    <div class="img" dim-bungie-image-fallback="::vm.item.icon">',
        '      <div ng-if="vm.item.quality" class="item-stat item-quality" ng-style="vm.item.quality.min | qualityColor">{{ vm.item.quality.min }}%</div>',
        '      <div ng-hide="vm.item.quality" class="item-stat item-equipment stat-damage-{{::vm.item.dmg}}" ng-if="vm.item.primStat.value || vm.item.maxStackSize > 1">{{ vm.item.primStat.value || vm.item.amount }}</div>',
        '      <div ng-hide="!vm.item.quality" class="item-stat item-stat-no-bg item-equipment stat-damage-{{::vm.item.dmg}}" ng-if="vm.item.primStat.value || vm.item.maxStackSize > 1">{{ vm.item.primStat.value || vm.item.amount }}</div>',
        '    </div>',
        '  </div>',
        '</div>'
      ].join(''),
      bindToController: true,
      controllerAs: 'vm',
      controller: dimItemSimpleCtrl
    };
  }

  dimItemSimpleCtrl.$inject = [];

  function dimItemSimpleCtrl() {
    var vm = this;
    // nothing to do here...only needed for bindToController
  }

})();
