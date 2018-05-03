import * as _ from 'underscore';
import { settings } from '../settings/settings';
import template from './item-review.html';
import './item-review.scss';
import { getReviewModes } from '../destinyTrackerApi/reviewModesFetcher';
import { getDefinitions } from '../destiny2/d2-definitions.service';
import { translateReviewMode } from './reviewModeTranslator';
import { IComponentOptions, IController, IScope, IRootScopeService } from 'angular';
import { DestinyTrackerServiceType, D1ItemUserReview, DtrUserReview } from './destiny-tracker.service';
import { DimItem } from '../inventory/item-types';

export const ItemReviewComponent: IComponentOptions = {
  bindings: {
    item: '<'
  },
  controller: ItemReviewController,
  template
};

function ItemReviewController(
  this: IController & {
    item: DimItem;
  },
  dimDestinyTrackerService: DestinyTrackerServiceType,
  $scope: IScope,
  $rootScope: IRootScopeService
) {
  'ngInject';

  const vm = this;
  vm.canReview = settings.allowIdPostToDtr;
  vm.toggledFlags = [];
  vm.submitted = false;
  vm.isCollapsed = false;

  vm.$onInit = () => {
    vm.canCreateReview = (vm.canReview && vm.item.owner);
    vm.hasUserReview = ((vm.item.userRating) || (vm.item.userVote));

    // BUGBUG: vm.item.workingUserReview && vm.item.workingUserReview.score !== 0
    vm.expandReview = ((vm.item.isLocallyCached) && (vm.item.userVote !== 0));
    if (!vm.item.mode) {
      vm.item.mode = settings.reviewsModeSelection;
    }

    vm.reviewData = vm.getReviewData();

    if (vm.item.destinyVersion === 2) {
      getDefinitions().then((defs) => {
        vm.reviewModeOptions = getReviewModes(defs);
      });
    }
  };

  vm.toggleChart = () => {
    vm.isCollapsed = !vm.isCollapsed;
  };

  vm.procon = false; // TODO: turn this back on..
  vm.aggregate = {
    pros: ['fast', 'lol'],
    cons: ['ok']
  };

  vm.toggleEdit = () => {
    vm.expandReview = !vm.expandReview;

    if ((vm.item.userVote === 1) ||
        (vm.item.userVote === -1)) {
      vm.item.userVote = 0;
      vm.reviewBlur();
    }
  };

  vm.clickReview = (reviewId) => {
    const review = this.findReview(reviewId);

    if (review.isReviewer) {
      vm.editReview();
    } else if (!review.isHighlighted) {
      vm.openFlagContext(reviewId);
    }
  };

  vm.openFlagContext = (reviewId) => {
    const review = this.findReview(reviewId);

    if ((review.isReviewer) || (review.isHighlighted)) {
      return;
    }

    const toggledReviewIndex = vm.toggledFlags.indexOf(reviewId);

    if (toggledReviewIndex === -1) {
      vm.toggledFlags.push(reviewId);
    }
  };

  vm.closeFlagContext = (reviewId) => {
    const toggledReviewIndex = vm.toggledFlags.indexOf(reviewId);

    vm.toggledFlags.splice(toggledReviewIndex);
  };

  vm.findReview = (reviewId) => {
    if (vm.item.destinyVersion === 1) {
      return (vm.item.reviews as D1ItemUserReview[]).find((review) => review.reviewId === reviewId);
    } else {
      return (vm.item.reviews as DtrUserReview[]).find((review) => review.id === reviewId);
    }
  };

  vm.editReview = (reviewId) => {
    const review = this.findReview(reviewId);

    if (!review || !review.isReviewer) {
      return;
    }

    vm.expandReview = true;

    if (review.voted) {
      vm.item.userVote = review.voted;
    }

    if (review.mode) {
      vm.item.mode = review.mode.toString();
    }
  };

  vm.totalReviews = 0;

  vm.reviewLabels = [5, 4, 3, 2, 1];

  vm.getReviewData = () => {
    if (!vm.item.reviews) {
      return [];
    }

    const labels = vm.reviewLabels;

    // the score histogram is a D1-only thing
    const mapData = _.map(labels, (label) => {
      if (vm.item.destinyVersion === 1) {
        const matchingReviews = _.where((vm.item.reviews as D1ItemUserReview[]), { rating: label });
        const highlightedReviews = _.where(matchingReviews, { isHighlighted: true });

        return matchingReviews.length + (highlightedReviews.length * 4);
      } else {
        const highlightedReviews = (vm.item.reviews as DtrUserReview[]).filter((review) => review.isHighlighted);
        return vm.item.reviews.length + (highlightedReviews.length * 4);
      }
    });

    vm.totalReviews = mapData.reduce((sum, cur) => sum + cur, 0);

    return mapData;
  };

  vm.shouldDrawChart = () => {
    vm.reviewData = vm.getReviewData();

    return ((vm.reviewData.length > 0) &&
            (_.some(vm.reviewData, (item) => item > 0)));
  };

  vm.submitReview = () => {
    dimDestinyTrackerService.submitReview(vm.item);
    vm.expandReview = false;
    vm.submitted = true;
  };

  vm.setRating = (rating) => {
    if (rating) {
      vm.item.userRating = rating;
    }
    vm.expandReview = true;
  };

  vm.reviewBlur = () => {
    const item = vm.item;
    const userReview = vm.toUserReview(item);

    dimDestinyTrackerService.updateCachedUserRankings(item,
                                                      userReview);
  };

  vm.reportReview = (reviewId) => {
    const review = this.findReview(reviewId);

    dimDestinyTrackerService.reportReview(review);
  };

  vm.toUserReview = (item) => {
    if (vm.item.destinyVersion === 1) {
      return this.toDestinyOneUserReview(item);
    }

    return this.toDestinyTwoUserReview(item);
  };

  vm.toDestinyTwoUserReview = (item) => {
    const userVote = item.userVote;
    const review = item.userReview;
    const pros = item.userReviewPros;
    const cons = item.userReviewCons;
    const mode = item.mode;

    const userReview = {
      voted: userVote,
      review,
      pros,
      cons,
      mode
    };

    return userReview;
  };

  vm.toDestinyOneUserReview = (item) => {
    const newRating = item.userRating;
    const review = item.userReview;
    const pros = item.userReviewPros;
    const cons = item.userReviewCons;

    const userReview = {
      rating: newRating,
      review,
      pros,
      cons
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

  vm.valueChanged = () => {
    vm.canReview = settings.allowIdPostToDtr;

    if (vm.canReview) {
      dimDestinyTrackerService.getItemReviews(vm.item);
    }
  };

  vm.translateReviewMode = (review) => {
    if (!vm.reviewModeOptions) {
      getDefinitions().then((defs) => { vm.reviewModeOptions = getReviewModes(defs); });

      return translateReviewMode(vm.reviewModeOptions, review);
    }

    return translateReviewMode(vm.reviewModeOptions, review);
  };

  vm.setUserVote = (userVote) => {
    vm.item.userVote = (vm.item.userVote === userVote) ? 0 : userVote;

    vm.expandReview = (vm.item.userVote !== 0);

    vm.reviewBlur();
  };
}
