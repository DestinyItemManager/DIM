import template from './item-stats.html';
import './item-stats.scss';

function ItemStatsController(dimSettingsService) {
  'ngInject';

  this.settings = dimSettingsService;
  this.qualityEnabled = $featureFlags.qualityEnabled;
}

export const ItemStatsComponent = {
  bindings: {
    item: '<'
  },
  controller: ItemStatsController,
  template: template
};