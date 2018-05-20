import * as _ from 'underscore';
import { settings } from '../settings/settings';
import template from './item-review.html';
import './item-review.scss';
import { getReviewModes } from '../destinyTrackerApi/reviewModesFetcher';
import { getDefinitions } from '../destiny2/d2-definitions.service';
import { translateReviewMode } from './reviewModeTranslator';
import { IComponentOptions, IController, IScope, IRootScopeService } from 'angular';
import { DestinyTrackerServiceType } from './destiny-tracker.service';
import { DimItem } from '../inventory/item-types';
import { D1ItemUserReview, WorkingD1Rating } from './d1-dtr-api-types';
import { D2ItemUserReview, WorkingD2Rating } from './d2-dtr-api-types';

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
    toUserReview(item: DimItem): WorkingD1Rating | WorkingD2Rating;
    findReview(reviewId: string): D1ItemUserReview | D2ItemUserReview | null;
    getReviewData(): number[];
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
  vm.expandReview = false;

  vm.$onInit = () => {
    vm.canCreateReview = (vm.canReview && vm.item.owner);

    if (vm.item.isDestiny1()) {
      if (vm.item.dtrRating && vm.item.dtrRating.userReview) {
        vm.expandReview = (vm.item.dtrRating.userReview.rating !== 0 && !vm.item.dtrRating.userReview.treatAsSubmitted);
      }
    } else if (vm.item.isDestiny2()) {
      if (vm.item.dtrRating && vm.item.dtrRating.userReview) {
        vm.expandReview = (vm.item.dtrRating.userReview.voted !== 0 && !vm.item.dtrRating.userReview.treatAsSubmitted);

        if (!vm.item.dtrRating.userReview.mode) {
          vm.item.dtrRating.userReview.mode = settings.reviewsModeSelection;
        }
      }
    }

    vm.reviewData = vm.getReviewData();

    if (vm.item.isDestiny2()) {
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

    if (vm.item.isDestiny2() && vm.item.dtrRating && vm.item.dtrRating.userReview.voted !== 0) {
      vm.item.dtrRating.userReview.voted = 0;
      vm.reviewBlur();
    }
  };

  vm.clickReview = (reviewId) => {
    const review = this.findReview(reviewId);

    if (review && review.isReviewer) {
      vm.editReview();
    } else if (review && !review.isHighlighted) {
      vm.openFlagContext(reviewId);
    }
  };

  vm.openFlagContext = (reviewId) => {
    const review = this.findReview(reviewId);

    if (review && (review.isReviewer || review.isHighlighted)) {
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

  vm.findReview = (reviewId: string): D1ItemUserReview | D2ItemUserReview | null => {
    if (vm.item.isDestiny1()) {
      if (!vm.item.dtrRating || !vm.item.dtrRating.reviewsResponse) {
        return null;
      }

      return vm.item.dtrRating.reviewsResponse.reviews.find((review) => review.reviewId === reviewId) || null;
    } else if (vm.item.isDestiny2()) {
      if (!vm.item.dtrRating || !vm.item.dtrRating.reviewsResponse) {
        return null;
      }
      return vm.item.dtrRating.reviewsResponse.reviews.find((review) => review.id === reviewId) || null;
    }

    return null;
  };

  vm.editReview = (reviewId) => {
    const review = vm.findReview(reviewId);

    if (!review || !review.isReviewer) {
      return;
    }

    vm.expandReview = true;
  };

  vm.totalReviews = 0;

  vm.reviewLabels = [5, 4, 3, 2, 1];

  vm.getReviewData = () => {
    if (!vm.item.isDestiny1() || !vm.item.dtrRating || !vm.item.dtrRating.reviewsResponse || !vm.item.dtrRating.reviewsResponse.reviews) {
      return [];
    }

    const labels = vm.reviewLabels;
    const itemReviews = vm.item.dtrRating.reviewsResponse.reviews;

    // the score histogram is a D1-only thing
    const mapData = _.map(labels, (label) => {
      if (vm.item.destinyVersion === 1) {
        const matchingReviews = _.where(itemReviews, { rating: label });
        const highlightedReviews = _.where(matchingReviews, { isHighlighted: true });

        return matchingReviews.length + (highlightedReviews.length * 4);
      } else {
        const highlightedReviews = itemReviews.filter((review) => review.isHighlighted);
        return itemReviews.length + (highlightedReviews.length * 4);
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

  vm.setRating = (rating: number) => {
    if (rating) {
      if (!vm.item.isDestiny1() || !vm.item.dtrRating) {
        return;
      }

      vm.item.dtrRating.userReview.rating = rating;
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

    if (review) {
      dimDestinyTrackerService.reportReview(review);
    }
  };

  vm.toUserReview = (item: DimItem): WorkingD1Rating | WorkingD2Rating => {
    if (vm.item.isDestiny1() && vm.item.dtrRating) {
      return vm.item.dtrRating.userReview;
    } else if (vm.item.isDestiny2() && vm.item.dtrRating) {
      return vm.item.dtrRating.userReview;
    }

    throw new Error(`Received item type ${item.name} instead of a D1/D2 rating.`);
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

  vm.setUserVote = (userVote: number) => {
    if (!vm.item.isDestiny2() || !vm.item.dtrRating) {
      return;
    }

    vm.item.dtrRating.userReview.voted = (vm.item.dtrRating.userReview.voted === userVote) ? 0 : userVote;

    const treatAsTouched = (vm.item.dtrRating.userReview.voted !== 0);

    vm.expandReview = treatAsTouched;
    vm.item.dtrRating.userReview.treatAsSubmitted = !treatAsTouched;

    vm.reviewBlur();
  };
}
