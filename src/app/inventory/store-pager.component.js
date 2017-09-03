import angular from 'angular';
import Dragend from 'dragend';
import './store-pager.scss';

export const StorePagerComponent = {
  controller: StorePagerCtrl,
  transclude: true,
  template: '<ng-transclude></ng-transclude>',
  bindings: {
    onStoreChange: '&'
  }
};

function StorePagerCtrl($element, $scope) {
  'ngInject';

  this.$onInit = function() {
    this.dragend = new Dragend($element[0], {
      pageClass: 'character-swipe',
      onSwipeEnd: (pager, page, index) => {
        $scope.$apply(() => {
          this.onStoreChange({ store: angular.element(page).scope().store });
        });
      }
    });
  };
}
