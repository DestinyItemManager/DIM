import template from './dimSimpleItem.directive.html';
import { IComponentOptions } from 'angular';

export const SimpleItemComponent: IComponentOptions = {
  bindings: {
    item: '<itemData'
  },
  template,
  controllerAs: 'vm'
};
