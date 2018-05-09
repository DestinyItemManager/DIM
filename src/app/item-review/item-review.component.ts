import * as _ from 'underscore';
import { settings } from '../settings/settings';
import template from './item-review.html';
import './item-review.scss';
import { getReviewModes } from '../destinyTrackerApi/reviewModesFetcher';
import { getDefinitions } from '../destiny2/d2-definitions.service';
import { translateReviewMode } from './reviewModeTranslator';
import { IComponentOptions, IController, IScope, IRootScopeService } from 'angular';
import { DestinyTrackerServiceType } from './destiny-tracker.service';
import { DimItem, D1Item, D2Item } from '../inventory/item-types';
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

    if (vm.item.destinyVersion === 1) {
      const d1Item = vm.item as D1Item;

      if (d1Item && d1Item.dtrRating && d1Item.dtrRating.userReview) {
        vm.expandReview = (d1Item.dtrRating.userReview.rating !== 0 && !d1Item.dtrRating.userReview.treatAsSubmitted);
      }
    } else if (vm.item.destinyVersion === 2) {
      const d2Item = vm.item as D2Item;

      if (d2Item && d2Item.dtrRating && d2Item.dtrRating.userReview) {
        vm.expandReview = (d2Item.dtrRating.userReview.voted !== 0 && !d2Item.dtrRating.userReview.treatAsSubmitted);

        if (!d2Item.dtrRating.userReview.mode) {
          d2Item.dtrRating.userReview.mode = settings.reviewsModeSelection;
        }
      }
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

    const d2Item = vm.item as D2Item;

    if (d2Item.dtrRating.userReview.voted !== 0) {
      d2Item.dtrRating.userReview.voted = 0;
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

  vm.findReview = (reviewId: string): D1ItemUserReview | D2ItemUserReview | null => {
    if (vm.item.destinyVersion === 1) {
      const d1Item = vm.item as D1Item;
      if (!d1Item || !d1Item.dtrRating.reviewsResponse) {
        return null;
      }

      return d1Item.dtrRating.reviewsResponse.reviews.find((review) => review.reviewId === reviewId) || null;
    } else {
      const d2Item = vm.item as D2Item;
      if (!d2Item || !d2Item.dtrRating.reviewsResponse) {
        return null;
      }
      return d2Item.dtrRating.reviewsResponse.reviews.find((review) => review.id === reviewId) || null;
    }
  };

  vm.editReview = (reviewId) => {
    const review = vm.findReview(reviewId);

    if (!review || !review.isReviewer) {
      return;
    }

    vm.expandReview = true;

    // if (vm.item.destinyVersion === 1) {
    //   const d1Item = vm.item as D1Item;
    // } else if (vm.item.destinyVersion === 2) {
    //   const d2Item = vm.item as D2Item;
    // }

    // if (review.voted) {
    //   vm.item.userVote = review.voted;
    // }

    // if (review.mode) {
    //   vm.item.mode = review.mode.toString();
    // }
  };

  vm.totalReviews = 0;

  vm.reviewLabels = [5, 4, 3, 2, 1];

  vm.getReviewData = () => {
    const d1Item = vm.item as D1Item;

    if (!d1Item || !d1Item.dtrRating.reviewsResponse || !d1Item.dtrRating.reviewsResponse.reviews) {
      return [];
    }

    const labels = vm.reviewLabels;
    const itemReviews = d1Item.dtrRating.reviewsResponse.reviews;

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
      const d1Item = vm.item as D1Item;

      if (!d1Item) {
        return;
      }

      d1Item.dtrRating.userReview.rating = rating;
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

  vm.toUserReview = (item: DimItem): WorkingD1Rating | WorkingD2Rating => {
    if (vm.item.destinyVersion === 1) {
      return (item as D1Item).dtrRating.userReview;
    }

    return (item as D2Item).dtrRating.userReview;
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
    const d2Item = vm.item as D2Item;

    if (!d2Item) {
      return;
    }

    d2Item.dtrRating.userReview.voted = (d2Item.dtrRating.userReview.voted === userVote) ? 0 : userVote;

    const treatAsTouched = (d2Item.dtrRating.userReview.voted !== 0);

    vm.expandReview = treatAsTouched;
    d2Item.dtrRating.userReview.treatAsSubmitted = !treatAsTouched;

    vm.reviewBlur();
  };
}
