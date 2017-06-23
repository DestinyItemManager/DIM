import template from './item-review.html';
import './item-review.scss';

function ItemReviewController($rootScope, dimSettingsService, dimDestinyTrackerService, $scope) {
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

  vm.reviewBlur = function() {
    var item = vm.item;
    var userReview = vm.toUserReview(item);

    dimDestinyTrackerService.updateCachedUserRankings(item,
                                                      userReview);
  };

  vm.toUserReview = function(item) {
    var newRating = item.userRating;
    var review = item.userReview;
    var pros = item.userReviewPros;
    var cons = item.userReviewCons;

    var userReview = {
      rating: newRating,
      review: review,
      pros: pros,
      cons: cons
    };

    return userReview;
  };

  vm.featureFlags = {
    qualityEnabled: true, // $featureFlags.qualityEnabled,
    reviewsEnabled: true // $featureFlags.reviewsEnabled
  };

  vm.settings = dimSettingsService;

  $scope.$watchCollection('vm.settings', function() {
    dimSettingsService.save();
  });
}

export const ItemReviewComponent = {
  bindings: {
    item: '<'
  },
  controller: ItemReviewController,
  template: template
};
