import * as _ from 'underscore';
import { D2PerkRater } from './d2-perkRater';
import { getActivePlatform } from '../accounts/platform.service';
import { D2ReviewDataCache } from './d2-reviewDataCache';
import { DtrReviewContainer, DimWorkingUserReview, DtrUserReview } from '../item-review/destiny-tracker.service';
import { UserFilter } from './userFilter';
import { loadingTracker } from '../ngimport-more';
import { handleD2Errors } from './d2-trackerErrorHandler';
import { D2Item } from '../inventory/item-types';
import { dtrFetch } from './dtr-service-helper';
import { getRollAndPerks } from './d2-itemTransformer';

/**
 * Get the community reviews from the DTR API for a specific item.
 */
class D2ReviewsFetcher {
  _perkRater = new D2PerkRater();
  _userFilter = new UserFilter();
  _reviewDataCache: D2ReviewDataCache;
  constructor(reviewDataCache) {
    this._reviewDataCache = reviewDataCache;
  }

  _getItemReviewsPromise(item, platformSelection: number, mode: number): Promise<DtrReviewContainer> {
    const dtrItem = getRollAndPerks(item);

    const queryString = `page=1&platform=${platformSelection}&mode=${mode}`;
    const promise = dtrFetch(
      `https://db-api.destinytracker.com/api/external/reviews?${queryString}`, // TODO: pagination
      dtrItem
    ).then(handleD2Errors, handleD2Errors);

    loadingTracker.addPromise(promise);

    return promise;
  }

  _getUserReview(reviewData: DimWorkingUserReview | DtrReviewContainer) {
    // bugbug: will need to use membership service if isReviewer flag stays broke
    return reviewData.reviews.find((r) => r.isReviewer);
  }

  _sortAndIgnoreReviews(item: D2Item) {
    if (item.reviews) {
      item.reviews = item.reviews as DtrUserReview[]; // D1 and D2 reviews take different shapes
      item.reviews.sort(this._sortReviews);

      item.reviews.forEach((writtenReview) => {
        this._userFilter.conditionallyIgnoreReview(writtenReview);
      });
    }
  }

  _markUserReview(reviewData: DtrReviewContainer) {
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

  _attachReviews(item: D2Item, reviewData: DtrReviewContainer | DimWorkingUserReview) {
    const userReview = this._getUserReview(reviewData);

    // TODO: reviewData has two very different shapes depending on whether it's from cache or from the service
    item.ratingCount = reviewData.totalReviews;
    item.reviews = reviewData.reviews.filter((review) => review.text);

    this._sortAndIgnoreReviews(item);

    if (userReview) {
      item.userVote = userReview.voted;
      item.userReview = userReview.text;
      item.userReviewPros = userReview.pros;
      item.userReviewCons = userReview.cons;
      item.mode = userReview.mode;
    }

    this._reviewDataCache.addReviewsData(item, reviewData);

    this._perkRater.ratePerks(item);
    item.reviewsUpdated = Date.now();
  }

  _sortReviews(a: DtrUserReview, b: DtrUserReview) {
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

  _attachCachedReviews(item: D2Item, cachedItem: DimWorkingUserReview) {
    item.reviews = cachedItem.reviews;

    this._attachReviews(item, cachedItem);

    if (cachedItem.userRating) {
      item.userRating = cachedItem.userRating;
    }

    if (cachedItem.review) {
      item.userReview = cachedItem.review;
    }

    if (cachedItem.pros) {
      item.userReviewPros = cachedItem.pros;
    }

    if (cachedItem.cons) {
      item.userReviewCons = cachedItem.cons;
    }
  }

  /**
   * Get community (which may include the current user's) reviews for a given item and attach
   * them to the item.
   * Attempts to fetch data from the cache first.
   */
  getItemReviews(item: D2Item, platformSelection: number, mode: number) {
    if (!item.reviewable) {
      return Promise.resolve();
    }

    const ratingData = this._reviewDataCache.getRatingData(item);

    if (ratingData && ratingData.reviewsDataFetched) {
      this._attachCachedReviews(item,
                                ratingData);

      return Promise.resolve();
    }

    return this._getItemReviewsPromise(item, platformSelection, mode)
      .then((reviewData) => {
        this._markUserReview(reviewData);
        this._attachReviews(item,
                            reviewData);
      });
  }

  fetchItemReviews(itemHash: number, platformSelection: number, mode: number): Promise<DtrReviewContainer> {
    const ratingData = this._reviewDataCache.getRatingData(undefined, itemHash);

    if (ratingData && ratingData.reviewsDataFetched) {
      return Promise.resolve(ratingData);
    }

    const fakeItem = { hash: itemHash, id: -1 };

    return this._getItemReviewsPromise(fakeItem, platformSelection, mode);
  }
}

export { D2ReviewsFetcher };
