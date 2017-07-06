import template from './item-review.html';
import './item-review.scss';

function ItemReviewController(dimSettingsService, dimDestinyTrackerService, $scope) {
  'ngInject';

  const vm = this;
  vm.canReview = dimSettingsService.allowIdPostToDtr;
  vm.canCreateReview = (vm.canReview && vm.item.instanceId);
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
    dimDestinyTrackerService.submitReview(vm.item);
    vm.expandReview = false;
    vm.submitted = true;
  };

  vm.setRating = function(rating) {
    if (rating) {
      vm.item.userRating = rating;
    }
    vm.expandReview = true;
  };

  vm.reviewBlur = function() {
    const item = vm.item;
    const userReview = vm.toUserReview(item);

    dimDestinyTrackerService.updateCachedUserRankings(item,
                                                      userReview);
  };

  vm.toUserReview = function(item) {
    const newRating = item.userRating;
    const review = item.userReview;
    const pros = item.userReviewPros;
    const cons = item.userReviewCons;

    const userReview = {
      rating: newRating,
      review: review,
      pros: pros,
      cons: cons
    };

    return userReview;
  };

  vm.featureFlags = {
    qualityEnabled: $featureFlags.qualityEnabled,
    reviewsEnabled: $featureFlags.reviewsEnabled
  };

  vm.settings = dimSettingsService;

  $scope.$watchCollection('vm.settings', () => {
    dimSettingsService.save();
  });

  vm.valueChanged = function() {
    vm.canReview = dimSettingsService.allowIdPostToDtr;

    if (vm.canReview) {
      dimDestinyTrackerService.getItemReviews(vm.item);
    }
  };
}

export const ItemReviewComponent = {
  bindings: {
    item: '<'
  },
  controller: ItemReviewController,
  template: template
};
