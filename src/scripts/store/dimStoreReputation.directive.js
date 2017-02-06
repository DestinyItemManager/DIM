import angular from 'angular';

var StoreReputation = {
  controllerAs: 'vm',
  bindings: {
    store: '<storeData'
  },
  template: [
    '<div class="sub-section sort-progression">',
    '  <div class="unequipped">',
    '    <div class="item" ng-if="rep.order >= 0" ng-repeat="rep in vm.store.progression.progressions | orderBy:\'order\' track by $index" title="{{rep.faction.factionName}}\n{{rep.progressToNextLevel}}/{{rep.nextLevelAt}}\n{{\'Stats.Level\' | translate}}: {{rep.level}}">',
    '      <svg width="48" height="48">',
    '        <image xlink:href="" ng-attr-xlink:href="{{rep.faction.factionIcon | bungieIcon}}" width="48" height="48" />',
    '        <polygon stroke-dasharray="121.622368" ng-if="rep.progressToNextLevel > 0" style="stroke-dashoffset:{{121.622368-(121.622368*rep.progressToNextLevel/rep.nextLevelAt)}}" fill-opacity="0" stroke="#FFF" stroke-width="3" points="24,2.5 45.5,24 24,45.5 2.5,24" stroke-linecap="butt"/>',
    '      </svg>',
    '      <div class="item-stat item-faction" ng-bind="rep.level"></div>',
    '    </div>',
    '  </div>',
    '</div>'
  ].join('')
};

angular.module('dimApp')
  .component('dimStoreReputation', StoreReputation);