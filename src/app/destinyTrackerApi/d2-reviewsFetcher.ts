import * as _ from 'underscore';
import { D2ItemTransformer } from './d2-itemTransformer';
import { D2PerkRater } from './d2-perkRater';
import { getActivePlatform } from '../accounts/platform.service';
import { IPromise } from 'angular';
import { D2TrackerErrorHandler } from './d2-trackerErrorHandler';
import { D2ReviewDataCache } from './d2-reviewDataCache';
import { DimItem } from '../inventory/store/d2-item-factory.service';
import { DtrItem, DtrReviewContainer, DimWorkingUserReview, DtrUserReview } from '../item-review/destiny-tracker.service';
import { $q, $http } from 'ngimport';

/**
 * Get the community reviews from the DTR API for a specific item.
 */
class D2ReviewsFetcher {
  _trackerErrorHandler: D2TrackerErrorHandler;
  _perkRater: D2PerkRater;
  _userFilter: any;
  _reviewDataCache: D2ReviewDataCache;
  _loadingTracker: any;
  _itemTransformer: D2ItemTransformer;
  constructor(loadingTracker, reviewDataCache, userFilter) {
    this._itemTransformer = new D2ItemTransformer();
    this._trackerErrorHandler = new D2TrackerErrorHandler();
    this._loadingTracker = loadingTracker;
    this._reviewDataCache = reviewDataCache;
    this._userFilter = userFilter;
    this._perkRater = new D2PerkRater();
  }

  _getItemReviewsCall(item: DtrItem, platformSelection: number) {
    const queryString = `page=1&platform=${platformSelection}`;

    return {
      method: 'POST',
      url: `https://db-api.destinytracker.com/api/external/reviews?${queryString}`, // TODO: pagination
      data: item,
      dataType: 'json'
    };
  }

  _getItemReviewsPromise(item, platformSelection: number): IPromise<DtrReviewContainer> {
    const dtrItem = this._itemTransformer.getRollAndPerks(item);

    const promise = $q
      .when(this._getItemReviewsCall(dtrItem, platformSelection))
      .then($http)
      .then(this._trackerErrorHandler.handleErrors.bind(this._trackerErrorHandler), this._trackerErrorHandler.handleErrors.bind(this._trackerErrorHandler))
      .then((response) => response.data);

    this._loadingTracker.addPromise(promise);

    return promise as IPromise<DtrReviewContainer>;
  }

  _getUserReview(reviewData: DimWorkingUserReview | DtrReviewContainer) {
    // bugbug: will need to use membership service if isReviewer flag stays broke
    return reviewData.reviews.find((r) => r.isReviewer);
  }

  _sortAndIgnoreReviews(item: DimItem) {
    if (item.reviews) {
      item.reviews.sort(this._sortReviews);

      item.reviews.forEach((writtenReview) => {
        writtenReview.isIgnored = this._userFilter.conditionallyIgnoreReview(writtenReview);
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

  _attachReviews(item: DimItem, reviewData: DtrReviewContainer | DimWorkingUserReview) {
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

  _attachCachedReviews(item: DimItem, cachedItem: DimWorkingUserReview) {
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
  getItemReviews(item: DimItem, platformSelection: number) {
    if (!item.reviewable) {
      return $q.when();
    }

    const ratingData = this._reviewDataCache.getRatingData(item);

    if (ratingData && ratingData.reviewsDataFetched) {
      this._attachCachedReviews(item,
                                ratingData);

      return $q.when();
    }

    return this._getItemReviewsPromise(item, platformSelection)
      .then((reviewData) => {
        this._markUserReview(reviewData);
        this._attachReviews(item,
                            reviewData);
      });
  }

  fetchItemReviews(itemHash: number, platformSelection: number): IPromise<DtrReviewContainer> {
    const ratingData = this._reviewDataCache.getRatingData(undefined, itemHash);

    if (ratingData && ratingData.reviewsDataFetched) {
      return $q.when(ratingData);
    }

    const fakeItem = { hash: itemHash, id: -1 };

    return this._getItemReviewsPromise(fakeItem, platformSelection);
  }
}

export { D2ReviewsFetcher };
