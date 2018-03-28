import * as _ from 'underscore';
import { D2ItemTransformer } from './d2-itemTransformer';
import { DimItem } from '../inventory/store/d2-item-factory.service';
import { DimWorkingUserReview, DtrUserReview, DtrBulkItem } from '../item-review/destiny-tracker.service';
import { DestinyVendorSaleItemComponent } from 'bungie-api-ts/destiny2';

/**
 * Cache of review data.
 * Mixes and matches remote as well as local data to cut down on chatter and prevent data loss on store refreshes.
 * Tailored for the Destiny 2 version.
 */
class D2ReviewDataCache {
  _maxTotalVotes: number;
  _itemStores: DimWorkingUserReview[];
  _itemTransformer: D2ItemTransformer;
  constructor() {
    this._itemTransformer = new D2ItemTransformer();
    this._itemStores = [];
    this._maxTotalVotes = 0;
  }

  _getMatchingItem(item?: DimItem | DestinyVendorSaleItemComponent,
                   itemHash?: number) {
    if (item) {
      const dtrItem = this._itemTransformer.translateToDtrItem(item);

      return this._itemStores.find((s) => s.referenceId === dtrItem.referenceId);
    } else if (itemHash) {
      return this._itemStores.find((s) => s.referenceId === itemHash);
    } else {
      throw new Error("No data supplied to find a matching item from our stores.");
    }
  }

  /**
   * Get the locally-cached review data for the given item from the DIM store, if it exists.
   */
  getRatingData(item?: DimItem | DestinyVendorSaleItemComponent,
                itemHash?: number): DimWorkingUserReview | null {
    return this._getMatchingItem(item, itemHash) || null;
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

  _getDownvoteMultiplier(dtrRating: DtrBulkItem) {
    if (dtrRating.votes.total > (this._maxTotalVotes * 0.75)) {
      return 1;
    }

    if (dtrRating.votes.total > (this._maxTotalVotes * 0.5)) {
      return 1.5;
    }

    if (dtrRating.votes.total > (this._maxTotalVotes * 0.25)) {
      return 2;
    }

    return 2.5;
  }

  _getScore(dtrRating) {
    const downvoteMultipler = this._getDownvoteMultiplier(dtrRating);

    const rating = ((dtrRating.votes.total - (dtrRating.votes.downvotes * downvoteMultipler)) / dtrRating.votes.total) * 5;

    if ((rating < 1) &&
        (dtrRating.votes.total > 0)) {
      return 1;
    }

    return rating;
  }

  _setMaximumTotalVotes(bulkRankings) {
    this._maxTotalVotes = _.max(_.pluck(_.pluck(bulkRankings, 'votes'), 'total'));
  }

  /**
   * Add (and track) the community scores.
   */
  addScores(bulkRankings) {
    if (bulkRankings) {
      this._setMaximumTotalVotes(bulkRankings);

      bulkRankings.forEach((bulkRanking) => {
        this._addScore(bulkRanking);
      });
    }
  }

  /**
   * Add (and track) the community score.
   */
  _addScore(dtrRating) {
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
   */
  addUserReviewData(item: DimItem,
                    userReview) {
    const matchingItem = this._getMatchingItem(item);

    if (!matchingItem) {
      return;
    }

    this._markItemAsLocallyCached(item, true);

    const userVote = matchingItem.userVote;

    Object.assign(matchingItem,
                  userReview);

    matchingItem.userRating = matchingItem.rating;

    matchingItem.mode = matchingItem.mode;

    matchingItem.userVote = userVote;
  }

  /**
   * Keep track of expanded item review data from the DTR API for this DIM store item.
   * The expectation is that this will be building on top of community score data that's already been supplied.
   */
  addReviewsData(item,
                 reviewsData) {
    let matchingItem = this._getMatchingItem(item);

    if (!matchingItem) {
      this._addScore(reviewsData);
    }

    matchingItem = this._getMatchingItem(item);

    if (matchingItem) {
      matchingItem.reviews = reviewsData.reviews;
      matchingItem.reviewsDataFetched = true;
    }
  }

  /**
   * Fetch the collection of review data that we've stored locally.
   */
  getItemStores(): DimWorkingUserReview[] {
    return this._itemStores;
  }

  _markItemAsLocallyCached(item,
                           isCached) {
    item.isLocallyCached = isCached;
  }

  markReviewAsIgnored(writtenReview: DtrUserReview): void {
    writtenReview.isIgnored = true;
  }

  markItemAsReviewedAndSubmitted(item: DimItem,
                                 userReview) {
    this._markItemAsLocallyCached(item, false);
    const matchingItem = this._getMatchingItem(item);

    if (!matchingItem) {
      return;
    }

    // remove their old review from the local cache
    matchingItem.reviews = (matchingItem.reviews) ?
       matchingItem.reviews.filter((review) => !review.isReviewer) :
       [];

    // and add their new review to the local cache
    matchingItem.reviews.unshift(userReview);
  }

  /**
   * Clears all items (in case of, say, platform re-selection).
   */
  clearAllItems() {
    this._itemStores = [];
  }

  /**
   * There's a 10 minute delay between posting an item review to the DTR API
   * and being able to fetch that review from it.
   * To prevent angry bug reports, we'll continue to hang on to local user review data for
   * 10 minutes, then we'll purge it (so that it can be re-pulled).
   *
   * Item is just an item from DIM's stores.
   */
  eventuallyPurgeCachedData(item: DimItem) {
    const tenMinutes = 1000 * 60 * 10;

    setTimeout(() => {
      const matchingItem = this._getMatchingItem(item);

      if (matchingItem) {
        matchingItem.reviews = [];
        matchingItem.reviewsDataFetched = false;
      }
    },
      tenMinutes);
  }
}

export { D2ReviewDataCache };
