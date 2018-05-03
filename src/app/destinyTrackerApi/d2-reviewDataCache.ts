import * as _ from 'underscore';
import { D2ItemTransformer } from './d2-itemTransformer';
import { DestinyVendorSaleItemComponent } from 'bungie-api-ts/destiny2';
import { D2Item } from '../inventory/item-types';
import { D2CachedItem, DtrItemFetchResponse, WorkingD2Rating, DtrUserReview, DtrItemReviewsResponse } from '../item-review/d2-dtr-api-types';

/**
 * Cache of review data.
 * Mixes and matches remote as well as local data to cut down on chatter and prevent data loss on store refreshes.
 * Tailored for the Destiny 2 version.
 */
class D2ReviewDataCache {
  _maxTotalVotes: number;
  _itemStores: D2CachedItem[];
  _itemTransformer: D2ItemTransformer;

  constructor() {
    this._itemTransformer = new D2ItemTransformer();
    this._itemStores = [];
    this._maxTotalVotes = 0;
  }

  _getMatchingItem(item?: D2Item | DestinyVendorSaleItemComponent,
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
  getRatingData(item?: D2Item | DestinyVendorSaleItemComponent,
                itemHash?: number): D2CachedItem | null {
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

  _getDownvoteMultiplier(dtrRating: DtrItemFetchResponse) {
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

  _setMaximumTotalVotes(bulkRankings: DtrItemFetchResponse[]) {
    this._maxTotalVotes = _.max(_.pluck(_.pluck(bulkRankings, 'votes'), 'total'));
  }

  /**
   * Add (and track) the community scores.
   */
  addScores(bulkRankings: DtrItemFetchResponse[]) {
    if (bulkRankings) {
      this._setMaximumTotalVotes(bulkRankings);

      bulkRankings.forEach((bulkRanking) => {
        const matchingStore = this._itemStores.find((ci) => ci.referenceId === bulkRanking.referenceId);

        if (matchingStore) {
          matchingStore.fetchResponse = bulkRanking;
        } else {
          this._addScore(bulkRanking);
        }
      });
    }
  }

  /**
   * Add (and track) the community score.
   */
  _addScore(dtrRating: DtrItemFetchResponse) {
    const dimScore = this._getScore(dtrRating);

    const cachedItem: D2CachedItem = {
      referenceId: dtrRating.referenceId,
      dimScore,
      fetchResponse: dtrRating,
      lastUpdated: new Date()
    };

    this._itemStores.push(cachedItem);
  }

  /**
   * Keep track of this user review for this (DIM store) item.
   * This supports the workflow where a user types a review but doesn't submit it, a store refresh
   * happens in the background, then they go back to the item.  Or they post data and the DTR API
   * is still feeding back cached data or processing it or whatever.
   * The expectation is that this will be building on top of reviews data that's already been supplied.
   */
  addUserReviewData(item: D2Item,
                    userReview: WorkingD2Rating) {
    const cachedItem = this._getMatchingItem(item);

    if (!cachedItem) {
      return;
    }

    cachedItem.userReview = userReview;
  }

  /**
   * Keep track of expanded item review data from the DTR API for this DIM store item.
   * The expectation is that this will be building on top of community score data that's already been supplied.
   */
  addReviewsData(reviewsData: DtrItemReviewsResponse) {
    const cachedItem = this._itemStores.find((s) => s.referenceId === reviewsData.referenceId);

    if (!cachedItem) {
      return;
    }

    cachedItem.lastUpdated = new Date();
    cachedItem.reviewsResponse = reviewsData;
  }

  /**
   * Fetch the collection of review data that we've stored locally.
   */
  getItemStores(): D2CachedItem[] {
    return this._itemStores;
  }

  markReviewAsIgnored(writtenReview: DtrUserReview): void {
    writtenReview.isIgnored = true;
  }

  markItemAsReviewedAndSubmitted(
    item: D2Item,
    userReview
  ) {
    const cachedItem = this._getMatchingItem(item);

    if ((!cachedItem) || (!cachedItem.reviewsResponse)) {
      return;
    }

    // remove their old review from the local cache
    cachedItem.reviewsResponse.reviews = (cachedItem.reviewsResponse.reviews) ?
       cachedItem.reviewsResponse.reviews.filter((review) => !review.isReviewer) :
       [];

    // and add their new review to the local cache
    cachedItem.reviewsResponse.reviews.unshift(userReview);
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
  eventuallyPurgeCachedData(item: D2Item) {
    const tenMinutes = 1000 * 60 * 10;

    setTimeout(() => {
      const cachedItem = this._getMatchingItem(item);

      if (cachedItem) {
        cachedItem.reviewsResponse = undefined;
      }
    },
      tenMinutes);
  }
}

export { D2ReviewDataCache };
