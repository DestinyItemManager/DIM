import { settings } from '../settings/settings';
import template from './item-stats.html';
import './item-stats.scss';
import { IComponentOptions, IController } from 'angular';
import { DimItem } from '../inventory/store/d2-item-factory.service';

function ItemStatsController(this: IController & { item: DimItem }) {
  'ngInject';

  this.settings = settings;
}

export const ItemStatsComponent: IComponentOptions = {
  bindings: {
    item: '<'
  },
  controller: ItemStatsController,
  template
};
