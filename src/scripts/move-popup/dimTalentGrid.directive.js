import angular from 'angular';
import _ from 'underscore';

angular.module('dimApp')
  .directive('dimTalentGrid', TalentGrid)
  .filter('talentGridNodes', function() {
    return function(nodes, hiddenColumns) {
      return _.filter(nodes || [], function(node) {
        return !node.hidden && node.column >= hiddenColumns;
      });
    };
  });


function TalentGrid() {
  return {
    bindToController: true,
    controller: TalentGridCtrl,
    controllerAs: 'vm',
    scope: {
      talentGrid: '=',
      perksOnly: '=',
      infuse: '&dimInfuse'
    },
    restrict: 'E',
    replace: true,
    template: [
      '<svg preserveAspectRatio="xMaxYMin meet" svg-bind-viewbox="0 0 {{(vm.numColumns * vm.totalNodeSize - vm.nodePadding) * vm.scaleFactor}} {{(vm.numRows * vm.totalNodeSize - vm.nodePadding) * vm.scaleFactor + 1}}" class="talent-grid" ng-attr-height="{{(vm.numRows * vm.totalNodeSize - vm.nodePadding) * vm.scaleFactor}}" ng-attr-width="{{(vm.numColumns * vm.totalNodeSize - vm.nodePadding) * vm.scaleFactor}}">',
      ' <g ng-attr-transform="scale({{vm.scaleFactor}})">',
      '  <g class="talent-node" ng-attr-transform="translate({{(node.column - vm.hiddenColumns) * (vm.totalNodeSize)}},{{node.row * (vm.totalNodeSize)}})" ng-repeat="node in vm.talentGrid.nodes | talentGridNodes:vm.hiddenColumns track by $index" ng-class="{ \'talent-node-activated\': node.activated, \'talent-node-showxp\': (!node.activated && node.xpRequired), \'talent-node-default\': (node.activated && !node.xpRequired && !node.exclusiveInColumn) }" ng-click="node.hash == 1270552711 ? vm.infuse({\'$event\': $event}) : true">',
      '    <circle r="16" cx="-17" cy="17" transform="rotate(-90)" class="talent-node-xp" ng-attr-stroke-width="{{node.xp ? 2 : 0}}" ng-attr-stroke-dasharray="{{100.0 * node.xp / node.xpRequired}} 100" />',
      '    <image class="talent-node-img" xlink:href="" ng-attr-xlink:href="{{ node.icon | bungieIcon }}" x="20" y="20" height="96" width="96" transform="scale(0.25)"/>',
      '    <title>{{node.name}}\n{{node.description}}</title>',
      '  </g>',
      '</g>',
      '</svg>'
    ].join('')
  };
}


function TalentGridCtrl(dimInfoService, $translate) {
  const infuseHash = 1270552711;
  var vm = this;
  vm.nodeSize = 34;
  vm.nodePadding = 4;
  vm.scaleFactor = 1.1;
  vm.totalNodeSize = vm.nodeSize + vm.nodePadding;

  vm.nodeClick = function(node, $event) {
    if (node.hash === infuseHash) {
      vm.infuse({ $event });
    } else if (node.exclusiveInColumn) {
      // popup warning
      dimInfoService.show('lostitems', {
        type: 'warning',
        title: $translate.instant('Help.ChangingPerks'),
        body: $translate.instant('Help.ChangingPerksInfo'),
        hide: $translate.instant('Help.NeverShow')
      });
    }
  };

  vm.hiddenColumns = 0;
  if (vm.perksOnly) {
    if (_.find(vm.talentGrid.nodes, { hash: infuseHash })) {
      vm.hiddenColumns += 1;
    }
    if (_.find(vm.talentGrid.nodes, { hash: 2133116599 })) {
      vm.hiddenColumns += 1;
    }
  }

  if (vm.talentGrid) {
    const visibleNodes = _.reject(vm.talentGrid.nodes, 'hidden');
    vm.numColumns = _.max(visibleNodes, 'column').column + 1 - vm.hiddenColumns;
    vm.numRows = vm.perksOnly ? 2 : (_.max(visibleNodes, 'row').row + 1);
  }
}

