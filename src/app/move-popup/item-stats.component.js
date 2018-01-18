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

//    debugger;

    if (item.sockets) {
      const mw = _.pluck(item.sockets.sockets, 'masterworkStat');
      return _.find(mw, (ms) => ms > 0);
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