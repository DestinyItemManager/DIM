import { DestinyVendorSaleItemComponent } from 'bungie-api-ts/destiny2';
import { D2Item } from '../inventory/item-types';
import {
  D2RatingData,
  D2ItemFetchResponse,
  WorkingD2Rating,
  D2ItemUserReview
} from '../item-review/d2-dtr-api-types';
import { dtrTextReviewMultiplier } from './dtr-service-helper';
import { updateRatings, clearRatings } from '../item-review/actions';
import store from '../store/store';
import { getReviewKey, getD2Roll, D2ReviewKey } from './d2-itemTransformer';
import { getItemStoreKey } from '../item-review/reducer';
import produce from 'immer';

/**
 * Cache of review data.
 * Mixes and matches remote as well as local data to cut down on chatter and prevent data loss on store refreshes.
 * Tailored for the Destiny 2 version.
 */
class D2ReviewDataCache {
  _itemStores: { [key: string]: D2RatingData } = {};

  _getMatchingItem(
    item?: D2Item | DestinyVendorSaleItemComponent,
    itemHash?: number
  ): D2RatingData | undefined {
    const reviewKey = getReviewKey(item, itemHash);

    return this._getMatchingItemByReviewKey(reviewKey);
  }

  _replaceRatingData(newRatingData: D2RatingData) {
    this._itemStores = {
      ...this._itemStores,
      [getItemStoreKey(newRatingData.referenceId, newRatingData.roll)]: newRatingData
    };
  }

  _getMatchingItemByReviewKey(reviewKey: D2ReviewKey): D2RatingData | undefined {
    return this._itemStores[
      getItemStoreKey(reviewKey.referenceId, getD2Roll(reviewKey.availablePerks))
    ];
  }

  _getBlankWorkingD2Rating(): WorkingD2Rating {
    return {
      voted: 0,
      pros: '',
      cons: '',
      text: '',
      mode: 0,
      treatAsSubmitted: false
    };
  }

  _addAndReturnBlankItem(
    item?: D2Item | DestinyVendorSaleItemComponent,
    itemHash?: number
  ): D2RatingData {
    const reviewKey = getReviewKey(item, itemHash);
    const blankItem: D2RatingData = {
      referenceId: reviewKey.referenceId,
      roll: getD2Roll(reviewKey.availablePerks),
      lastUpdated: new Date(),
      userReview: this._getBlankWorkingD2Rating(),
      overallScore: 0,
      ratingCount: 0,
      highlightedRatingCount: 0
    };

    this._itemStores = produce(this._itemStores, (draft) => {
      draft[getItemStoreKey(blankItem.referenceId, blankItem.roll)] = blankItem;
    });
    return blankItem;
  }

  /**
   * Get the locally-cached review data for the given item from the DIM store.
   * Creates a blank rating cache item if it doesn't.
   */
  getRatingData(item?: D2Item | DestinyVendorSaleItemComponent, itemHash?: number): D2RatingData {
    const cachedItem = this._getMatchingItem(item, itemHash);

    if (cachedItem) {
      return cachedItem;
    }

    return this._addAndReturnBlankItem(item, itemHash);
  }

  _getScore(dtrRating: D2ItemFetchResponse, maxTotalVotes: number): number {
    const downvoteMultipler = getDownvoteMultiplier(dtrRating, maxTotalVotes);

    const totalVotes =
      dtrRating.votes.total + dtrRating.reviewVotes.total * dtrTextReviewMultiplier;
    const totalDownVotes =
      dtrRating.votes.downvotes + dtrRating.reviewVotes.downvotes * dtrTextReviewMultiplier;

    const rating = ((totalVotes - totalDownVotes * downvoteMultipler) / totalVotes) * 5;

    if (rating < 1 && dtrRating.votes.total > 0) {
      return 1;
    }

    return roundToAtMostOneDecimal(rating);
  }

  /**
   * Add (and track) the community scores.
   */
  addScores(bulkRankings: D2ItemFetchResponse[]) {
    if (bulkRankings && bulkRankings.length > 0) {
      const maxTotalVotes = bulkRankings.reduce((max, fr) => Math.max(fr.votes.total, max), 0);

      bulkRankings.forEach((bulkRanking) => {
        const cachedItem = this._getMatchingItemByReviewKey(bulkRanking);

        if (cachedItem) {
          const updatedCachedItem: D2RatingData = {
            ...cachedItem,
            lastUpdated: new Date(),
            overallScore: this._getScore(bulkRanking, maxTotalVotes),
            ratingCount: bulkRanking.votes.total
          };

          this._replaceRatingData(updatedCachedItem);
        } else {
          this._addScore(bulkRanking, maxTotalVotes);
        }
      });

      store.dispatch(updateRatings({ itemStores: this._itemStores }));
    }
  }

  /**
   * Add (and track) the community score.
   */
  _addScore(dtrRating: D2ItemFetchResponse, maxTotalVotes: number) {
    const dimScore = this._getScore(dtrRating, maxTotalVotes);

    const cachedItem: D2RatingData = {
      referenceId: dtrRating.referenceId,
      roll: getD2Roll(dtrRating.availablePerks),
      overallScore: dimScore,
      lastUpdated: new Date(),
      userReview: this._getBlankWorkingD2Rating(),
      ratingCount: dtrRating.votes.total,
      highlightedRatingCount: 0 // bugbug: D2 API doesn't seem to be returning highlighted ratings in fetch
    };

    this._itemStores = produce(this._itemStores, (draft) => {
      draft[getItemStoreKey(cachedItem.referenceId, cachedItem.roll)] = cachedItem;
    });
  }

  /**
   * Keep track of this user review for this (DIM store) item.
   * This supports the workflow where a user types a review but doesn't submit it, a store refresh
   * happens in the background, then they go back to the item.  Or they post data and the DTR API
   * is still feeding back cached data or processing it or whatever.
   * The expectation is that this will be building on top of reviews data that's already been supplied.
   */
  addUserReviewData(item: D2Item, userReview: WorkingD2Rating) {
    const cachedItem = this._getMatchingItem(item);

    if (!cachedItem) {
      return;
    }

    const updatedCachedItem: D2RatingData = { ...cachedItem, userReview };

    this._replaceRatingData(updatedCachedItem);

    store.dispatch(updateRatings({ itemStores: this._itemStores }));
  }

  /**
   * Fetch the collection of review data that we've stored locally.
   */
  getItemStores(): D2RatingData[] {
    return Object.values(this._itemStores);
  }

  markReviewAsIgnored(writtenReview: D2ItemUserReview): void {
    writtenReview.isIgnored = true;
  }

  /**
   * Clears all items (in case of, say, platform re-selection).
   */
  clearAllItems() {
    this._itemStores = {};
    store.dispatch(clearRatings());
  }
}

export { D2ReviewDataCache };

function roundToAtMostOneDecimal(rating: number): number {
  if (!rating) {
    return 0;
  }

  return Math.round(rating * 10) / 10;
}

function getDownvoteMultiplier(dtrRating: D2ItemFetchResponse, maxTotalVotes: number) {
  if (dtrRating.votes.total > maxTotalVotes * 0.75) {
    return 1;
  }

  if (dtrRating.votes.total > maxTotalVotes * 0.5) {
    return 1.5;
  }

  if (dtrRating.votes.total > maxTotalVotes * 0.25) {
    return 2;
  }

  return 2.5;
}
