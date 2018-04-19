import { $q, $http } from 'ngimport';
import { ItemListBuilder } from './itemListBuilder';
import { TrackerErrorHandler } from './trackerErrorHandler';
import { ReviewDataCache } from './reviewDataCache';
import { D1ItemFetchResponse, D1ItemReviewResponse } from '../item-review/destiny-tracker.service';

class BulkFetcher {
  _reviewDataCache: ReviewDataCache;
  _loadingTracker: any;
  _trackerErrorHandler: TrackerErrorHandler;
  _itemListBuilder: any;
  constructor(loadingTracker, reviewDataCache) {
    this._itemListBuilder = new ItemListBuilder();
    this._trackerErrorHandler = new TrackerErrorHandler();
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

  _getBulkFetchPromise(stores) {
    if (!stores.length) {
      return $q.resolve();
    }

    const weaponList = this._itemListBuilder.getWeaponList(stores, this._reviewDataCache);

    if (!weaponList.length) {
      return $q.resolve();
    }

    const promise = $q
              .when(this._getBulkWeaponDataEndpointPost(weaponList))
              .then($http)
              .then(this._trackerErrorHandler.handleErrors.bind(this._trackerErrorHandler), this._trackerErrorHandler.handleErrors.bind(this._trackerErrorHandler))
              .then((response) => response.data);

    this._loadingTracker.addPromise(promise);

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

    const self = this;

    if (bulkRankings) {
      bulkRankings.forEach((bulkRanking) => {
        self._reviewDataCache.addScore(bulkRanking);
      });
    }

    vendors.forEach((vendor) => {
      vendor.allItems.forEach((vendorItemContainer) => {
        const vendorItem = vendorItemContainer.item;

        const matchingItem = self._reviewDataCache.getRatingData(vendorItem);

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
