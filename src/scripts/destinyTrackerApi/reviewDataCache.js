import _ from 'underscore';
import { ItemTransformer } from './itemTransformer';

/**
 * Cache of review data.
 * Mixes and matches remote as well as local data to cut down on chatter and prevent data loss on store refreshes.
 *
 * @class ReviewDataCache
 */
class ReviewDataCache {
  constructor() {
    this._itemTransformer = new ItemTransformer();
    this._itemStores = [];
  }

  _getMatchingItem(item) {
    const dtrItem = this._itemTransformer.translateToDtrWeapon(item);

    // The DTR API isn't consistent about returning reference ID as an int in its responses
    // and findWhere considers 123 !== "123".
    dtrItem.referenceId = String(dtrItem.referenceId);

    return _.find(this._itemStores, { referenceId: dtrItem.referenceId, roll: dtrItem.roll });
  }

  /**
   * Get the locally-cached review data for the given item from the DIM store, if it exists.
   *
   * @param {any} item
   * @returns {any}
   *
   * @memberof ReviewDataCache
   */
  getRatingData(item) {
    return this._getMatchingItem(item) || null;
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
   *
   * @param {any} dtrRating
   *
   * @memberof ReviewDataCache
   */
  addScore(dtrRating) {
    dtrRating.rating = this._toAtMostOneDecimal(dtrRating.rating);

    this._itemStores.push(dtrRating);
  }

  /**
   * Keep track of this user review for this (DIM store) item.
   * This supports the workflow where a user types a review but doesn't submit it, a store refresh
   * happens in the background, then they go back to the item.  Or they post data and the DTR API
   * is still feeding back cached data or processing it or whatever.
   * The expectation is that this will be building on top of reviews data that's already been supplied.
   *
   * @param {any} item
   * @param {any} userReview
   *
   * @memberof ReviewDataCache
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
   *
   * @param {any} item
   * @param {any} reviewsData
   *
   * @memberof ReviewDataCache
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
   *
   * @returns {array}
   *
   * @memberof ReviewDataCache
   */
  getItemStores() {
    return this._itemStores;
  }

  /**
   * Should we consider this item locally cached with changes?
   *
   * @param {any} item
   * @param {bool} isCached
   * @memberof ReviewDataCache
   */
  _markItemAsLocallyCached(item,
                           isCached) {
    item.isLocallyCached = isCached;
  }

  markItemAsReviewedAndSubmitted(item,
                                 userReview) {
    this._markItemAsLocallyCached(item, false);
    const matchingItem = this._getMatchingItem(item);

    if (matchingItem.reviews) {
      matchingItem.reviews = _.find(matchingItem.reviews, { isReviewer: false });
    }

    if (!matchingItem.reviews) {
      matchingItem.reviews = [];
    }

    matchingItem.reviews.unshift(userReview);
  }

  /**
   * There's a 10 minute delay between posting an item review to the DTR API
   * and being able to fetch that review from it.
   * To prevent angry bug reports, we'll continue to hang on to local user review data for
   * 10 minutes, then we'll purge it (so that it can be re-pulled).
   *
   * Item is just an item from DIM's stores.
   *
   * @param {any} item
   *
   * @memberof ReviewDataCache
   */
  eventuallyPurgeCachedData(item) {
    const tenMinutes = 1000 * 60 * 10;
    const self = this;

    setTimeout(() => {
      const matchingItem = self._getMatchingItem(item);

      matchingItem.reviews = null;
      matchingItem.reviewsDataFetched = false;
    },
      tenMinutes);
  }
}

export { ReviewDataCache };
