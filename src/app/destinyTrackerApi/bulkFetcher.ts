import { ItemListBuilder } from './itemListBuilder';
import { ReviewDataCache } from './reviewDataCache';
import { handleErrors } from './trackerErrorHandler';
import { loadingTracker } from '../ngimport-more';
import { dtrFetch } from './dtr-service-helper';
import { D1ItemFetchResponse } from '../item-review/d1-dtr-api-types';
import { D1Store } from '../inventory/store-types';

class BulkFetcher {
  _reviewDataCache: ReviewDataCache;
  _itemListBuilder = new ItemListBuilder();
  constructor(reviewDataCache) {
    this._reviewDataCache = reviewDataCache;
  }

  _getBulkFetchPromise(stores): Promise<D1ItemFetchResponse[]> {
    if (!stores.length) {
      return Promise.resolve<D1ItemFetchResponse[]>([]);
    }

    const weaponList = this._itemListBuilder.getWeaponList(stores, this._reviewDataCache);

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
    this._getBulkFetchPromise(stores)
      .then((bulkRankings) => this.attachRankings(bulkRankings,
                                                  stores));
  }

  /**
   * Fetch the DTR community scores for all weapon items found in the supplied vendors.
   */
  bulkFetchVendorItems(vendorContainer) {
    const vendors = Object.values(vendorContainer);

    this._getBulkFetchPromise(vendors)
      .then((bulkRankings) => this.attachVendorRankings(bulkRankings,
                                                        vendors));
  }

  attachRankings(bulkRankings: D1ItemFetchResponse[] | null,
                 stores: D1Store[]) {
    if (!bulkRankings && !stores) {
      return;
    }

    if (bulkRankings) {
      bulkRankings.forEach((bulkRanking) => {
        this._reviewDataCache.addScore(bulkRanking);
      });
    }

    stores.forEach((store) => {
      store.items.forEach((storeItem) => {
        if (storeItem.reviewable) {
          const matchingItem = this._reviewDataCache.getRatingData(storeItem);

          if (matchingItem) {
            storeItem.ratingData = matchingItem;
          }
        }
      });
    });
  }

  attachVendorRankings(bulkRankings,
                       vendors) {
    if (!bulkRankings && !vendors) {
      return;
    }

    if (bulkRankings) {
      bulkRankings.forEach((bulkRanking) => {
        this._reviewDataCache.addScore(bulkRanking);
      });
    }

    vendors.forEach((vendor) => {
      vendor.allItems.forEach((vendorItemContainer) => {
        const vendorItem = vendorItemContainer.item;

        const matchingItem = this._reviewDataCache.getRatingData(vendorItem);

        if (matchingItem) {
          vendorItem.ratingData = matchingItem;
        }
      });
    });
  }
}

export { BulkFetcher };
