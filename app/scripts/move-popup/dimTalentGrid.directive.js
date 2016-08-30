(function() {
  'use strict';


  angular.module('dimApp')
    .component('dimTalentGrid', {
      controller: TalentGridCtrl,
      controllerAs: 'vm',
      bindings: {
        grid: '<',
        perksOnly: '<',
        infuse: '&dimInfuse'
      },
      replace: true,
      template: `
        <svg preserveAspectRatio="xMaxYMin meet" svg-bind-viewbox="0 0 {{(vm.numColumns * vm.totalNodeSize - vm.nodePadding) * vm.scaleFactor}} {{(vm.numRows * vm.totalNodeSize - vm.nodePadding) * vm.scaleFactor + 1}}" class="talent-grid" ng-attr-height="{{(vm.numRows * vm.totalNodeSize - vm.nodePadding) * vm.scaleFactor}}" ng-attr-width="{{(vm.numColumns * vm.totalNodeSize - vm.nodePadding) * vm.scaleFactor}}">
         <g ng-attr-transform="scale({{vm.scaleFactor}})">
          <g class="talent-node" ng-attr-transform="translate({{(node.column - vm.hiddenColumns) * (vm.totalNodeSize)}},{{node.row * (vm.totalNodeSize)}})" ng-repeat="node in vm.grid.nodes | talentGridNodes:vm.hiddenColumns track by $index" ng-class="{ \'talent-node-activated\': node.activated, \'talent-node-showxp\': (!node.activated && node.xpRequired), \'talent-node-default\': (node.activated && !node.xpRequired && !node.exclusiveInColumn) }" ng-click="vm.nodeClick(node, $event)">
            <circle r="16" cx="-17" cy="17" transform="rotate(-90)" class="talent-node-xp" stroke-width="2" ng-attr-stroke-dasharray="{{100.0 * node.xp / node.xpRequired}} 100" />
            <image class="talent-node-img" xlink:href="" ng-attr-xlink:href="{{ node.icon | bungieIcon }}" x="20" y="20" height="96" width="96" transform="scale(0.25)"/>
            <title>{{node.name}}\n{{node.description}}</title>
          </g>
        </g>
        </svg>
      `
    })
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
        scope: true,
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


  TalentGridCtrl.$inject = ['dimInfoService'];

  function TalentGridCtrl(dimInfoService) {
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
          title: 'Changing Perks Not Supported',
          body: "Sorry, there's no way to change perks outside the game. We wish we could!",
          hide: 'Never show me this again.'
        });
      }
    };

    vm.hiddenColumns = 0;
    if (vm.perksOnly) {
      if (_.find(vm.grid.nodes, { hash: infuseHash })) {
        vm.hiddenColumns += 1;
      }
      if (_.find(vm.grid.nodes, { hash: 2133116599 })) {
        vm.hiddenColumns += 1;
      }
    }

    if (vm.grid) {
      vm.numColumns = _.max(vm.grid.nodes, 'column').column + 1 - vm.hiddenColumns;
      vm.numRows = vm.perksOnly ? 2 : (_.max(vm.grid.nodes, 'row').row + 1);
    }
  }
})();
