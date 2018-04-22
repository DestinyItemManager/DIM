import { settings } from '../settings/settings';
import template from './item-stats.html';
import './item-stats.scss';
import { IComponentOptions, IController } from 'angular';
import { DimItem } from '../inventory/item-types';

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
