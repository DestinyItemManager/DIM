import { ReviewDataCache } from './reviewDataCache';
import { handleErrors } from './trackerErrorHandler';
import { loadingTracker } from '../shell/loading-tracker';
import { dtrFetch } from './dtr-service-helper';
import { D1ItemFetchResponse } from '../item-review/d1-dtr-api-types';
import { D1Store } from '../inventory/store-types';
import { Vendor } from '../vendors/vendor.service';
import { getWeaponList } from './itemListBuilder';
import store from '../store/store';
import { updateRatings } from '../item-review/actions';

class BulkFetcher {
  _reviewDataCache: ReviewDataCache;
  constructor(reviewDataCache) {
    this._reviewDataCache = reviewDataCache;
  }

  _getBulkFetchPromise(stores: (D1Store | Vendor)[]): Promise<D1ItemFetchResponse[]> {
    if (!stores.length) {
      return Promise.resolve<D1ItemFetchResponse[]>([]);
    }

    const weaponList = getWeaponList(stores, this._reviewDataCache);

    if (!weaponList.length) {
      return Promise.resolve<D1ItemFetchResponse[]>([]);
    }

    const promise = dtrFetch(
      'https://reviews-api.destinytracker.net/api/weaponChecker/fetch',
      weaponList
    ).then(handleErrors, handleErrors);

    loadingTracker.addPromise(promise);

    return promise;
  }

  /**
   * Fetch the DTR community scores for all weapon items found in the supplied stores.
   */
  bulkFetch(stores: D1Store[]) {
    this._getBulkFetchPromise(stores).then((bulkRankings) =>
      this.attachRankings(bulkRankings, stores)
    );
  }

  /**
   * Fetch the DTR community scores for all weapon items found in the supplied vendors.
   */
  bulkFetchVendorItems(vendorContainer: { [key: number]: Vendor }) {
    const vendors = Object.values(vendorContainer);

    return this._getBulkFetchPromise(vendors).then((bulkRankings) =>
      this.attachVendorRankings(bulkRankings, vendors)
    );
  }

  attachRankings(bulkRankings: D1ItemFetchResponse[] | null, stores: D1Store[]) {
    if (!bulkRankings && !stores) {
      return;
    }

    if (bulkRankings && bulkRankings.length > 0) {
      bulkRankings.forEach((bulkRanking) => {
        this._reviewDataCache.addScore(bulkRanking);
      });

      store.dispatch(
        updateRatings({ maxTotalVotes: 0, itemStores: this._reviewDataCache._itemStores })
      );
    }

    stores.forEach((store) => {
      store.items.forEach((storeItem) => {
        if (storeItem.reviewable) {
          const matchingItem = this._reviewDataCache.getRatingData(storeItem);

          storeItem.dtrRating = matchingItem;
        }
      });
    });
  }

  attachVendorRankings(bulkRankings: D1ItemFetchResponse[], vendors: Vendor[]) {
    if (!bulkRankings && !vendors) {
      return;
    }

    if (bulkRankings) {
      bulkRankings.forEach((bulkRanking) => {
        this._reviewDataCache.addScore(bulkRanking);
      });
    }

    vendors.forEach((vendor) => {
      vendor.allItems.forEach((vendorItem) => {
        const matchingItem = this._reviewDataCache.getRatingData(vendorItem.item);

        if (matchingItem) {
          vendorItem.item.dtrRating = matchingItem;
        }
      });
    });

    store.dispatch(
      updateRatings({ maxTotalVotes: 0, itemStores: this._reviewDataCache._itemStores })
    );
  }
}

export { BulkFetcher };
