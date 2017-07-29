import template from './dimSimpleItem.directive.html';

export const SimpleItemComponent = {
  bindings: {
    item: '<itemData'
  },
  template,
  controllerAs: 'vm'
};