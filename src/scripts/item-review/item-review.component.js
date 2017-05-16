import template from './item-review.html';
import './item-review.scss';

function ItemReviewController($rootScope, dimSettingsService) {
  'ngInject';

  const vm = this;
  vm.canReview = dimSettingsService.allowIdPostToDtr;
  vm.submitted = false;
  vm.hasUserReview = vm.item.userRating;
  vm.expandReview = vm.hasUserReview;

  vm.procon = false; // TODO: turn this back on..
  vm.aggregate = {
    pros: ['fast', 'lol'],
    cons: ['ok']
  };
//  vm.item.writtenReviews.forEach((review) => {
//    aggregate.pros.push(review.pros);
//    aggregate.cons.push(review.cons);
//  });

  vm.toggleEdit = function() {
    vm.expandReview = !vm.expandReview;
  };

  vm.submitReview = function() {
    $rootScope.$broadcast('review-submitted', vm.item);
    vm.expandReview = false;
    vm.submitted = true;
  };

  vm.setRating = function(rating) {
    if (rating) {
      vm.item.userRating = rating;
    }
    vm.expandReview = true;
  };
}

export const ItemReviewComponent = {
  bindings: {
    item: '<'
  },
  controller: ItemReviewController,
  template: template
};
