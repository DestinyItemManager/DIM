import _ from 'underscore';
import { D2ItemTransformer } from './d2-itemTransformer';

/**
 * Cache of review data.
 * Mixes and matches remote as well as local data to cut down on chatter and prevent data loss on store refreshes.
 * Tailored for the Destiny 2 version.
 *
 * @class D2ReviewDataCache
 */
class D2ReviewDataCache {
  constructor() {
    this._itemTransformer = new D2ItemTransformer();
    this._itemStores = [];
  }

  _getMatchingItem(item) {
    const dtrItem = this._itemTransformer.translateToDtrItem(item);

    return _.find(this._itemStores, { referenceId: dtrItem.referenceId });
  }

  /**
   * Get the locally-cached review data for the given item from the DIM store, if it exists.
   *
   * @param {any} item
   * @returns {any}
   *
   * @memberof D2ReviewDataCache
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

  _getScore(dtrRating) {
    const rating = (dtrRating.votes.upvotes / dtrRating.votes.total) * 5;

    if ((rating < 1) &&
            (dtrRating.votes.total > 0)) {
      return 1;
    }

    return rating;
  }

  /**
   * Add (and track) the community score.
   *
   * @param {any} dtrRating
   *
   * @memberof ReviewDataCache
   */
  addScore(dtrRating) {
    const score = this._getScore(dtrRating);
    dtrRating.rating = this._toAtMostOneDecimal(score);

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
   * @memberof D2ReviewDataCache
   */
  addUserReviewData(item,
                    userReview) {
    const matchingItem = this._getMatchingItem(item);

    this._markItemAsLocallyCached(item, true);

    const userVote = matchingItem.userVote;

    Object.assign(matchingItem,
                  userReview);

    matchingItem.userRating = matchingItem.rating;

    matchingItem.userVote = userVote;
  }

  /**
   * Keep track of expanded item review data from the DTR API for this DIM store item.
   * The expectation is that this will be building on top of community score data that's already been supplied.
   *
   * @param {any} item
   * @param {any} reviewsData
   *
   * @memberof D2ReviewDataCache
   */
  addReviewsData(item,
                 reviewsData) {
    let matchingItem = this._getMatchingItem(item);

    if (!matchingItem) {
      this.addScore(reviewsData);
    }

    matchingItem = this._getMatchingItem(item);

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
   * @memberof D2ReviewDataCache
   */
  getItemStores() {
    return this._itemStores;
  }

  _markItemAsLocallyCached(item,
                           isCached) {
    item.isLocallyCached = isCached;
  }

  markReviewAsIgnored(writtenReview) {
    writtenReview.isIgnored = true;
  }

  markItemAsReviewedAndSubmitted(item,
                                 userReview) {
    this._markItemAsLocallyCached(item, false);
    const matchingItem = this._getMatchingItem(item);

    if (matchingItem.reviews) {
      matchingItem.reviews = _.reject(matchingItem.reviews, { isReviewer: true });
    }
    else {
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
   * @memberof D2ReviewDataCache
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

export { D2ReviewDataCache };
