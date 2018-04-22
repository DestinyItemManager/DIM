import { IComponentOptions, IController, IScope, IRootElementService, element } from 'angular';
import Dragend from 'dragend';
import { settings } from '../settings/settings';
import './store-pager.scss';
import { sortStores } from '../shell/dimAngularFilters.filter';
import { DimStore } from './store-types';

export const StorePagerComponent: IComponentOptions = {
  controller: StorePagerCtrl,
  transclude: true,
  template: '<ng-transclude></ng-transclude>',
  bindings: {
    onStoreChange: '&',
    initialIndex: '<',
    selectedStore: '<',
    stores: '<'
  }
};

function StorePagerCtrl(
  this: IController & {
    stores: DimStore[];
    initialIndex: number;
    selectedStore: DimStore;
    onStoreChange(store: DimStore): void;
  },
  $element: IRootElementService,
  $scope: IScope
) {
  'ngInject';

  this.$onInit = function() {
    this.dragend = new Dragend($element[0], {
      pageClass: 'character-swipe',
      page: this.initialIndex + 1,
      onSwipeEnd: (_pager, page) => {
        $scope.$apply(() => {
          this.onStoreChange({ store: (element(page).scope() as any).store });
        });
      }
    });
  };

  this.$onChanges = () => {
    if (this.dragend && this.selectedStore) {
      const storeIndex = sortStores(this.stores, settings.characterOrder).indexOf(this.selectedStore);
      this.dragend.jumpToPage(storeIndex + 1);
    }
  };
}
