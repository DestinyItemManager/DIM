import { settings } from '../settings/settings';
import template from './item-stats.html';
import './item-stats.scss';

function ItemStatsController() {
  'ngInject';

  this.settings = settings;
}

export const ItemStatsComponent = {
  bindings: {
    item: '<'
  },
  controller: ItemStatsController,
  template: template
};