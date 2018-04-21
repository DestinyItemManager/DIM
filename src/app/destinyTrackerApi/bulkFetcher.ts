import { $q, $http } from 'ngimport';
import { ItemListBuilder } from './itemListBuilder';
import { ReviewDataCache } from './reviewDataCache';
import { D1ItemFetchResponse } from '../item-review/destiny-tracker.service';
import { IPromise } from 'angular';
import { handleErrors } from './trackerErrorHandler';

class BulkFetcher {
  _reviewDataCache: ReviewDataCache;
  _loadingTracker: any;
  _itemListBuilder = new ItemListBuilder();
  constructor(loadingTracker, reviewDataCache) {
    this._loadingTracker = loadingTracker;
    this._reviewDataCache = reviewDataCache;
  }

  _getBulkWeaponDataEndpointPost(gunList) {
    return {
      method: 'POST',
      url: 'https://reviews-api.destinytracker.net/api/weaponChecker/fetch',
      data: gunList,
      dataType: 'json'
    };
  }

  _getBulkFetchPromise(stores): IPromise<D1ItemFetchResponse[]> {
    if (!stores.length) {
      const emptyResponse: D1ItemFetchResponse[] = [];
      return $q.resolve(emptyResponse);
    }

    const weaponList = this._itemListBuilder.getWeaponList(stores, this._reviewDataCache);

    if (!weaponList.length) {
      const emptyResponse: D1ItemFetchResponse[] = [];
      return $q.resolve(emptyResponse);
    }

    const promise = $q
              .when(this._getBulkWeaponDataEndpointPost(weaponList))
              .then($http)
              .then(handleErrors)
              .then((response) => response.data);

    this._loadingTracker.addPromise(promise);

    return promise as IPromise<D1ItemFetchResponse[]>;
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
