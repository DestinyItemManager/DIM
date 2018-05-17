import { D1ItemReviewResponse, D1CachedItem } from '../item-review/destiny-tracker.service';
import { ReviewDataCache } from './reviewDataCache';
import { handleErrors } from './trackerErrorHandler';
import { loadingTracker } from '../ngimport-more';
import { D1Item } from '../inventory/item-types';
import { dtrFetch } from './dtr-service-helper';
import { getRollAndPerks } from './itemTransformer';
import { ratePerks } from './perkRater';
import { conditionallyIgnoreReview } from './userFilter';

/**
 * Get the community reviews from the DTR API for a specific item.
 * This was tailored to work for weapons.  Items (armor, etc.) may or may not work.
 */
export class ReviewsFetcher {
  _reviewDataCache: ReviewDataCache;
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
    const postWeapon = getRollAndPerks(item);

    const promise = dtrFetch(
      'https://reviews-api.destinytracker.net/api/weaponChecker/reviews',
      postWeapon
    ).then(handleErrors, handleErrors);

    loadingTracker.addPromise(promise);

    return promise;
  }

  _getUserReview(reviewData: D1ItemReviewResponse | D1CachedItem) {
    return reviewData.reviews.find((review) => review.isReviewer);
  }

  _sortAndIgnoreReviews(item) {
    if (item.reviews) {
      item.reviews.sort(this._sortReviews);

      item.reviews.forEach((writtenReview) => {
        writtenReview.isIgnored = conditionallyIgnoreReview(writtenReview);
      });
    }
  }

  _attachReviews(item: D1Item, reviewData) {
    const userReview = this._getUserReview(reviewData);

    // TODO: reviewData has two very different shapes depending on whether it's from cache or from the service
    item.totalReviews = reviewData.totalReviews === undefined ? reviewData.ratingCount : reviewData.totalReviews;

    item.reviews = reviewData.reviews.filter((review) => review.review); // only attach reviews with text associated

    this._sortAndIgnoreReviews(item);

    if (userReview) {
      if (userReview.rating) {
        item.userRating = userReview.rating;
      }
      item.userReview = userReview.review;
      item.userReviewPros = userReview.pros;
      item.userReviewCons = userReview.cons;
    }

    this._reviewDataCache.addReviewsData(item, reviewData);

    ratePerks(item);
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
  getItemReviews(item: D1Item) {
    if (!item.reviewable) {
      return;
    }
    const ratingData = this._reviewDataCache.getRatingData(item);

    if (ratingData && ratingData.reviewsDataFetched) {
      this._attachCachedReviews(item,
                                ratingData);

      return;
    }

    this._getItemReviewsPromise(item)
      .then((data) => this._attachReviews(item,
                                          data));
  }
}
