const angular = require('angular');

var FarmReputation = {
  controller: FarmReputationCtrl,
  controllerAs: 'vm',
  bindings: {
    item: '<itemData'
  },
  template: `
  <div class="unequipped" ng-class="{'farm-rank-up': vm.item.rankedUp}" ng-click="vm.service.repClicked(vm.item)">
    <div class="item" title="{{vm.item.faction.factionName}}\n{{vm.item.progressToNextLevel}}/{{vm.item.nextLevelAt}}\n{{'Level' | translate}}: {{vm.item.level}}">
      <svg width="48" height="48">
        <image xlink:href="" ng-attr-xlink:href="{{vm.item.faction.factionIcon | bungieIcon}}" width="48" height="48" />
        <polygon stroke-dasharray="121.622368" ng-if="vm.item.progressToNextLevel > 0" style="stroke-dashoffset:{{121.622368-(121.622368*vm.item.progressToNextLevel/vm.item.nextLevelAt)}}" fill-opacity="0" stroke="#FFF" stroke-width="3" points="24,2.5 45.5,24 24,45.5 2.5,24" stroke-linecap="butt"/>
      </svg>
      <div class="item-stat item-faction">+{{vm.item.xpGain}}</div>
    </div>
  </div>`
};

function FarmReputationCtrl(dimFarmingReportService) {
  var vm = this;

  angular.extend(vm, {
    service: dimFarmingReportService
  });
}

angular.module('dimApp')
  .component('dimFarmReputation', FarmReputation);
