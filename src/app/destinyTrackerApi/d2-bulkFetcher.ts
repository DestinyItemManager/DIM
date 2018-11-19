import { D2ReviewDataCache } from './d2-reviewDataCache';
import {
  DestinyVendorSaleItemComponent,
  DestinyVendorItemDefinition
} from 'bungie-api-ts/destiny2';
import { loadingTracker } from '../shell/loading-tracker';
import { handleD2Errors } from './d2-trackerErrorHandler';
import { D2Store } from '../inventory/store-types';
import { dtrFetch } from './dtr-service-helper';
import { D2ItemFetchResponse, D2ItemFetchRequest } from '../item-review/d2-dtr-api-types';
import { getVendorItemList, getItemList } from './d2-itemListBuilder';
import * as _ from 'lodash';

class D2BulkFetcher {
  _reviewDataCache: D2ReviewDataCache;

  constructor(reviewDataCache) {
    this._reviewDataCache = reviewDataCache;
  }

  _getBulkFetchPromise(
    stores: D2Store[],
    platformSelection: number,
    mode: number
  ): Promise<D2ItemFetchResponse[]> {
    if (!stores.length) {
      return Promise.resolve<D2ItemFetchResponse[]>([]);
    }

    const itemList = getItemList(stores, this._reviewDataCache);
    return this._getBulkItems(itemList, platformSelection, mode);
  }

  _getVendorBulkFetchPromise(
    platformSelection: number,
    mode: number,
    vendorSaleItems?: DestinyVendorSaleItemComponent[],
    vendorItems?: DestinyVendorItemDefinition[]
  ): Promise<D2ItemFetchResponse[]> {
    if ((vendorSaleItems && !vendorSaleItems.length) || (vendorItems && !vendorItems.length)) {
      return Promise.resolve<D2ItemFetchResponse[]>([]);
    }

    const vendorDtrItems = getVendorItemList(this._reviewDataCache, vendorSaleItems, vendorItems);
    return this._getBulkItems(vendorDtrItems, platformSelection, mode);
  }

  async _getBulkItems(
    itemList: D2ItemFetchRequest[],
    platformSelection: number,
    mode: number
  ): Promise<D2ItemFetchResponse[]> {
    if (!itemList.length) {
      return Promise.resolve<D2ItemFetchResponse[]>([]);
    }

    // DTR admins requested we only make requests in batches of 10, and not in parallel
    const arrayOfArrays: D2ItemFetchRequest[][] = _.chunk(itemList, 10);

    const results: D2ItemFetchResponse[] = [];

    for (const arraySlice of arrayOfArrays) {
      const promiseSlice = dtrFetch(
        `https://db-api.destinytracker.com/api/external/reviews/fetch?platform=${platformSelection}&mode=${mode}`,
        arraySlice
      ).then(handleD2Errors, handleD2Errors);

      try {
        loadingTracker.addPromise(promiseSlice);

        const result = await promiseSlice;
        results.push(...result);
      } catch (error) {
        console.error(error);
      }
    }

    return results;
  }

  /**
   * Fetch the DTR community scores for all weapon items found in the supplied stores.
   */
  bulkFetch(stores: D2Store[], platformSelection: number, mode: number) {
    this._getBulkFetchPromise(stores, platformSelection, mode).then((bulkRankings) =>
      this.attachRankings(bulkRankings, stores)
    );
  }

  _addScores(bulkRankings: D2ItemFetchResponse[]): void {
    this._reviewDataCache.addScores(bulkRankings);
  }

  getCache(): D2ReviewDataCache {
    return this._reviewDataCache;
  }

  /**
   * Fetch the DTR community scores for all weapon items found in the supplied vendors.
   */
  bulkFetchVendorItems(
    platformSelection: number,
    mode: number,
    vendorSaleItems?: DestinyVendorSaleItemComponent[],
    vendorItems?: DestinyVendorItemDefinition[]
  ): Promise<void> {
    return this._getVendorBulkFetchPromise(
      platformSelection,
      mode,
      vendorSaleItems,
      vendorItems
    ).then((bulkRankings) => this._addScores(bulkRankings));
  }

  attachRankings(bulkRankings: D2ItemFetchResponse[] | null, stores: D2Store[]): void {
    if (!bulkRankings && !stores) {
      return;
    }

    if (bulkRankings) {
      this._addScores(bulkRankings);
    }

    stores.forEach((store) => {
      store.items.forEach((storeItem) => {
        if (storeItem.reviewable) {
          const ratingData = this._reviewDataCache.getRatingData(storeItem);

          storeItem.dtrRating = ratingData;
        }
      });
    });
  }
}

export { D2BulkFetcher };
