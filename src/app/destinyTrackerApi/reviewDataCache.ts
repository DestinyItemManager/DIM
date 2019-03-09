import * as _ from 'lodash';
import { D1Item } from '../inventory/item-types';
import { D1ItemFetchResponse } from '../item-review/d1-dtr-api-types';
import { translateToDtrWeapon } from './itemTransformer';
import store from '../store/store';
import { updateRatings } from '../item-review/actions';
import { getItemStoreKey } from '../item-review/reducer';
import produce from 'immer';
import { DtrRating } from '../item-review/dtr-api-types';

/**
 * Cache of review data.
 * Mixes and matches remote as well as local data to cut down on chatter and prevent data loss on store refreshes.
 */
export class ReviewDataCache {
  _itemStores: { [key: string]: DtrRating } = {};

  _getMatchingItem(item: D1Item): DtrRating | undefined {
    const dtrItem = translateToDtrWeapon(item);
    return this._itemStores[getItemStoreKey(dtrItem.referenceId, dtrItem.roll)];
  }

  _replaceRatingData(oldRatingData: DtrRating, newRatingData: DtrRating) {
    const oldItemKey = getItemStoreKey(oldRatingData.referenceId, oldRatingData.roll);
    if (!this._itemStores[oldItemKey]) {
      return;
    }

    this._itemStores = produce(this._itemStores, (draft) => {
      delete draft[oldItemKey];
      draft[getItemStoreKey(newRatingData.referenceId, newRatingData.roll)] = newRatingData;
    });
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
      const updatedCachedItem: DtrRating = {
        ...previouslyCachedItem,
        lastUpdated: new Date(),
        overallScore: dtrRating.rating ? dtrRating.rating : 0,
        ratingCount: dtrRating.ratingCount
      };

      this._replaceRatingData(previouslyCachedItem, updatedCachedItem);

      dtrRating.highlightedRatingCount = dtrRating.highlightedRatingCount;
    } else {
      const cachedItem: DtrRating = {
        referenceId: parseInt(dtrRating.referenceId, 10),
        lastUpdated: new Date(),
        overallScore: dtrRating.rating || 0,
        ratingCount: dtrRating.ratingCount,
        highlightedRatingCount: dtrRating.highlightedRatingCount,
        roll: dtrRating.roll
      };

      this._itemStores = produce(this._itemStores, (draft) => {
        draft[getItemStoreKey(cachedItem.referenceId, cachedItem.roll)] = cachedItem;
      });

      store.dispatch(updateRatings({ itemStores: this._itemStores }));
    }
  }

  /**
   * Fetch the collection of review data that we've stored locally.
   */
  getItemStores(): DtrRating[] {
    return Object.values(this._itemStores);
  }
}
