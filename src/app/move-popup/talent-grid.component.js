import _ from 'underscore';
import template from './talent-grid.html';
import './talent-grid.scss';
import { showInfoPopup } from '../services/dimInfoService.factory';

export function talentGridNodesFilter(nodes, hiddenColumns) {
  return _.filter(nodes || [], (node) => {
    return !node.hidden && node.column >= hiddenColumns;
  });
}

export const TalentGridComponent = {
  controller: TalentGridCtrl,
  controllerAs: 'vm',
  bindings: {
    talentGrid: '<',
    perksOnly: '<',
    infuse: '&dimInfuse'
  },
  template
};

function TalentGridCtrl($i18next) {
  'ngInject';

  const infuseHash = 1270552711;
  const vm = this;
  vm.nodeSize = 34;
  vm.nodePadding = 4;
  vm.scaleFactor = 1.1;
  vm.totalNodeSize = vm.nodeSize + vm.nodePadding;

  vm.nodeClick = function(node, $event) {
    if (node.hash === infuseHash) {
      vm.infuse({ $event });
    } else if (node.exclusiveInColumn) {
      // popup warning
      showInfoPopup('changeperks', {
        type: 'warning',
        title: $i18next.t('Help.ChangingPerks'),
        body: $i18next.t('Help.ChangingPerksInfo'),
        hide: $i18next.t('Help.NeverShow')
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
