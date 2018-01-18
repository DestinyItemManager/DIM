import template from './item-stats.html';
import _ from 'underscore';
import './item-stats.scss';

function ItemStatsController(dimSettingsService) {
  'ngInject';

  this.settings = dimSettingsService;
  this.qualityEnabled = $featureFlags.qualityEnabled;

  const vm = this;

  vm.masterworkStat = function() {
    const item = vm.item;

    if (item.sockets) {
      return _.find(_.pluck(item.sockets.sockets, 'masterworkStat'), (ms) => ms > 0);
    }

    return null;
  }
}

export const ItemStatsComponent = {
  bindings: {
    item: '<'
  },
  controller: ItemStatsController,
  template: template
};