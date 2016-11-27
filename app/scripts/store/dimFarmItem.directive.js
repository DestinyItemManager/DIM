(function() {
  'use strict';

  angular.module('dimApp')
        .directive('dimFarmItem', dimItem);

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
        '    <div class="item-stat item-equipment stat-damage-{{::vm.item.dmg}}" ng-class="{\'item-stat-no-bg\': (vm.item.quality && vm.item.quality.min > 0) }" ng-if="vm.item.primStat.value || vm.item.maxStackSize > 1 || vm.item.farmReport">{{ vm.item.primStat.value || vm.item.amount }}</div>',
        '    </div>',
        '  </div>',
        '</div>'
      ].join(''),
      bindToController: true,
      controllerAs: 'vm',
      controller: dimItemFarmCtrl
    };
  }

  dimItemFarmCtrl.$inject = [];

  function dimItemFarmCtrl() {
        // nothing to do here...only needed for bindToController
  }

  var FarmReputation = {
    controllerAs: 'vm',
    bindings: {
      item: '<itemData'
    },
    template: `
      <div class="unequipped" ng-class="{'farm-rank-up': vm.item.rankedUp}">
        <div class="item" title="{{vm.item.faction.factionName}}\n{{vm.item.progressToNextLevel}}/{{vm.item.nextLevelAt}}\n{{\'Level\' | translate}}: {{vm.item.level}}">
          <svg width="48" height="48">
            <image xlink:href="" ng-attr-xlink:href="{{vm.item.faction.factionIcon | bungieIcon}}" width="48" height="48" />
            <polygon stroke-dasharray="121.622368" ng-if="vm.item.progressToNextLevel > 0" style="stroke-dashoffset:{{121.622368-(121.622368*vm.item.progressToNextLevel/vm.item.nextLevelAt)}}" fill-opacity="0" stroke="#FFF" stroke-width="3" points="24,2.5 45.5,24 24,45.5 2.5,24" stroke-linecap="butt"/>
          </svg>
          <div class="item-stat item-faction">+{{vm.item.xpGain}}</div>
        </div>
      </div>`
  };

  angular.module('dimApp')
    .component('dimFarmReputation', FarmReputation);
})();
