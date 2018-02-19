import angular from 'angular';
import Dragend from 'dragend';
import { settings } from '../settings/settings';
import './store-pager.scss';

export const StorePagerComponent = {
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

function StorePagerCtrl($element, $scope, $filter) {
  'ngInject';

  this.$onInit = function() {
    this.dragend = new Dragend($element[0], {
      pageClass: 'character-swipe',
      page: this.initialIndex + 1,
      onSwipeEnd: (pager, page) => {
        $scope.$apply(() => {
          this.onStoreChange({ store: angular.element(page).scope().store });
        });
      }
    });
  };

  this.$onChanges = () => {
    if (this.dragend && this.selectedStore) {
      const storeIndex = $filter('sortStores')(this.stores, settings.characterOrder).indexOf(this.selectedStore);
      this.dragend.jumpToPage(storeIndex + 1);
    }
  };
}
