(function() {
  'use strict';

  angular.module('dimApp')
    .directive('dimTalentGrid', TalentGrid)
    .filter('talentGridNodes', function() {
      return function(nodes) {
        var result = [];
        (nodes || []).forEach(function(node) {
          if (node.hidden || ['Infuse', 'Upgrade Damage', 'Upgrade Defense', 'Arc Damage', 'Solar Damage', 'Void Damage'].indexOf(node.name) >= 0) {
            return;
          }

          var column = result[node.column] = result[node.column] || [];

          if (node.exclusiveInColumn) {
            if (column.length === 0) {
              column.push(node);
            } else if (!column[0].activated && node.activated) {
              result[node.column] = [node];
            }
          } else {
            column.push(node);
          }
        });
        return _.compact(_.flatten(result));
      };
    });

  function TalentGrid() {
    return {
      bindToController: true,
      controller: TalentGridCtrl,
      controllerAs: 'vm',
      scope: {
        talentGrid: '=dimTalentGrid',
        infuse: '=dimInfuse'
      },
      restrict: 'E',
      replace: true,
      template: [
        '<div class="talent-node" ng-repeat="node in vm.talentGrid.nodes | talentGridNodes track by $index" ng-class="{ \'talent-node-active\': node.activated }" title="{{node.name}}\n{{node.description}}">',
        '  <div class="talent-node-icon" style="background-image: url(http://bungie.net{{ node.icon }})"></div>',
        '    <svg ng-if="!node.activated && node.xpRequired" viewBox="-1 -1 34 34" height="44" width="44"><circle ng-attr-stroke-dasharray="{{100.0 * node.xp / node.xpRequired}} 100" stroke-width="2" r="16" cx="16" cy="16" /></svg>',
        '  </div>',
        '</div>'
      ].join('')
    };
  }

  TalentGridCtrl.$inject = ['$scope'];

  function TalentGridCtrl($scope) {
    var vm = this;
  }
})();
