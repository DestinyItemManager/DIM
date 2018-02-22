import * as _ from 'underscore';
import { D2ItemTransformer } from './d2-itemTransformer';
import { D2PerkRater } from './d2-perkRater';
import { getActivePlatform } from '../accounts/platform.service';
import { IQService, IHttpService } from 'angular';
import { D2TrackerErrorHandler } from './d2-trackerErrorHandler';
import { D2ReviewDataCache } from './d2-reviewDataCache';
import { DimItem } from '../inventory/store/d2-item-factory.service';

/**
 * Get the community reviews from the DTR API for a specific item.
 */
class D2ReviewsFetcher {
  _perkRater: D2PerkRater;
  _userFilter: any;
  _reviewDataCache: D2ReviewDataCache;
  _loadingTracker: any;
  _trackerErrorHandler: D2TrackerErrorHandler;
  _itemTransformer: D2ItemTransformer;
  $http: IHttpService;
  $q: IQService;
  constructor($q, $http, trackerErrorHandler, loadingTracker, reviewDataCache, userFilter) {
    this.$q = $q;
    this.$http = $http;
    this._itemTransformer = new D2ItemTransformer();
    this._trackerErrorHandler = trackerErrorHandler;
    this._loadingTracker = loadingTracker;
    this._reviewDataCache = reviewDataCache;
    this._userFilter = userFilter;
    this._perkRater = new D2PerkRater();
  }

  _getItemReviewsCall(item, platformSelection) {
    const queryString = `page=1&platform=${platformSelection}`;

    return {
      method: 'POST',
      url: `https://db-api.destinytracker.com/api/external/reviews?${queryString}`, // TODO: pagination
      data: item,
      dataType: 'json'
    };
  }

  _getItemReviewsPromise(item, platformSelection) {
    const postWeapon = this._itemTransformer.getRollAndPerks(item);

    const promise = this.$q
      .when(this._getItemReviewsCall(postWeapon, platformSelection))
      .then(this.$http)
      .then(this._trackerErrorHandler.handleErrors.bind(this._trackerErrorHandler), this._trackerErrorHandler.handleErrors.bind(this._trackerErrorHandler))
      .then((response) => response.data);

    this._loadingTracker.addPromise(promise);

    return promise;
  }

  _getUserReview(reviewData) {
    // bugbug: will need to use membership service if isReviewer flag stays broke
    return _.find(reviewData.reviews, { isReviewer: true });
  }

  _sortAndIgnoreReviews(item) {
    if (item.writtenReviews) {
      item.writtenReviews.sort(this._sortReviews);

      item.writtenReviews.forEach((writtenReview) => {
        writtenReview.isIgnored = this._userFilter.conditionallyIgnoreReview(writtenReview);
      });
    }
  }

  _markUserReview(reviewData) {
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

  _attachReviews(item, reviewData) {
    const userReview = this._getUserReview(reviewData);

    // TODO: reviewData has two very different shapes depending on whether it's from cache or from the service
    item.totalReviews = reviewData.totalReviews === undefined ? reviewData.ratingCount : reviewData.totalReviews;
    item.writtenReviews = _.filter(reviewData.reviews, 'text'); // only attach reviews with text associated

    this._sortAndIgnoreReviews(item);

    if (userReview) {
      item.userVote = userReview.voted;
      item.userReview = userReview.text;
      item.userReviewPros = userReview.pros;
      item.userReviewCons = userReview.cons;
    }

    this._reviewDataCache.addReviewsData(item, reviewData);

    this._perkRater.ratePerks(item);
  }

  _sortReviews(a, b) {
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

    const ratingDiff = b.rating - a.rating;

    if (ratingDiff !== 0) {
      return ratingDiff;
    }

    const aDate = new Date(a.timestamp);
    const bDate = new Date(b.timestamp);

    return bDate - aDate;
  }

  _attachCachedReviews(item,
    cachedItem) {
    item.communityReviews = cachedItem.reviews;

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
      return;
    }
    const ratingData = this._reviewDataCache.getRatingData(item);

    if (ratingData && ratingData.reviewsDataFetched) {
      this._attachCachedReviews(item,
        ratingData);

      return;
    }

    this._getItemReviewsPromise(item, platformSelection)
      .then((reviewData) => this._markUserReview(reviewData))
      .then((reviewData) => this._attachReviews(item,
        reviewData));
  }
}

export { D2ReviewsFetcher };
