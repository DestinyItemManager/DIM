import * as _ from 'lodash';
import { D1Item } from '../inventory/item-types';
import {
  D1RatingData,
  D1ItemFetchResponse,
  WorkingD1Rating,
  D1ItemReviewResponse,
  D1ItemUserReview
} from '../item-review/d1-dtr-api-types';
import { translateToDtrWeapon } from './itemTransformer';
import store from '../store/store';
import { updateRatings } from '../item-review/actions';
import { getItemStoreKey } from '../item-review/reducer';
import produce from 'immer';

/**
 * Cache of review data.
 * Mixes and matches remote as well as local data to cut down on chatter and prevent data loss on store refreshes.
 */
export class ReviewDataCache {
  _itemStores: { [key: string]: D1RatingData } = {};

  _getMatchingItem(item: D1Item): D1RatingData | undefined {
    const dtrItem = translateToDtrWeapon(item);
    return this._itemStores[getItemStoreKey(dtrItem.referenceId, dtrItem.roll)];
  }

  _replaceRatingData(oldRatingData: D1RatingData, newRatingData: D1RatingData) {
    const oldItemKey = getItemStoreKey(oldRatingData.referenceId, oldRatingData.roll);
    if (!this._itemStores[oldItemKey]) {
      return;
    }

    this._itemStores = produce(this._itemStores, (draft) => {
      delete draft[oldItemKey];
      draft[getItemStoreKey(newRatingData.referenceId, newRatingData.roll)] = newRatingData;
    });
  }

  /**
   * Get the locally-cached review data for the given item from the DIM store, if it exists.
   */
  getRatingData(item: D1Item): D1RatingData {
    const cachedItem = this._getMatchingItem(item);

    if (cachedItem) {
      return cachedItem;
    }

    const blankCacheItem = this._createBlankCacheItem(item);
    this._itemStores[
      getItemStoreKey(blankCacheItem.referenceId, blankCacheItem.roll)
    ] = blankCacheItem;

    return blankCacheItem;
  }

  _createBlankUserReview(): WorkingD1Rating {
    return {
      rating: 0,
      pros: '',
      review: '',
      cons: '',
      treatAsSubmitted: false
    };
  }

  _createBlankCacheItem(item: D1Item): D1RatingData {
    const dtrItem = translateToDtrWeapon(item);

    return {
      referenceId: dtrItem.referenceId,
      roll: dtrItem.roll,
      userReview: this._createBlankUserReview(),
      lastUpdated: new Date(),
      overallScore: 0,
      ratingCount: 0,
      highlightedRatingCount: 0
    };
  }

  _toAtMostOneDecimal(rating: number): number {
    if (rating % 1 === 0) {
      return rating;
    }

    return Number(rating.toFixed(1));
  }

  /**
   * Add (and track) the community score.
   */
  addScore(dtrRating: D1ItemFetchResponse) {
    if (dtrRating && dtrRating.rating) {
      // not sure if we were sometimes receiving empty ratings or what
      dtrRating.rating = this._toAtMostOneDecimal(dtrRating.rating);
    }

    const previouslyCachedItem = this._itemStores[
      getItemStoreKey(dtrRating.referenceId, dtrRating.roll)
    ];

    if (previouslyCachedItem) {
      const updatedCachedItem: D1RatingData = {
        ...previouslyCachedItem,
        fetchResponse: dtrRating,
        lastUpdated: new Date(),
        overallScore: dtrRating.rating ? dtrRating.rating : 0,
        ratingCount: dtrRating.ratingCount
      };

      this._replaceRatingData(previouslyCachedItem, updatedCachedItem);

      dtrRating.highlightedRatingCount = dtrRating.highlightedRatingCount;
    } else {
      const cachedItem: D1RatingData = {
        referenceId: dtrRating.referenceId,
        fetchResponse: dtrRating,
        lastUpdated: new Date(),
        overallScore: dtrRating.rating || 0,
        ratingCount: dtrRating.ratingCount,
        highlightedRatingCount: dtrRating.highlightedRatingCount,
        roll: dtrRating.roll,
        userReview: this._createBlankUserReview()
      };

      this._itemStores = produce(this._itemStores, (draft) => {
        draft[getItemStoreKey(cachedItem.referenceId, cachedItem.roll)] = cachedItem;
      });

      store.dispatch(updateRatings({ itemStores: this._itemStores }));
    }
  }

  /**
   * Keep track of this user review for this (DIM store) item.
   * This supports the workflow where a user types a review but doesn't submit it, a store refresh
   * happens in the background, then they go back to the item.  Or they post data and the DTR API
   * is still feeding back cached data or processing it or whatever.
   * The expectation is that this will be building on top of reviews data that's already been supplied.
   */
  addUserReviewData(item: D1Item, userReview: WorkingD1Rating) {
    const cachedItem = this.getRatingData(item);

    const updatedCachedItem: D1RatingData = {
      ...cachedItem,
      userReview
    };

    this._replaceRatingData(cachedItem, updatedCachedItem);

    store.dispatch(updateRatings({ itemStores: this._itemStores }));
  }

  /**
   * Keep track of expanded item review data from the DTR API for this DIM store item.
   * The expectation is that this will be building on top of community score data that's already been supplied.
   */
  addReviewsData(item: D1Item, reviewsData: D1ItemReviewResponse) {
    const cachedItem = this.getRatingData(item);

    const updatedCachedItem: D1RatingData = {
      ...cachedItem,
      reviewsResponse: reviewsData
    };

    this._replaceRatingData(cachedItem, updatedCachedItem);

    const userReview = reviewsData.reviews.find((r) => r.isReviewer);

    if (userReview && updatedCachedItem.userReview.rating === 0) {
      Object.assign(updatedCachedItem.userReview, userReview);
    }

    store.dispatch(updateRatings({ itemStores: this._itemStores }));
  }

  /**
   * Fetch the collection of review data that we've stored locally.
   */
  getItemStores(): D1RatingData[] {
    return Object.values(this._itemStores);
  }

  markReviewAsIgnored(writtenReview: D1ItemUserReview) {
    writtenReview.isIgnored = true;
  }

  markItemAsReviewedAndSubmitted(item: D1Item) {
    const cachedItem = this.getRatingData(item);

    if (!cachedItem || !cachedItem.userReview) {
      return;
    }

    cachedItem.userReview.treatAsSubmitted = true;

    if (!cachedItem.reviewsResponse) {
      return;
    }

    cachedItem.reviewsResponse.reviews = cachedItem.reviewsResponse.reviews
      ? cachedItem.reviewsResponse.reviews.filter((review) => !review.isReviewer)
      : [];

    store.dispatch(updateRatings({ itemStores: this._itemStores }));
  }

  /**
   * There's a 10 minute delay between posting an item review to the DTR API
   * and being able to fetch that review from it.
   * To prevent angry bug reports, we'll continue to hang on to local user review data for
   * 10 minutes, then we'll purge it (so that it can be re-pulled).
   *
   * Item is just an item from DIM's stores.
   */
  eventuallyPurgeCachedData(item: D1Item) {
    const tenMinutes = 1000 * 60 * 10;

    setTimeout(() => {
      const cachedItem = this.getRatingData(item);

      const updatedCachedItem: D1RatingData = {
        ...cachedItem,
        reviewsResponse: undefined,
        userReview: {
          ...cachedItem.userReview,
          treatAsSubmitted: true
        }
      };

      this._replaceRatingData(cachedItem, updatedCachedItem);

      store.dispatch(updateRatings({ itemStores: this._itemStores }));
    }, tenMinutes);
  }
}
