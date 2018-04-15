import * as _ from 'underscore';
import { itemTags } from '../settings/settings';
import template from './item-tag.html';
import './item-tag.scss';
import { IComponentOptions, IController, IScope, IRootScopeService } from 'angular';
import { DimItem } from '../inventory/store/d2-item-factory.service';
import { TagValue } from '../inventory/dim-item-info';

export const ItemTagComponent: IComponentOptions = {
  controller: ItemTagController,
  bindings: {
    item: '<'
  },
  template
};

function ItemTagController(
  this: IController & {
    item: DimItem;
  },
  $scope: IScope,
  $rootScope: IRootScopeService) {
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

  vm.updateTag = () => {
    vm.item.dimInfo.tag = vm.selected.type;
    if (!vm.item.dimInfo.tag) {
      delete vm.item.dimInfo.tag;
    }
    $rootScope.$broadcast('dim-filter-invalidate');
    vm.item.dimInfo.save!();
  };

  $scope.$on('dim-item-tag', (_e, args: { tag: TagValue }) => {
    if (vm.item.dimInfo.tag === args.tag) {
      delete vm.item.dimInfo.tag;
    } else {
      vm.item.dimInfo.tag = args.tag;
    }
    $rootScope.$broadcast('dim-filter-invalidate');
    vm.item.dimInfo.save!();
  });
}
