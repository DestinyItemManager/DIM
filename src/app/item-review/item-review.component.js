import _ from 'underscore';
import { settings } from '../settings/settings';
import template from './item-review.html';
import './item-review.scss';

function ItemReviewController(dimDestinyTrackerService, $scope, $rootScope, $i18next) {
  'ngInject';

  const vm = this;
  vm.canReview = settings.allowIdPostToDtr;
  vm.canCreateReview = (vm.canReview && vm.item.owner);
  vm.submitted = false;
  vm.hasUserReview = ((vm.item.userRating) || (vm.item.userVote));
  vm.expandReview = ((vm.item.isLocallyCached) && (vm.item.userVote !== 0));
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

  vm.toggleEdit = function() {
    vm.expandReview = !vm.expandReview;

    if ((vm.item.userVote === 1) ||
        (vm.item.userVote === -1)) {
      vm.item.userVote = 0;
      vm.reviewBlur();
    }
  };

  vm.clickReview = function(reviewId) {
    const review = this.findReview(reviewId);

    if (review.isReviewer) {
      vm.editReview();
    } else if (!review.isHighlighted) {
      vm.openFlagContext(reviewId);
    }
  };

  vm.openFlagContext = function(reviewId) {
    const review = this.findReview(reviewId);

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

  vm.findReview = function(reviewId) {
    if (vm.item.destinyVersion === 1) {
      return _.find(vm.item.reviews, { reviewId: reviewId });
    } else {
      return _.find(vm.item.reviews, { id: reviewId });
    }
  };

  vm.editReview = function(reviewId) {
    const review = this.findReview(reviewId);

    if (!review || !review.isReviewer) {
      return;
    }

    vm.expandReview = true;

    if (review.voted) {
      vm.item.userVote = review.voted;
    }
  };

  vm.totalReviews = 0;

  vm.reviewLabels = [5, 4, 3, 2, 1];

  // these values correspond to DestinyActivityModeType
  // TODO: this is copied from settings.component.ts; figure out how to share
  vm.reviewModeOptions = {
    0: $i18next.t('DtrReview.Modes.None'),
    7: $i18next.t('DtrReview.Modes.AllPvE'),
    5: $i18next.t('DtrReview.Modes.AllPvP'),
    4: $i18next.t('DtrReview.Modes.Raid'),
    39: $i18next.t('DtrReview.Modes.TrialsOfTheNine')
  };

  vm.getReviewData = function() {
    if (!vm.item.reviews) {
      return [];
    }

    const labels = vm.reviewLabels;

    const mapData = _.map(labels, (label) => {
      const matchingReviews = _.where(vm.item.reviews, { rating: label });
      const highlightedReviews = _.where(matchingReviews, { isHighlighted: true });

      return matchingReviews.length + (highlightedReviews.length * 4);
    });

    vm.totalReviews = mapData.reduce((sum, cur) => { return sum + cur; }, 0);

    return mapData;
  };

  vm.reviewData = vm.getReviewData();

  vm.shouldDrawChart = function() {
    vm.reviewData = vm.getReviewData();

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
    const review = this.findReview(reviewId);

    dimDestinyTrackerService.reportReview(review);
  };

  vm.toUserReview = function(item) {
    if (vm.item.destinyVersion === 1) {
      return this.toDestinyOneUserReview(item);
    }

    return this.toDestinyTwoUserReview(item);
  };

  vm.toDestinyTwoUserReview = function(item) {
    const userVote = item.userVote;
    const review = item.userReview;
    const pros = item.userReviewPros;
    const cons = item.userReviewCons;
    const mode = item.mode;

    const userReview = {
      voted: userVote,
      review: review,
      pros: pros,
      cons: cons,
      mode
    };

    return userReview;
  };

  vm.toDestinyOneUserReview = function(item) {
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
    reviewsEnabled: $featureFlags.reviewsEnabled
  };

  vm.settings = settings;

  $scope.$watchCollection('vm.settings', () => {
    settings.save();
  });

  $rootScope.$on('dim-item-reviews-fetched', () => {
    vm.reviewData = vm.getReviewData();
  });

  vm.valueChanged = function() {
    vm.canReview = settings.allowIdPostToDtr;

    if (vm.canReview) {
      dimDestinyTrackerService.getItemReviews(vm.item);
    }
  };

  vm.getReviewMode = function(review) {
    return dimDestinyTrackerService.getReviewMode(review);
  };

  vm.setUserVote = function(userVote) {
    if (vm.item.userVote === userVote) {
      vm.item.userVote = 0;
    } else {
      vm.item.userVote = userVote;
    }

    vm.expandReview = (vm.item.userVote !== 0);

    vm.reviewBlur();
  };
}

export const ItemReviewComponent = {
  bindings: {
    item: '<'
  },
  controller: ItemReviewController,
  template: template
};
