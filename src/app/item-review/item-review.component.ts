/*
import * as _ from 'lodash';
import { settings } from '../settings/settings';
import template from './item-review.html';
import './item-review.scss';
import { getReviewModes } from '../destinyTrackerApi/reviewModesFetcher';
import { getDefinitions } from '../destiny2/d2-definitions.service';
import { translateReviewMode } from './reviewModeTranslator';
import { IComponentOptions, IController, IRootScopeService, IScope } from 'angular';
import { DimItem } from '../inventory/item-types';
import { D1ItemUserReview, WorkingD1Rating } from './d1-dtr-api-types';
import { D2ItemUserReview, WorkingD2Rating } from './d2-dtr-api-types';
import { dimDestinyTrackerService } from './destiny-tracker.service';
import store from '../store/store';
import { setSetting } from '../settings/actions';
import { getRating } from './reducer';
import { DtrRating } from './dtr-api-types';

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
  $rootScope: IRootScopeService,
  $scope: IScope
) {
  'ngInject';

  const vm = this;
  vm.canReview = settings.allowIdPostToDtr;
  vm.allowIdPostToDtr = settings.allowIdPostToDtr;
  vm.showReviews = settings.showReviews;
  vm.toggledFlags = [];
  vm.submitted = false;
  vm.isCollapsed = false;
  vm.expandReview = false;

  vm.$onInit = () => {
    vm.canCreateReview = vm.canReview && vm.item.owner;

    if (vm.item.isDestiny1()) {
      const dtrRating = getRating(vm.item, store.getState().reviews.ratings) as DtrRating;
      if (dtrRating && dtrRating.userReview) {
        vm.expandReview =
          dtrRating.userReview.rating !== 0 && !dtrRating.userReview.treatAsSubmitted;
      }
    } else if (vm.item.isDestiny2()) {
      const dtrRating = getRating(vm.item, store.getState().reviews.ratings) as DtrRating;
      if (dtrRating && dtrRating.userReview) {
        vm.expandReview =
          dtrRating.userReview.voted !== 0 && !dtrRating.userReview.treatAsSubmitted;

        if (!dtrRating.userReview.mode) {
          dtrRating.userReview.mode = settings.reviewsModeSelection;
        }
      }
    }

    vm.reviewData = vm.getReviewData();

    if (vm.item.isDestiny2()) {
      getDefinitions().then((defs) => {
        vm.reviewModeOptions = getReviewModes(defs);
      });
    }

    dimDestinyTrackerService.getItemReviews(vm.item).then(() => $scope.$apply());
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

    const dtrRating = getRating(vm.item, store.getState().reviews.ratings) as DtrRating;

    if (vm.item.isDestiny2() && dtrRating && dtrRating.userReview.voted !== 0) {
      dtrRating.userReview.voted = 0;
      vm.reviewBlur();
    }
  };

  vm.clickReview = (reviewId: string) => {
    const review = this.findReview(reviewId);

    if (review && review.isReviewer) {
      vm.editReview();
    } else if (review && !review.isHighlighted) {
      vm.openFlagContext(reviewId);
    }
  };

  vm.openFlagContext = (reviewId: string) => {
    const review = this.findReview(reviewId);

    if (review && (review.isReviewer || review.isHighlighted)) {
      return;
    }

    const toggledReviewIndex = vm.toggledFlags.indexOf(reviewId);

    if (toggledReviewIndex === -1) {
      vm.toggledFlags.push(reviewId);
    }
  };

  vm.closeFlagContext = (reviewId: string) => {
    const toggledReviewIndex = vm.toggledFlags.indexOf(reviewId);

    vm.toggledFlags.splice(toggledReviewIndex);
  };

  vm.findReview = (reviewId: string): D1ItemUserReview | D2ItemUserReview | null => {
    if (vm.item.isDestiny1()) {
      const dtrRating = getRating(vm.item, store.getState().reviews.ratings) as DtrRating;

      if (!dtrRating || !dtrRating.reviewsResponse) {
        return null;
      }

      return dtrRating.reviewsResponse.reviews.find((review) => review.id === reviewId) || null;
    } else if (vm.item.isDestiny2()) {
      const dtrRating = getRating(vm.item, store.getState().reviews.ratings) as DtrRating;
      if (!dtrRating || !dtrRating.reviewsResponse) {
        return null;
      }
      return dtrRating.reviewsResponse.reviews.find((review) => review.id === reviewId) || null;
    }

    return null;
  };

  vm.editReview = (reviewId: string) => {
    const review = vm.findReview(reviewId);

    if (!review || !review.isReviewer) {
      return;
    }

    vm.expandReview = true;
  };

  vm.totalReviews = 0;

  vm.reviewLabels = [5, 4, 3, 2, 1];

  vm.getReviewData = () => {
    const dtrRating = getRating(vm.item, store.getState().reviews.ratings);

    if (
      !vm.item.isDestiny1() ||
      !dtrRating ||
      !dtrRating.reviewsResponse ||
      !dtrRating.reviewsResponse.reviews
    ) {
      return [];
    }

    const labels = vm.reviewLabels;
    const itemReviews = dtrRating.reviewsResponse.reviews;

    // the score histogram is a D1-only thing
    const mapData = _.map(labels, (label) => {
      if (vm.item.destinyVersion === 1) {
        const matchingReviews = (itemReviews as D1ItemUserReview[]).filter(
          (r) => r.rating === label
        );
        const highlightedReviews = matchingReviews.filter((r) => r.isHighlighted);

        return matchingReviews.length + highlightedReviews.length * 4;
      } else {
        const highlightedReviews = (itemReviews as D2ItemUserReview[]).filter(
          (review) => review.isHighlighted
        );
        return itemReviews.length + highlightedReviews.length * 4;
      }
    });

    vm.totalReviews = mapData.reduce((sum, cur) => sum + cur, 0);

    return mapData;
  };

  vm.shouldDrawChart = () => {
    vm.reviewData = vm.getReviewData();

    return vm.reviewData.length > 0 && _.some(vm.reviewData, (item) => item > 0);
  };

  vm.submitReview = () => {
    dimDestinyTrackerService.submitReview(vm.item);
    vm.expandReview = false;
    vm.submitted = true;
  };

  vm.setRating = (rating: number) => {
    if (rating) {
      if (!vm.item.isDestiny1()) {
        return;
      }

      const dtrRating = getRating(vm.item, store.getState().reviews.ratings) as DtrRating;

      if (!dtrRating) {
        return;
      }

      dtrRating.userReview.rating = rating;
    }
    vm.expandReview = true;
  };

  vm.reviewBlur = () => {
    const item = vm.item;
    const userReview = vm.toUserReview(item);

    dimDestinyTrackerService.updateCachedUserRankings(item, userReview);
  };

  vm.reportReview = (reviewId: string) => {
    const review = this.findReview(reviewId);

    if (review) {
      dimDestinyTrackerService.reportReview(review);
    }
  };

  vm.toUserReview = (item: DimItem): WorkingD1Rating | WorkingD2Rating => {
    const dtrRating = getRating(vm.item, store.getState().reviews.ratings);

    if (vm.item.isDestiny1() && dtrRating) {
      return dtrRating.userReview;
    } else if (vm.item.isDestiny2() && dtrRating) {
      return dtrRating.userReview;
    }

    throw new Error(`Received item type ${item.name} instead of a D1/D2 rating.`);
  };

  vm.featureFlags = {
    reviewsEnabled: $featureFlags.reviewsEnabled
  };

  $rootScope.$on('dim-item-reviews-fetched', () => {
    vm.reviewData = vm.getReviewData();
  });

  vm.valueChanged = () => {
    vm.canReview = vm.allowIdPostToDtr;

    if (vm.canReview) {
      dimDestinyTrackerService.getItemReviews(vm.item);
    }

    store.dispatch(setSetting('allowIdPostToDtr', vm.allowIdPostToDtr));
    store.dispatch(setSetting('showReviews', vm.showReviews));
  };

  vm.translateReviewMode = (review: D2ItemUserReview) => {
    if (!vm.reviewModeOptions) {
      getDefinitions().then((defs) => {
        vm.reviewModeOptions = getReviewModes(defs);
      });

      return translateReviewMode(vm.reviewModeOptions, review);
    }

    return translateReviewMode(vm.reviewModeOptions, review);
  };

  vm.setUserVote = (userVote: number) => {
    if (!vm.item.isDestiny2()) {
      return;
    }

    const dtrRating = getRating(vm.item, store.getState().reviews.ratings) as DtrRating;

    if (!dtrRating) {
      return;
    }

    dtrRating.userReview.voted = dtrRating.userReview.voted === userVote ? 0 : userVote;

    const treatAsTouched = dtrRating.userReview.voted !== 0;

    vm.expandReview = treatAsTouched;
    dtrRating.userReview.treatAsSubmitted = !treatAsTouched;

    vm.reviewBlur();
  };
}
*/
