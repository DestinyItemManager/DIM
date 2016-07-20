(function() {
  'use strict';


  angular.module('dimApp')
    .directive('dimTalentGrid', TalentGrid)
    .filter('talentGridNodes', function() {
      return function(nodes, hiddenColumns) {
        return _.filter(nodes || [], function(node) {
          return !node.hidden && node.column >= hiddenColumns;
        });
      };
    })
    .filter('bungieIcon', function($sce) {
      return function(icon) {
        return $sce.trustAsResourceUrl(chrome.extension.getURL(icon));
      };
    })
    .directive('svgBindViewbox', function() {
      return {
        link: function(scope, element, attrs) {
          /*
           inserts the evaluated value of the "svg-bind-viewbox" attribute
           into the "viewBox" attribute, making sure to capitalize the "B",
           as this SVG attribute name is case-sensitive.
           */
          attrs.$observe('svgBindViewbox', function(value) {
            element.get(0).setAttribute('viewBox', value);
          });
        }
      };
    });


  function TalentGrid() {
    return {
      bindToController: true,
      controller: TalentGridCtrl,
      controllerAs: 'vm',
      scope: {
        talentGrid: '=dimTalentGrid',
        perksOnly: '=',
        infuse: '&dimInfuse'
      },
      restrict: 'E',
      replace: true,
      template: [
        '<svg preserveAspectRatio="xMaxYMin meet" svg-bind-viewbox="0 0 {{(vm.numColumns * vm.totalNodeSize - vm.nodePadding) * vm.scaleFactor}} {{(vm.numRows * vm.totalNodeSize - vm.nodePadding) * vm.scaleFactor + 1}}" class="talent-grid" ng-attr-height="{{(vm.numRows * vm.totalNodeSize - vm.nodePadding) * vm.scaleFactor}}" ng-attr-width="{{(vm.numColumns * vm.totalNodeSize - vm.nodePadding) * vm.scaleFactor}}">',
        ' <g ng-attr-transform="scale({{vm.scaleFactor}})">',
        '  <g class="talent-node" ng-attr-transform="translate({{(node.column - vm.hiddenColumns) * (vm.totalNodeSize)}},{{node.row * (vm.totalNodeSize)}})" ng-repeat="node in vm.talentGrid.nodes | talentGridNodes:vm.hiddenColumns track by $index" ng-class="{ \'talent-node-activated\': node.activated, \'talent-node-showxp\': (!node.activated && node.xpRequired), \'talent-node-default\': (node.activated && !node.xpRequired && !node.exclusiveInColumn) }" ng-click="node.name == \'Infuse\' ? vm.infuse({\'$event\': $event}) : true">',
        '    <circle r="16" cx="-17" cy="17" transform="rotate(-90)" class="talent-node-xp" stroke-width="2" ng-attr-stroke-dasharray="{{100.0 * node.xp / node.xpRequired}} 100" />',
        '    <image class="talent-node-img" xlink:href="" ng-attr-xlink:href="{{ node.icon | bungieIcon }}" x="20" y="20" height="96" width="96" transform="scale(0.25)" ng-click="vm.onScopeClick(node)" />',
        '    <title>{{node.name}}\n{{node.description}}</title>',
        '  </g>',
        '</g>',
        '</svg>'
      ].join('')
    };
  }

  TalentGridCtrl.$inject = ['$window', 'ngDialog'];

  function TalentGridCtrl($window, ngDialog) {
    var vm = this;
    vm.nodeSize = 34;
    vm.nodePadding = 4;
    vm.scaleFactor = 1.1;
    vm.totalNodeSize = vm.nodeSize + vm.nodePadding;

    vm.hiddenColumns = 0;
    if (vm.perksOnly) {
      if (_.find(vm.talentGrid.nodes, { hash: 1270552711 })) {
        vm.hiddenColumns += 1;
      }
      if (_.find(vm.talentGrid.nodes, { hash: 2133116599 })) {
        vm.hiddenColumns += 1;
      }
    }

    if (vm.talentGrid) {
      vm.numColumns = _.max(vm.talentGrid.nodes, 'column').column + 1 - vm.hiddenColumns;
      vm.numRows = vm.perksOnly ? 2 : (_.max(vm.talentGrid.nodes, 'row').row + 1);
    }

    vm.onScopeClick = function(node) {
      // Add a better check if is a scope node
      if (node.column === 1) {
        ngDialog.open({
          template: 'views/scopes.html',
          className: 'scopes-dialog',
          controllerAs: 'dialog',
          controller: function() {
            var vm = this;
            vm.hash = node.hash;
          }
        });
      }
    };
  }
})();
