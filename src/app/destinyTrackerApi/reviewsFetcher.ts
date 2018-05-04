import { ItemTransformer } from './itemTransformer';
import { PerkRater } from './perkRater';
import { UserFilter } from './userFilter';
import { ReviewDataCache } from './reviewDataCache';
import { handleErrors } from './trackerErrorHandler';
import { loadingTracker } from '../ngimport-more';
import { D1Item } from '../inventory/item-types';
import { dtrFetch } from './dtr-service-helper';
import { D1ItemReviewResponse, D1CachedItem } from '../item-review/d1-dtr-api-types';

/**
 * Get the community reviews from the DTR API for a specific item.
 * This was tailored to work for weapons.  Items (armor, etc.) may or may not work.
 */
export class ReviewsFetcher {
  _perkRater = new PerkRater();
  _userFilter = new UserFilter();
  _reviewDataCache: ReviewDataCache;
  _itemTransformer = new ItemTransformer();
  constructor(reviewDataCache: ReviewDataCache) {
    this._reviewDataCache = reviewDataCache;
  }

  _getItemReviewsCall(item) {
    return {
      method: 'POST',
      url: 'https://reviews-api.destinytracker.net/api/weaponChecker/reviews',
      data: item,
      dataType: 'json'
    };
  }

  _getItemReviewsPromise(item: D1Item): Promise<D1ItemReviewResponse[]> {
    const postWeapon = this._itemTransformer.getRollAndPerks(item);

    const promise = dtrFetch(
      'https://reviews-api.destinytracker.net/api/weaponChecker/reviews',
      postWeapon
    ).then(handleErrors, handleErrors);

    loadingTracker.addPromise(promise);

    return promise;
  }

  _sortAndIgnoreReviews(item) {
    if (item.reviews) {
      item.reviews.sort(this._sortReviews);

      item.reviews.forEach((writtenReview) => {
        writtenReview.isIgnored = this._userFilter.conditionallyIgnoreReview(writtenReview);
      });
    }
  }

  _attachReviews(item: D1Item, reviewData) {
    reviewData.reviews = reviewData.reviews.filter((review) => review.review); // only attach reviews with text associated

    this._sortAndIgnoreReviews(item);

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

    const aDate = new Date(a.timestamp).getTime();
    const bDate = new Date(b.timestamp).getTime();

    return bDate - aDate;
  }

  _attachCachedReviews(item: D1Item,
                       cachedItem: D1CachedItem) {
    this._attachReviews(item, cachedItem);
  }

  /**
   * Get community (which may include the current user's) reviews for a given item and attach
   * them to the item.
   * Attempts to fetch data from the cache first.
   */
  getItemReviews(item: D1Item) {
    if (!item.reviewable) {
      return;
    }
    const cachedData = this._reviewDataCache.getRatingData(item);

    if (cachedData && cachedData.reviewsResponse) {
      this._attachCachedReviews(item,
                                cachedData);

      return;
    }

    this._getItemReviewsPromise(item)
      .then((data) => this._attachReviews(item,
                                          data));
  }
}
