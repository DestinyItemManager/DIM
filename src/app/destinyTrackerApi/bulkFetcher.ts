import { ReviewDataCache } from './reviewDataCache';
import { D1ItemFetchResponse } from '../item-review/destiny-tracker.service';
import { handleErrors } from './trackerErrorHandler';
import { loadingTracker } from '../ngimport-more';
import { dtrFetch } from './dtr-service-helper';
import { getWeaponList } from './itemListBuilder';

class BulkFetcher {
  _reviewDataCache: ReviewDataCache;
  constructor(reviewDataCache) {
    this._reviewDataCache = reviewDataCache;
  }

  _getBulkFetchPromise(stores): Promise<D1ItemFetchResponse[]> {
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
  bulkFetch(storesContainer) {
    const stores = Object.values(storesContainer);

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
                 stores) {
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
            storeItem.dtrRating = matchingItem.rating;
            storeItem.dtrRatingCount = matchingItem.ratingCount;
            storeItem.dtrHighlightedRatingCount = matchingItem.highlightedRatingCount;
            storeItem.userRating = matchingItem.userRating;
            storeItem.userReview = matchingItem.review;
            storeItem.pros = matchingItem.pros;
            storeItem.cons = matchingItem.cons;
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
          vendorItem.dtrRating = matchingItem.rating;
          vendorItem.dtrRatingCount = matchingItem.ratingCount;
          vendorItem.dtrHighlightedRatingCount = matchingItem.highlightedRatingCount;
          vendorItem.userRating = matchingItem.userRating;
          vendorItem.userReview = matchingItem.review;
          vendorItem.pros = matchingItem.pros;
          vendorItem.cons = matchingItem.cons;
        }
      });
    });
  }
}

export { BulkFetcher };
