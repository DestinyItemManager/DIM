import angular from 'angular';
import _ from 'underscore';
import template from './dimTalentGrid.directive.html';

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
    template: template
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
      dimInfoService.show('changeperks', {
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
