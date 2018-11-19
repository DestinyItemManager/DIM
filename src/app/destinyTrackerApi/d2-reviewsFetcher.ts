import * as _ from 'lodash';
import { getActivePlatform } from '../accounts/platform.service';
import { D2ReviewDataCache } from './d2-reviewDataCache';
import { loadingTracker } from '../shell/loading-tracker';
import { handleD2Errors } from './d2-trackerErrorHandler';
import { D2Item } from '../inventory/item-types';
import { dtrFetch } from './dtr-service-helper';
import { D2ItemReviewResponse, D2ItemUserReview } from '../item-review/d2-dtr-api-types';
import { getRollAndPerks } from './d2-itemTransformer';
import { ratePerks } from './d2-perkRater';
import { conditionallyIgnoreReviews } from './userFilter';

/**
 * Get the community reviews from the DTR API for a specific item.
 */
class D2ReviewsFetcher {
  _reviewDataCache: D2ReviewDataCache;

  constructor(reviewDataCache) {
    this._reviewDataCache = reviewDataCache;
  }

  _getItemReviewsPromise(
    item,
    platformSelection: number,
    mode: number
  ): Promise<D2ItemReviewResponse> {
    const dtrItem = getRollAndPerks(item);

    const queryString = `page=1&platform=${platformSelection}&mode=${mode}`;
    const promise = dtrFetch(
      `https://db-api.destinytracker.com/api/external/reviews?${queryString}`, // TODO: pagination
      dtrItem
    ).then(handleD2Errors, handleD2Errors);

    loadingTracker.addPromise(promise);

    return promise;
  }

  _getUserReview(reviewData: D2ItemReviewResponse) {
    // bugbug: will need to use membership service if isReviewer flag stays broke
    return reviewData.reviews.find((r) => r.isReviewer);
  }

  _sortAndIgnoreReviews(reviewResponse: D2ItemReviewResponse) {
    if (reviewResponse.reviews) {
      reviewResponse.reviews.sort(this._sortReviews);

      conditionallyIgnoreReviews(reviewResponse.reviews);
    }
  }

  _markUserReview(reviewData: D2ItemReviewResponse) {
    const membershipInfo = getActivePlatform();

    if (!membershipInfo) {
      return;
    }

    const membershipId = membershipInfo.membershipId;

    _.each(reviewData.reviews, (review) => {
      if (review.reviewer.membershipId === membershipId) {
        review.isReviewer = true;
      }
    });

    return reviewData;
  }

  _attachReviews(item: D2Item, reviewData: D2ItemReviewResponse) {
    this._sortAndIgnoreReviews(reviewData);

    this._reviewDataCache.addReviewsData(item, reviewData);
    item.dtrRating = this._reviewDataCache.getRatingData(item);

    ratePerks(item);
  }

  _sortReviews(a: D2ItemUserReview, b: D2ItemUserReview) {
    if (a.isReviewer) {
      return -1;
    }

    if (b.isReviewer) {
      return 1;
    }

    if (a.isHighlighted) {
      return -1;
    }

    if (b.isHighlighted) {
      return 1;
    }

    const ratingDiff = b.voted - a.voted;

    if (ratingDiff !== 0) {
      return ratingDiff;
    }

    const aDate = new Date(a.timestamp).getTime();
    const bDate = new Date(b.timestamp).getTime();

    return bDate - aDate;
  }

  /**
   * Get community (which may include the current user's) reviews for a given item and attach
   * them to the item.
   * Attempts to fetch data from the cache first.
   */
  async getItemReviews(item: D2Item, platformSelection: number, mode: number) {
    if (!item.reviewable) {
      return;
    }

    const cachedData = this._reviewDataCache.getRatingData(item);

    if (cachedData) {
      item.dtrRating = cachedData;
    }
    if (cachedData && cachedData.reviewsResponse) {
      ratePerks(item);
      return;
    }

    return this._getItemReviewsPromise(item, platformSelection, mode).then((reviewData) => {
      this._markUserReview(reviewData);
      this._attachReviews(item, reviewData);
    });
  }

  fetchItemReviews(
    itemHash: number,
    platformSelection: number,
    mode: number
  ): Promise<D2ItemReviewResponse> {
    const cachedData = this._reviewDataCache.getRatingData(undefined, itemHash);

    if (cachedData && cachedData.reviewsResponse) {
      return Promise.resolve(cachedData.reviewsResponse);
    }

    const fakeItem = { hash: itemHash, id: -1 };

    return this._getItemReviewsPromise(fakeItem, platformSelection, mode);
  }
}

export { D2ReviewsFetcher };
