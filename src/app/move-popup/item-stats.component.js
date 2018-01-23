import template from './item-stats.html';
import './item-stats.scss';

function ItemStatsController(dimSettingsService) {
  'ngInject';

  this.settings = dimSettingsService;
}

export const ItemStatsComponent = {
  bindings: {
    item: '<'
  },
  controller: ItemStatsController,
  template: template
};