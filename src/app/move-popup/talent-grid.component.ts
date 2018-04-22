import * as _ from 'underscore';
import template from './talent-grid.html';
import './talent-grid.scss';
import { showInfoPopup } from '../shell/info-popup';
import { IComponentOptions, IController, IAngularEvent } from 'angular';
import { DimTalentGrid, DimGridNode } from '../inventory/store/d2-item-factory.service';

export function talentGridNodesFilter(nodes: DimGridNode[], hiddenColumns: number) {
  return (nodes || []).filter((node) => !node.hidden && node.column >= hiddenColumns);
}

export const TalentGridComponent: IComponentOptions = {
  controller: TalentGridCtrl,
  controllerAs: 'vm',
  bindings: {
    talentGrid: '<',
    perksOnly: '<',
    infuse: '&dimInfuse'
  },
  template
};

function TalentGridCtrl(
  this: IController & {
    talentGrid: DimTalentGrid;
    perksOnly: boolean;
    infuse(args: { $event: IAngularEvent }): void;
  },
  $i18next
) {
  'ngInject';

  const infuseHash = 1270552711;
  const vm = this;
  vm.nodeSize = 34;
  vm.nodePadding = 4;
  vm.scaleFactor = 1.1;
  vm.totalNodeSize = vm.nodeSize + vm.nodePadding;

  vm.nodeClick = (node: DimGridNode, $event) => {
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

  vm.$onInit = () => {
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
      const visibleNodes = vm.talentGrid.nodes.filter((n) => !n.hidden);
      vm.numColumns = _.max(visibleNodes, (n) => n.column).column + 1 - vm.hiddenColumns;
      vm.numRows = vm.perksOnly ? 2 : (_.max(visibleNodes, (n) => n.row).row + 1);
    }
  };
}
