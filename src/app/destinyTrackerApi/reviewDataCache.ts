import { ItemTransformer } from './itemTransformer';
import * as _ from 'underscore';
import { D1ItemFetchResponse, D1ItemReviewResponse, D1ItemWorkingUserReview } from '../item-review/destiny-tracker.service';
import { DimItem } from '../inventory/store/d2-item-factory.service';

/**
 * Cache of review data.
 * Mixes and matches remote as well as local data to cut down on chatter and prevent data loss on store refreshes.
 */
export class ReviewDataCache {
  _itemStores: D1ItemFetchResponse[] | D1ItemReviewResponse[];
  _itemTransformer: ItemTransformer;

  constructor() {
    this._itemTransformer = new ItemTransformer();
    this._itemStores = [];
  }

  _getMatchingItem(item): D1ItemFetchResponse | D1ItemReviewResponse {
    const dtrItem = this._itemTransformer.translateToDtrWeapon(item);

    // The DTR API isn't consistent about returning reference ID as an int in its responses
    // and findWhere considers 123 !== "123".
    dtrItem.referenceId = String(dtrItem.referenceId);

    return _.find(this._itemStores, { referenceId: dtrItem.referenceId, roll: dtrItem.roll });
  }

  /**
   * Get the locally-cached review data for the given item from the DIM store, if it exists.
   */
  getRatingData(item): D1ItemFetchResponse | D1ItemReviewResponse | undefined {
    return this._getMatchingItem(item) || undefined;
  }

  _toAtMostOneDecimal(rating) {
    if (!rating) {
      return null;
    }

    if ((rating % 1) === 0) {
      return rating;
    }

    return rating.toFixed(1);
  }

  /**
   * Add (and track) the community score.
   */
  addScore(dtrRating: D1ItemFetchResponse | D1ItemReviewResponse) {
    dtrRating.rating = this._toAtMostOneDecimal(dtrRating.rating);

    this._itemStores.push(dtrRating);
  }

  /**
   * Keep track of this user review for this (DIM store) item.
   * This supports the workflow where a user types a review but doesn't submit it, a store refresh
   * happens in the background, then they go back to the item.  Or they post data and the DTR API
   * is still feeding back cached data or processing it or whatever.
   * The expectation is that this will be building on top of reviews data that's already been supplied.
   */
  addUserReviewData(item,
                    userReview) {
    const matchingItem = this._getMatchingItem(item);

    this._markItemAsLocallyCached(item, true);

    const rating = matchingItem.rating;

    Object.assign(matchingItem,
                  userReview);

    matchingItem.userRating = matchingItem.rating;

    matchingItem.rating = rating;
  }

  /**
   * Keep track of expanded item review data from the DTR API for this DIM store item.
   * The expectation is that this will be building on top of community score data that's already been supplied.
   */
  addReviewsData(item,
                 reviewsData) {
    const matchingItem = this._getMatchingItem(item);
    if (matchingItem) {
      matchingItem.reviews = reviewsData.reviews;
      matchingItem.reviewsDataFetched = true;
    }
  }

  /**
   * Fetch the collection of review data that we've stored locally.
   */
  getItemStores(): any[] {
    return this._itemStores;
  }

  _markItemAsLocallyCached(item,
                           isCached) {
    item.isLocallyCached = isCached;
  }

  markReviewAsIgnored(writtenReview) {
    writtenReview.isIgnored = true;
  }

  markItemAsReviewedAndSubmitted(item: DimItem,
                                 userReview: D1ItemWorkingUserReview) {
    this._markItemAsLocallyCached(item, false);
    const matchingItem = this._getMatchingItem(item);

    matchingItem.reviews = (matchingItem.reviews) ? _.reject(matchingItem.reviews, { isReviewer: true }) : [];

    matchingItem.reviews.unshift(userReview);
  }

  /**
   * There's a 10 minute delay between posting an item review to the DTR API
   * and being able to fetch that review from it.
   * To prevent angry bug reports, we'll continue to hang on to local user review data for
   * 10 minutes, then we'll purge it (so that it can be re-pulled).
   *
   * Item is just an item from DIM's stores.
   */
  eventuallyPurgeCachedData(item) {
    const tenMinutes = 1000 * 60 * 10;

    setTimeout(() => {
      const matchingItem = this._getMatchingItem(item);

      matchingItem.reviews = null;
      matchingItem.reviewsDataFetched = false;
    },
      tenMinutes);
  }
}
