import _ from 'underscore';
import template from './item-review.html';
import './item-review.scss';

function ItemReviewController(dimSettingsService, dimDestinyTrackerService, $scope, $rootScope) {
  'ngInject';

  const vm = this;
  vm.canReview = dimSettingsService.allowIdPostToDtr;
  vm.canCreateReview = (vm.canReview && vm.item.owner);
  vm.submitted = false;
  vm.hasUserReview = vm.item.userRating;
  vm.expandReview = vm.item.isLocallyCached;
  vm.toggledFlags = [];

  vm.isCollapsed = false;

  vm.toggleChart = function() {
    vm.isCollapsed = !vm.isCollapsed;
  };

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

  vm.clickReview = function(reviewId) {
    const review = _.find(vm.item.writtenReviews, { reviewId: reviewId });

    if (review.isReviewer) {
      vm.editReview();
    }
    else if (!review.isHighlighted) {
      vm.openFlagContext(reviewId);
    }
  };

  vm.openFlagContext = function(reviewId) {
    const review = _.find(vm.item.writtenReviews, { reviewId: reviewId });

    if ((review.isReviewer) || (review.isHighlighted)) {
      return;
    }

    const toggledReviewIndex = vm.toggledFlags.indexOf(reviewId);

    if (toggledReviewIndex === -1) {
      vm.toggledFlags.push(reviewId);
    }
  };

  vm.closeFlagContext = function(reviewId) {
    const toggledReviewIndex = vm.toggledFlags.indexOf(reviewId);

    vm.toggledFlags.splice(toggledReviewIndex);
  };

  vm.editReview = function(reviewId) {
    const review = _.find(vm.item.writtenReviews, { reviewId: reviewId });

    if (!review.isReviewer) {
      return;
    }

    vm.expandReview = true;
  };

  vm.totalReviews = 0;

  vm.reviewLabels = [5, 4, 3, 2, 1];

  vm.getReviewData = function() {
    if (!vm.item.writtenReviews) {
      return [];
    }

    const labels = vm.reviewLabels;

    const mapData = _.map(labels, (label) => {
      const matchingReviews = _.where(vm.item.writtenReviews, { rating: label });
      const highlightedReviews = _.where(matchingReviews, { isHighlighted: true });

      return matchingReviews.length + (highlightedReviews.length * 4);
    });

    vm.totalReviews = mapData.reduce((sum, cur) => { return sum + cur; }, 0);

    return mapData;
  };

  vm.reviewData = vm.getReviewData();

  vm.shouldDrawChart = function() {
    return ((vm.reviewData.length > 0) &&
            (_.some(vm.reviewData, (item) => { return item > 0; })));
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

  vm.reportReview = function(reviewId) {
    const review = _.find(vm.item.writtenReviews, { reviewId: reviewId });

    dimDestinyTrackerService.reportReview(review);
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

  $rootScope.$on('dim-item-reviews-fetched', () => {
    vm.reviewData = vm.getReviewData();
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
