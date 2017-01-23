import angular from 'angular';

angular.module('dimApp')
  .directive('dimSimpleItem', dimItem);

function dimItem() {
  return {
    replace: true,
    scope: {
      item: '=itemData'
    },
    restrict: 'E',
    template: [
      '<div title="{{ vm.item.primStat.value }} {{ vm.item.name }}" alt="{{ vm.item.primStat.value }} {{ vm.item.name }}" class="item">',
      '  <div class="item-elem" ng-class="{ complete: vm.item.complete }">',
      '    <div class="img" ng-style="vm.item.icon | bungieBackground">',
      '    <span ng-class="vm.item.dimInfo.tag | tagIcon"></span>',
      '    <div ng-if="vm.item.quality" class="item-stat item-quality" ng-style="vm.item.quality.min | qualityColor">{{ vm.item.quality.min }}%</div>',
      '    <div class="item-stat item-equipment stat-damage-{{::vm.item.dmg}}" ng-class="{\'item-stat-no-bg\': (vm.item.quality && vm.item.quality.min > 0) }" ng-if="vm.item.primStat.value || vm.item.maxStackSize > 1">{{ vm.item.primStat.value || vm.item.amount }}</div>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join(''),
    bindToController: true,
    controllerAs: 'vm',
    controller: dimItemSimpleCtrl
  };
}


function dimItemSimpleCtrl() {
  // nothing to do here...only needed for bindToController
}

