
import template from './star-rating.html';
import './star-rating.scss';

function StarRatingController($element) {
  'ngInject';

  const vm = this;

  vm.isReadOnly = $element[0].hasAttribute('read-only');
  function updateStars() {
    vm.stars = [];
    for (let id = 0; id < 5; id++) {
      vm.stars.push({
        filled: id < vm.rating
      });
    }
  }

  vm.toggle = function(index) {
    vm.rating = index;

    if (vm.onRatingChange && typeof vm.onRatingChange === 'function') {
      vm.onRatingChange({
        rating: vm.rating + 1
      });
    }
    updateStars();
  };

  vm.hover = function(index) {
    vm.stars.forEach((star, id) => {
      star.hovered = index !== undefined && id <= index;
    });
  };

  vm.$onChanges = function(update) {
    if (!update.rating.currentValue === undefined) {
      return;
    }
    vm.rating = Math.round(update.rating.currentValue);
    updateStars();
  };
}

export const StarRatingComponent = {
  bindings: {
    rating: '<',
    onRatingChange: '&'
  },
  controller: StarRatingController,
  template: template
};
