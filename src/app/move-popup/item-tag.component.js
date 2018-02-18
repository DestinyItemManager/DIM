import _ from 'underscore';
import { itemTags } from '../settings/settings';
import template from './item-tag.html';
import './item-tag.scss';

export const ItemTagComponent = {
  controller: ItemTagController,
  bindings: {
    item: '='
  },
  template: template
};

function ItemTagController($scope, $rootScope) {
  'ngInject';
  const vm = this;

  vm.itemTags = itemTags;
  $scope.$watch('$ctrl.item.dimInfo.tag', () => {
    if (vm.item.dimInfo) {
      vm.selected = _.find(itemTags, (tag) => {
        return tag.type === vm.item.dimInfo.tag;
      });
    }
  });

  vm.updateTag = function() {
    vm.item.dimInfo.tag = vm.selected.type;
    if (!vm.item.dimInfo.tag) {
      delete vm.item.dimInfo.tag;
    }
    $rootScope.$broadcast('dim-filter-invalidate');
    vm.item.dimInfo.save();
  };

  $scope.$on('dim-item-tag', (e, args) => {
    if (vm.item.dimInfo.tag === args.tag) {
      delete vm.item.dimInfo.tag;
    } else {
      vm.item.dimInfo.tag = args.tag;
    }
    $rootScope.$broadcast('dim-filter-invalidate');
    vm.item.dimInfo.save();
  });
}
