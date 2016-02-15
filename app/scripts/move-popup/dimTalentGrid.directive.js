(function() {
  'use strict';

  angular.module('dimApp')
    .directive('dimTalentGrid', TalentGrid)
    .filter('talentGridNodes', function() {
      return function(nodes) {
        return _.filter(nodes || [], {hidden: false});
      };
    }).filter('bungieIcon', function ($sce) {
      return function(icon) {
        return $sce.trustAsResourceUrl('http://bungie.net/' + icon);
      };
    }).directive('svgBindViewbox', function () {
      return {
        link: function (scope, element, attrs) {
          /*
           inserts the evaluated value of the "svg-bind-viewbox" attribute
           into the "viewBox" attribute, making sure to capitalize the "B",
           as this SVG attribute name is case-sensitive.
           */
          attrs.$observe('svgBindViewbox', function (value) {
            element.get(0).setAttribute('viewBox', value);
          });
        }
      };
    });


  function TalentGrid() {
    var nodeSize = 32;
    var nodePadding = 8;
    var totalNodeSize = nodeSize + nodePadding;

    return {
      bindToController: true,
      controller: TalentGridCtrl,
      controllerAs: 'vm',
      scope: {
        talentGrid: '=dimTalentGrid',
        infuse: '&dimInfuse'
      },
      restrict: 'E',
      replace: true,
      template: [
        '<svg preserveAspectRatio="xMaxYMin meet" svg-bind-viewbox="0 0 {{(vm.numColumns * vm.totalNodeSize - vm.nodePadding) * vm.scaleFactor}} {{(vm.numRows * vm.totalNodeSize - vm.nodePadding) * vm.scaleFactor + 1}}" class="talent-grid" ng-attr-height="{{(vm.numRows * vm.totalNodeSize - vm.nodePadding) * vm.scaleFactor}}" ng-attr-width="{{(vm.numColumns * vm.totalNodeSize - vm.nodePadding) * vm.scaleFactor}}">',
        ' <g ng-attr-transform="scale({{vm.scaleFactor}})">',
        '  <g class="talent-node" ng-attr-transform="translate({{node.column * (vm.totalNodeSize)}},{{node.row * (vm.totalNodeSize)}})" ng-repeat="node in vm.talentGrid.nodes | talentGridNodes track by $index" ng-class="{ \'talent-node-activated\': node.activated, \'talent-node-showxp\': (!node.activated && node.xpRequired), \'talent-node-default\': (node.activated && !node.xpRequired && !node.exclusiveInColumn) }" ng-click="node.name == \'Infuse\' ? vm.infuse({\'$event\': $event}) : true">',
        '    <circle r="16" cx="-17" cy="17" transform="rotate(-90)" class="talent-node-xp" stroke-width="2" ng-attr-stroke-dasharray="{{100.0 * node.xp / node.xpRequired}} 100" />',
        '    <image class="talent-node-img" xlink:href="" ng-attr-xlink:href="{{ node.icon | bungieIcon }}" x="20" y="20" height="96" width="96" transform="scale(0.25)"/>',
        '    <title>{{node.name}}\n{{node.description}}</title>',
        '  </g>',
'</g>',
        '</svg>'
      ].join('')
    };
  }

  TalentGridCtrl.$inject = ['$scope'];

  function TalentGridCtrl($scope) {
    var vm = this;
    vm.nodeSize = 34;
    vm.nodePadding = 4;
    vm.scaleFactor = 1.3;
    vm.totalNodeSize = vm.nodeSize + vm.nodePadding;
    if (vm.talentGrid) {
      vm.numColumns = _.max(vm.talentGrid.nodes, 'column').column + 1;
      vm.numRows = _.max(vm.talentGrid.nodes, 'row').row + 1;
    }
  }
})();
