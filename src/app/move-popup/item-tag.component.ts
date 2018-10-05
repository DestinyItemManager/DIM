import * as _ from 'underscore';
import template from './item-tag.html';
import './item-tag.scss';
import { IComponentOptions, IController, IScope } from 'angular';
import { itemTags } from '../inventory/dim-item-info';
import { DimItem } from '../inventory/item-types';
import { hotkeys } from '../ngimport-more';
import { t } from 'i18next';

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
  $scope: IScope
) {
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
    vm.item.dimInfo.save!();
  };

  const hot = hotkeys.bindTo($scope);
  itemTags.forEach((tag) => {
    if (tag.hotkey) {
      hot.add({
        combo: [tag.hotkey],
        description: t('Hotkey.MarkItemAs', {
          tag: t(tag.label)
        }),
        callback() {
          if (vm.item.dimInfo.tag === tag.type) {
            delete vm.item.dimInfo.tag;
          } else {
            vm.item.dimInfo.tag = tag.type;
          }
          vm.item.dimInfo.save!();
        }
      });
    }
  });
}
